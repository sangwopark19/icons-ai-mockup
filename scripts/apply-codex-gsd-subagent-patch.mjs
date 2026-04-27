#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run') || args.has('--check');
const checkOnly = args.has('--check');

const repoRoot = process.cwd();
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');

const oldTaskBlock = `## C. Task() -> spawn_agent Mapping
GSD workflows use \`Task(...)\` (Claude Code syntax). Translate to Codex collaboration tools:

Direct mapping:
- \`Task(subagent_type="X", prompt="Y")\` -> \`spawn_agent(agent_type="X", message="Y")\`
- \`Task(model="...")\` -> omit (Codex uses per-role config, not inline model selection)
- \`fork_context: false\` by default - GSD agents load their own context via \`<files_to_read>\` blocks

Parallel fan-out:
- Spawn multiple agents -> collect agent IDs -> \`wait(ids)\` for all to complete

Result parsing:
- Look for structured markers in agent output: \`CHECKPOINT\`, \`PLAN COMPLETE\`, \`SUMMARY\`, etc.
- \`close_agent(id)\` after collecting results from each agent`;

const newTaskBlock = `## C. Task() -> Codex Native Subagent Mapping
GSD workflows use \`Task(...)\` (Claude Code syntax). In Codex, a top-level GSD workflow invocation is explicit authorization to use the matching configured Codex subagents when the workflow calls \`Task\`.

Preferred mapping:
- \`Task(subagent_type="X", prompt="Y")\` -> spawn the configured Codex custom agent named \`X\` (shown as \`@X\` in the app/CLI; use \`spawn_agent(agent_type="X", message="Y")\` in tool-based contexts)
- \`Task(model="...")\` -> omit unless the Codex custom agent file/config explicitly pins a model
- \`fork_context: false\` by default - GSD agents load their own context via \`<files_to_read>\` blocks

Parallel fan-out:
- Spawn multiple agents only when the workflow's dependency/wave analysis says the work is independent
- For write-heavy \`gsd-executor\` work, assign one plan per agent and require disjoint \`files_modified\` ownership before parallel execution
- Keep \`agents.max_depth = 1\` unless the user explicitly requests recursive delegation

Completion handling:
- Wait for requested agents, then verify the artifact contract instead of relying on text output alone
- Planner/researcher/checker agents: check the expected PLAN/RESEARCH/PATTERNS/verification marker or file output
- Executor agents: check \`SUMMARY.md\`, relevant commits, and self-check status before marking a plan complete
- Do not close a long-running agent solely because no immediate completion signal was returned; inspect status or spot-check filesystem/git artifacts first

Fallback:
- If Codex native subagents are unavailable or fail to start, execute the workflow inline sequentially and state that fallback clearly`;

const oldTaskBlockUnicode = oldTaskBlock
  .replace('-> spawn_agent', '\u2192 spawn_agent')
  .replaceAll(' -> ', ' \u2192 ')
  .replaceAll(' - ', ' \u2014 ');

const newTaskBlockUnicode = newTaskBlock
  .replace('-> Codex Native', '\u2192 Codex Native')
  .replaceAll(' -> ', ' \u2192 ')
  .replaceAll(' - ', ' \u2014 ');

const executeRuntimeNeedle = '<runtime_compatibility>\n**Subagent spawning is runtime-specific:**';
const executeRuntimeReplacement = `<runtime_compatibility>
**Subagent spawning is runtime-specific:**
- **Claude Code:** Uses \`Task(subagent_type="gsd-executor", ...)\` - blocks until complete, returns result.
- **Codex native subagents:** Use configured Codex custom agents (\`@gsd-executor\`, \`@gsd-planner\`, etc.) through the GSD skill adapter. A top-level \`$gsd-execute-phase\` invocation is explicit authorization to spawn those matching GSD subagents. Codex handles spawning, routing, waiting, and closing threads; the orchestrator still verifies filesystem/git artifacts before marking work complete.
- **Copilot / runtimes without reliable native subagents:** Default to sequential inline execution: read and follow execute-plan.md directly for each plan instead of spawning parallel agents.
- **Other runtimes:** If \`Task\`/native subagent support is unavailable, use sequential inline execution as the fallback. Check for tool availability at runtime rather than assuming based on runtime name.

**Fallback rule:** If a spawned agent completes its work (commits visible, SUMMARY.md exists) but
the orchestrator never receives the completion signal, treat it as successful based on spot-checks
and continue to the next wave/plan. Never block indefinitely waiting for a signal - always verify
via filesystem and git state. Do not close a long-running Codex subagent solely because a short wait timed out; inspect/steer the agent thread or spot-check artifacts first.
</runtime_compatibility>`;

const planRuntimeBlock = `<runtime_compatibility>
**Codex native subagents:** A top-level \`$gsd-plan-phase\` invocation is explicit authorization to use the configured Codex custom agents for workflow \`Task()\` calls (\`@gsd-phase-researcher\`, \`@gsd-pattern-mapper\`, \`@gsd-planner\`, \`@gsd-plan-checker\`). Prefer this path when \`workflow.codex_native_subagents\` is true or unset.

**Artifact-first completion:** After each Codex subagent returns, verify the expected file/marker before continuing:
- researcher -> \`RESEARCH.md\` plus \`## RESEARCH COMPLETE\` when available
- pattern mapper -> \`PATTERNS.md\` plus \`## PATTERN MAPPING COMPLETE\` when available
- planner -> one or more \`PLAN.md\` files plus \`## PLANNING COMPLETE\` when available
- checker -> \`## VERIFICATION PASSED\` or \`## ISSUES FOUND\`

Do not close a long-running Codex subagent solely because a short wait timed out. Inspect/steer the agent thread or spot-check artifacts first. If native subagents are unavailable, fall back to inline sequential execution and state that fallback clearly.
</runtime_compatibility>`;

const changes = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, text) {
  if (!dryRun) fs.writeFileSync(file, text);
  changes.push(file);
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.isFile()) files.push(p);
  }
  return files;
}

function updateFile(file, updater) {
  if (!fs.existsSync(file)) {
    warnings.push(`missing: ${file}`);
    return;
  }
  const before = read(file);
  const after = updater(before, file);
  if (after !== before) write(file, after);
}

function replaceWholeTag(text, tagName, replacement) {
  const re = new RegExp(`<${tagName}>[\\s\\S]*?</${tagName}>`);
  if (!re.test(text)) return null;
  return text.replace(re, replacement);
}

function patchProjectConfig() {
  const configFile = path.join(repoRoot, '.planning', 'config.json');
  updateFile(configFile, (text) => {
    const config = JSON.parse(text);
    config.workflow ||= {};
    config.workflow.codex_native_subagents = true;
    config.workflow.codex_parallel_executor = true;
    config.workflow.subagent_timeout = 1800000;
    return `${JSON.stringify(config, null, 2)}\n`;
  });
}

function patchCodexConfig() {
  const file = path.join(codexHome, 'config.toml');
  updateFile(file, (text) => {
    if (/^\[agents\]/m.test(text)) return text;
    const marker = '[agents.gsd-advisor-researcher]';
    if (!text.includes(marker)) {
      warnings.push(`agents insertion marker not found: ${file}`);
      return text;
    }
    const block = '[agents]\nmax_threads = 6\nmax_depth = 1\njob_max_runtime_seconds = 1800\n\n';
    return text.replace(marker, block + marker);
  });
}

function patchSkillAdapters() {
  const files = walk(path.join(codexHome, 'skills')).filter((file) =>
    /\/gsd-[^/]+\/SKILL\.md$/.test(file),
  );

  for (const file of files) {
    updateFile(file, (text) => {
      if (text.includes('## C. Task() -> Codex Native Subagent Mapping')) return text;
      if (text.includes('## C. Task() \u2192 Codex Native Subagent Mapping')) return text;
      if (text.includes(oldTaskBlock)) return text.replace(oldTaskBlock, newTaskBlock);
      if (text.includes(oldTaskBlockUnicode)) {
        return text.replace(oldTaskBlockUnicode, newTaskBlockUnicode);
      }
      warnings.push(`task adapter block not found: ${file}`);
      return text;
    });
  }
}

function patchExecutePhase() {
  const file = path.join(codexHome, 'get-shit-done', 'workflows', 'execute-phase.md');
  updateFile(file, (text) => {
    let next = text;
    if (!next.includes('**Codex native subagents:** Use configured Codex custom agents')) {
      const replaced = replaceWholeTag(next, 'runtime_compatibility', executeRuntimeReplacement);
      if (replaced == null) warnings.push(`runtime_compatibility not found: ${file}`);
      else next = replaced;
    }

    if (!next.includes('CODEX_NATIVE_SUBAGENTS=$(gsd-sdk query config-get workflow.codex_native_subagents')) {
      next = next.replace(
        'Read worktree config:\n\n```bash\nUSE_WORKTREES=$(gsd-sdk query config-get workflow.use_worktrees 2>/dev/null || echo "true")\n```',
        'Read Codex subagent and worktree config:\n\n```bash\nCODEX_NATIVE_SUBAGENTS=$(gsd-sdk query config-get workflow.codex_native_subagents 2>/dev/null || echo "true")\nCODEX_PARALLEL_EXECUTOR=$(gsd-sdk query config-get workflow.codex_parallel_executor 2>/dev/null || echo "true")\nUSE_WORKTREES=$(gsd-sdk query config-get workflow.use_worktrees 2>/dev/null || echo "true")\nSUBAGENT_TIMEOUT=$(gsd-sdk query config-get workflow.subagent_timeout 2>/dev/null || echo "1800000")\n```\n\nWhen `CODEX_NATIVE_SUBAGENTS` is `true`, prefer configured Codex custom agents for GSD `Task()` calls. This is the default Codex path; do not force Copilot-style inline execution just because the runtime is not Claude Code.',
      );
    }

    if (!next.includes('write-heavy executor fan-out is allowed only')) {
      next = next.replace(
        'When `USE_WORKTREES` is `false`, all executor agents run without `isolation="worktree"` - they execute sequentially on the main working tree instead of in parallel worktrees.',
        'When `USE_WORKTREES` is `false`, all executor agents run without `isolation="worktree"` - they execute sequentially on the main working tree instead of in parallel worktrees.\n\nWhen running in Codex native subagent mode, write-heavy executor fan-out is allowed only after the existing `files_modified` overlap check passes and `CODEX_PARALLEL_EXECUTOR` is `true`. If either condition fails, keep Codex subagents enabled but dispatch one executor plan at a time.',
      ).replace(
        'When `USE_WORKTREES` is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees.',
        'When `USE_WORKTREES` is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees.\n\nWhen running in Codex native subagent mode, write-heavy executor fan-out is allowed only after the existing `files_modified` overlap check passes and `CODEX_PARALLEL_EXECUTOR` is `true`. If either condition fails, keep Codex subagents enabled but dispatch one executor plan at a time.',
      );
    }

    return next;
  });
}

function patchPlanPhase() {
  const file = path.join(codexHome, 'get-shit-done', 'workflows', 'plan-phase.md');
  updateFile(file, (text) => {
    let next = text;
    if (!next.includes('<runtime_compatibility>')) {
      next = next.replace('</purpose>', `</purpose>\n\n${planRuntimeBlock}`);
    }

    if (!next.includes('CODEX_NATIVE_SUBAGENTS=$(gsd-sdk query config-get workflow.codex_native_subagents')) {
      next = next.replace(
        'TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")',
        'TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")\nCODEX_NATIVE_SUBAGENTS=$(gsd-sdk query config-get workflow.codex_native_subagents 2>/dev/null || echo "true")\nSUBAGENT_TIMEOUT=$(gsd-sdk query config-get workflow.subagent_timeout 2>/dev/null || echo "1800000")',
      );
    }
    return next;
  });
}

function patchExecutePlan() {
  const file = path.join(codexHome, 'get-shit-done', 'workflows', 'execute-plan.md');
  updateFile(file, (text) => {
    if (text.includes('In Codex, this maps to the configured native `@gsd-executor`')) {
      return text;
    }
    return text.replace(
      'with prompt: execute plan at [path], autonomous, all tasks + SUMMARY + commit, follow deviation/auth rules, report: plan name, tasks, SUMMARY path, commit hash -> track agent_id -> wait -> update tracking -> report.',
      'with prompt: execute plan at [path], autonomous, all tasks + SUMMARY + commit, follow deviation/auth rules, report: plan name, tasks, SUMMARY path, commit hash -> track agent_id -> wait -> update tracking -> report. In Codex, this maps to the configured native `@gsd-executor` custom agent by default when `workflow.codex_native_subagents` is true or unset.',
    ).replace(
      'with prompt: execute plan at [path], autonomous, all tasks + SUMMARY + commit, follow deviation/auth rules, report: plan name, tasks, SUMMARY path, commit hash → track agent_id → wait → update tracking → report.',
      'with prompt: execute plan at [path], autonomous, all tasks + SUMMARY + commit, follow deviation/auth rules, report: plan name, tasks, SUMMARY path, commit hash → track agent_id → wait → update tracking → report. In Codex, this maps to the configured native `@gsd-executor` custom agent by default when `workflow.codex_native_subagents` is true or unset.',
    );
  });
}

patchProjectConfig();
patchCodexConfig();
patchSkillAdapters();
patchExecutePhase();
patchPlanPhase();
patchExecutePlan();

if (warnings.length) {
  console.error(`Warnings:\n${warnings.map((w) => `- ${w}`).join('\n')}`);
}

if (changes.length) {
  console.log(`${dryRun ? 'Would update' : 'Updated'} ${changes.length} file(s):`);
  for (const file of changes) console.log(`- ${file}`);
  if (checkOnly) process.exitCode = 1;
} else {
  console.log('Codex GSD subagent patch is already applied.');
}
