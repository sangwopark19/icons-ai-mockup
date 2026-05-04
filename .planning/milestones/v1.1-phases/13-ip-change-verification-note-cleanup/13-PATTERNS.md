# Phase 13: IP Change Verification Note Cleanup - Pattern Map

**Mapped:** 2026-04-30  
**Files analyzed:** 8 planned new/modified artifacts  
**Analogs found:** 8 / 8

## Scope Extraction

Phase 13 is documentation/audit cleanup, not runtime implementation. `13-RESEARCH.md` recommends updating active Phase 8 verification/smoke/validation/release-summary artifacts and adding Phase 13 verification/audit evidence. `13-VALIDATION.md` makes `13-AUDIT-CHECK.md` the Wave 0 artifact.

No source-code file is inferred as a default modification target. The requested source/test files are evidence sources for OIP-02 and transparent-background rejection.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` | verification artifact | transform + audit | `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` | exact |
| `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md` | smoke checklist | batch + manual verification | `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md` | exact |
| `.planning/phases/08-openai-ip-change-parity/08-VALIDATION.md` | validation strategy | batch + test mapping | `.planning/phases/08-openai-ip-change-parity/08-VALIDATION.md` | exact |
| `.planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` | release summary | transform + audit | `.planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` | exact |
| `.planning/phases/13-ip-change-verification-note-cleanup/13-VERIFICATION.md` | verification artifact | audit + traceability | `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` | role-match |
| `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` | deterministic audit artifact | batch + audit | `.planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md` | exact |
| `.planning/REQUIREMENTS.md` | requirements traceability | transform + audit | `.planning/REQUIREMENTS.md` | exact |
| `.planning/phases/13-ip-change-verification-note-cleanup/13-VALIDATION.md` | validation strategy | batch + sign-off | `.planning/phases/13-ip-change-verification-note-cleanup/13-VALIDATION.md` | exact |

## Pattern Assignments

### `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` (verification artifact, transform + audit)

**Analog:** `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md`

**Frontmatter/status pattern** (lines 1-20):

```markdown
---
phase: 08-openai-ip-change-parity
verified: 2026-04-24
status: human_needed
score: 4/4 must-haves verified
requirements:
  - PROV-01
  - OIP-01
  - OIP-02
  - OIP-03
overrides_applied: 0
gaps: []
human_verification:
  - test: Real OpenAI GPT Image 2 IP Change smoke
    expected: Live `gpt-image-2` edit request returns two usable candidates, captures request IDs, and sends no `background: "transparent"` or `input_fidelity`.
    why_human: Requires `OPENAI_API_KEY` and representative source/character sample images.
---
```

**Current OIP-02 evidence pattern** (lines 84-91):

```markdown
### Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| OIP-02 | SATISFIED, live smoke pending | v2 request carries preserve structure, fixed viewpoint/background, hardware, shadows, user instructions, and quality; prompt locks product/character invariants and forbidden GPT Image 2 params are omitted. |
```

**Cleanup target** (lines 109-117):

```markdown
### Residual Risks

- Real OpenAI behavior is still unproven without live request IDs and sample outputs.
- Browser UX is statically verified but not runtime-authenticated.
- The transparent-background checkbox is carried through as an option and OpenAI requests stay opaque as required; final transparent-output quality should be manually confirmed if transparency is expected as an end-user deliverable.
```

**Use this boundary from review fix** (source: `.planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md`, lines 13-15):

```markdown
- **CR-02:** Removed the unsupported transparent-background option from the OpenAI v2 IP Change UI and added backend guards rejecting OpenAI transparent-background requests until a real removal pipeline is wired.
```

**Planner action:** Replace only the stale residual-risk bullet. Preserve `status: human_needed` and the live OpenAI/browser UAT boundaries unless fresh credentials/browser evidence is added.

---

### `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md` (smoke checklist, batch + manual verification)

**Analog:** `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md`

**Checklist structure pattern** (lines 19-29):

```markdown
## Browser Verification

Check the authenticated product workflow at desktop and mobile widths:

- project page shows `IP 변경 v1` and `IP 변경 v2`
- v2 form defaults preserve structure, fixed viewpoint, and fixed background enabled
- v2 form keeps transparent background, hardware preservation, shadow removal, and user instructions available
- result page shows `v2`, two candidates, save, download, and disabled follow-ups
- history shows `v2` badge and reopens the result page
- no product screen visibly shows `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2`
```

**Preserve forbidden-parameter smoke pattern** (lines 49-55):

```markdown
Forbidden-parameter checklist:

- `background: "transparent"` not sent
- `input_fidelity` not sent
- request IDs captured
- output file path recorded
```

**Planner action:** Update the stale browser bullet at line 25 to list supported OIP-02 options without transparent output, for example structure/default locks, hardware preservation, shadow removal, user instructions, quality, and two candidates. Keep the forbidden-parameter checklist.

---

### `.planning/phases/08-openai-ip-change-parity/08-VALIDATION.md` (validation strategy, batch + test mapping)

**Analog:** `.planning/phases/08-openai-ip-change-parity/08-VALIDATION.md`

**Validation map pattern** (lines 37-47):

```markdown
## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | OIP-01, OIP-02 | T-08-01 | OpenAI service never sends API keys, image bytes, raw vendor body, `background: "transparent"`, or `input_fidelity` to product UI/logs | unit | `pnpm --filter @mockup-ai/api test` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | OIP-01, OIP-02 | — | v2 form sends `provider: "openai"`, `providerModel: "gpt-image-2"`, two-candidate output count, and mapped quality value | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
```

**Cleanup target** (lines 61-68):

```markdown
## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Transparent-background post-process quality | OIP-02 | Background removal quality cannot be fully validated by unit tests | Submit v2 with transparent option enabled, confirm `gpt-image-2` request stays opaque and final saved/downloaded asset follows the implemented post-process behavior. |
```

**Planner action:** Replace the manual-only transparent submission row with current behavior: IP Change v2 has no transparent UI and direct API submissions are rejected. Keep real OpenAI smoke/browser UAT as human-needed where already documented.

---

### `.planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` (release summary, transform + audit)

**Analog:** `.planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md`

**Summary frontmatter/key decision pattern** (lines 17-37):

```markdown
key-files:
  created:
    - apps/api/src/services/openai-image.service.ts
    - apps/api/src/services/__tests__/openai-image.service.test.ts
  modified:
    - apps/api/src/routes/generation.routes.ts
    - apps/api/src/services/generation.service.ts
key-decisions:
  - "OpenAI IP Change uses a separate openai-image.service.ts instead of mixing provider code into gemini.service.ts."
  - "Two v2 candidates are produced through one images.edit call with n=2."
  - "gpt-image-2 requests omit background and input_fidelity; transparent-background intent remains an app option, not an OpenAI request parameter."
patterns-established:
  - "OpenAI support IDs are stored in existing OpenAI fields and providerTrace without raw response bodies."
  - "Worker dispatch allows provider=openai only for mode=ip_change in Phase 8."
```

**Verification summary pattern** (lines 100-104):

```markdown
## Verification

- `pnpm --filter @mockup-ai/api test` - passed, 81 tests.
- `pnpm --filter @mockup-ai/api type-check` - passed.
- Acceptance greps confirmed `client.images.edit`, `model: 'gpt-image-2'`, required prompt sections, forbidden parameter tests, worker provider/model checks, and OpenAI metadata fields.
```

**Planner action:** Update the third key decision so it no longer says transparent-background intent remains an app option for IP Change v2. Use the Phase 8 review-fix language: UI removed the unsupported option and backend guards reject it.

---

### `.planning/phases/13-ip-change-verification-note-cleanup/13-VERIFICATION.md` (verification artifact, audit + traceability)

**Analog:** `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md`

**Report shape to copy** (source: `08-VERIFICATION.md`, lines 28-40):

```markdown
## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Users can enter OpenAI IP Change v2 from the same project context as Gemini/v1. | VERIFIED | `apps/web/src/app/projects/[id]/page.tsx` renders `IP 변경 v1`, `IP 변경 v2`, keeps `/ip-change`, and links v2 to `/ip-change/openai`. |

**Score:** 4/4 truths verified.
```

**Requirement coverage pattern to adapt** (source: `08-VERIFICATION.md`, lines 84-91):

```markdown
### Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| OIP-02 | SATISFIED, live smoke pending | v2 request carries preserve structure, fixed viewpoint/background, hardware, shadows, user instructions, and quality; prompt locks product/character invariants and forbidden GPT Image 2 params are omitted. |
```

**Planner action:** Create Phase 13 verification around one truth set:

- active Phase 8 docs no longer contain stale IP Change transparent-option claims;
- OIP-02 is evidenced through UI options, route/service rejection, OpenAI request omissions, and prompt mapping;
- live OpenAI/browser smoke remains inherited Phase 8 `human_needed` unless fresh evidence exists.

---

### `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` (deterministic audit artifact, batch + audit)

**Analog:** `.planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md`

**Frontmatter pattern** (lines 1-7):

```markdown
---
phase: 12-openai-sketch-verification-closure
artifact: deterministic-audit-check
created: 2026-04-30T04:42:04Z
status: passed_with_human_needed_osr03
requirements: [PROV-02, OSR-01, OSR-02, OSR-03]
---
```

**Local audit command table pattern** (lines 13-20):

```markdown
## Local Audit Commands

| Command | Status | Sanitized Result |
|---|---|---|
| `node /Users/sangwopark19/.codex/get-shit-done/bin/gsd-tools.cjs audit-open --json` | exit 0 | Open items remain, including Phase 09 `09-VERIFICATION.md` with status `human_needed`; no raw vendor response or secret content recorded here. |
| `gsd-sdk query audit-uat --raw` | exit 0 | Phase 09 verification file is discovered at `.planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md`; status remains `human_needed` with 5 human UAT items. |
```

**Deterministic fallback proof pattern** (lines 21-35):

````markdown
## Deterministic Fallback Proof

Proof target: `09-VERIFICATION.md exists and names PROV-02, OSR-01, OSR-02, OSR-03`.

Fallback command:

```bash
node -e "const fs=require('fs');const p='.planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md';if(!fs.existsSync(p)){throw new Error('09-VERIFICATION.md missing')}const s=fs.readFileSync(p,'utf8');const ids=['PROV-02','OSR-01','OSR-02','OSR-03'];for(const id of ids){if(!s.includes(id)){throw new Error(id+' missing from 09-VERIFICATION.md')}}console.log('Phase 9 verification coverage OK: '+ids.join(', '))"
```
````

**Evidence boundary pattern** (lines 48-62):

```markdown
## Current-Branch Evidence Boundary

This audit check relies on current workspace source checks and the Phase 12 Plan 12-02 command gate:

- `pnpm --filter @mockup-ai/api test` passed with 12 test files / 167 tests.
- `pnpm --filter @mockup-ai/api type-check` passed.
- `pnpm --filter @mockup-ai/web type-check` passed.

## Evidence Hygiene

This artifact records only sanitized command status, relative artifact paths, requirement IDs, and derived pass/fail status. It does not include API keys, raw approved images, raw image payloads, or raw vendor responses.
```

**Phase 13 command source** (source: `13-VALIDATION.md`, lines 41-45):

```markdown
| 13-01-01 | 01 | 1 | OIP-02 | T-13-01 | Active Phase 8 docs no longer claim IP Change v2 transparent option carry-through. | documentation gate | `! rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md .planning/phases/08-openai-ip-change-parity/08-SMOKE.md .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` | ✅ | ⬜ pending |
| 13-01-05 | 01 | 1 | OIP-02 | T-13-05 | Follow-up audit/UAT no longer reports the stale Phase 8 transparent-checkbox item. | audit | `gsd-sdk query audit-uat --raw` plus deterministic grep results recorded in `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` | ❌ W0 | ⬜ pending |
```

**Planner action:** Use the Phase 12 structure, but set Phase 13 proof targets to stale-claim absence plus OIP-02 evidence presence. Do not hand-edit historical milestone audit findings as proof.

---

### `.planning/REQUIREMENTS.md` (requirements traceability, transform + audit)

**Analog:** `.planning/REQUIREMENTS.md`

**Requirement definition pattern** (lines 17-21):

```markdown
### OpenAI IP Change

- [x] **OIP-01**: User can generate two OpenAI GPT Image 2 IP Change candidates from a source product image and a character reference image.
- [x] **OIP-02**: User can request OpenAI IP Change with structure, viewpoint, background, and hardware-preservation options.
- [x] **OIP-03**: User can save, review, and download OpenAI IP Change results through the existing project history flow.
```

**Out-of-scope boundary** (lines 59-65):

```markdown
## Out of Scope

| Feature | Reason |
|---------|--------|
| Direct transparent output from OpenAI generation | `gpt-image-2` does not support transparent backgrounds; existing post-process flow should be reused |
```

**Traceability row to update only after verification** (lines 71-79):

```markdown
| Requirement | Phase | Status |
|-------------|-------|--------|
| OIP-01 | Phase 8 | Pending |
| OIP-02 | Phase 13 | Pending |
| OIP-03 | Phase 8 | Pending |
```

**Planner action:** Change only the `OIP-02` traceability status after `13-VERIFICATION.md`, `13-AUDIT-CHECK.md`, stale-claim rg, and source/test evidence checks pass. Do not use Phase 13 to mark `OIP-01` or `OIP-03` complete.

---

### `.planning/phases/13-ip-change-verification-note-cleanup/13-VALIDATION.md` (validation strategy, batch + sign-off)

**Analog:** `.planning/phases/13-ip-change-verification-note-cleanup/13-VALIDATION.md`

**Frontmatter pattern** (lines 1-8):

```markdown
---
phase: 13
slug: ip-change-verification-note-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---
```

**Per-task verification map pattern** (lines 37-46):

```markdown
| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | OIP-02 | T-13-01 | Active Phase 8 docs no longer claim IP Change v2 transparent option carry-through. | documentation gate | `! rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md .planning/phases/08-openai-ip-change-parity/08-SMOKE.md .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` | ✅ | ⬜ pending |
| 13-01-05 | 01 | 1 | OIP-02 | T-13-05 | Follow-up audit/UAT no longer reports the stale Phase 8 transparent-checkbox item. | audit | `gsd-sdk query audit-uat --raw` plus deterministic grep results recorded in `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` | ❌ W0 | ⬜ pending |
```

**Wave 0/sign-off pattern** (lines 51-70):

```markdown
## Wave 0 Requirements

- [ ] `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` - deterministic follow-up audit artifact modeled after Phase 12 audit closure.

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter
```

**Planner action:** If execution updates this file, only mark statuses/sign-off after the corresponding artifact and commands exist. Do not mark `nyquist_compliant: true` before Wave 0 is satisfied.

## Shared Patterns

### Stale-Claim Gate

**Source:** `.planning/phases/13-ip-change-verification-note-cleanup/13-RESEARCH.md` lines 271-281 and `13-VALIDATION.md` lines 20-23  
**Apply to:** `08-VERIFICATION.md`, `08-SMOKE.md`, `08-VALIDATION.md`, `08-01-SUMMARY.md`, `13-AUDIT-CHECK.md`

```bash
rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" \
  .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md \
  .planning/phases/08-openai-ip-change-parity/08-SMOKE.md \
  .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md \
  .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md
```

Expected after cleanup: no matches.

### OIP-02 UI Option Evidence

**Source:** `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` lines 30-38 and 104-121  
**Apply to:** `08-VERIFICATION.md`, `13-VERIFICATION.md`, `13-AUDIT-CHECK.md`

```tsx
const [preserveStructure, setPreserveStructure] = useState(true);
const [preserveHardware, setPreserveHardware] = useState(false);
const [fixedBackground, setFixedBackground] = useState(true);
const [fixedViewpoint, setFixedViewpoint] = useState(true);
const [removeShadows, setRemoveShadows] = useState(false);
const [quality, setQuality] = useState<QualityValue>('medium');
const [userInstructions, setUserInstructions] = useState('');
const [hardwareSpecInput, setHardwareSpecInput] = useState('');
```

```tsx
body: JSON.stringify({
  projectId,
  mode: 'ip_change',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  sourceImagePath,
  characterImagePath,
  options: {
    preserveStructure,
    preserveHardware,
    fixedBackground,
    fixedViewpoint,
    removeShadows,
    userInstructions: userInstructions.trim() || undefined,
    hardwareSpecInput: preserveHardware ? hardwareSpecInput.trim() || undefined : undefined,
    outputCount: 2,
    quality,
  },
}),
```

### Route-Level Transparent Rejection

**Source:** `apps/api/src/routes/generation.routes.ts` lines 99-109  
**Apply to:** `08-VERIFICATION.md`, `13-VERIFICATION.md`, `13-AUDIT-CHECK.md`

```ts
if (
  value.provider === 'openai' &&
  value.mode === 'ip_change' &&
  value.options?.transparentBackground
) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['options', 'transparentBackground'],
    message: 'OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다',
  });
}
```

### Service-Level Transparent Rejection

**Source:** `apps/api/src/services/generation.service.ts` lines 175-177  
**Apply to:** `08-VERIFICATION.md`, `13-VERIFICATION.md`, `13-AUDIT-CHECK.md`

```ts
if (provider === 'openai' && input.mode === 'ip_change' && input.options?.transparentBackground) {
  throw new Error('OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다');
}
```

**Regression evidence source:** `apps/api/src/services/__tests__/generation.service.test.ts` lines 406-428

```ts
it('rejects OpenAI transparent-background requests until v2 supports removal output', async () => {
  await expect(
    generationService.create('u1', {
      projectId: 'proj1',
      mode: 'ip_change',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      sourceImagePath: 'uploads/u1/proj1/source.png',
      characterImagePath: 'characters/u1/character.png',
      options: {
        transparentBackground: true,
      },
    })
  ).rejects.toThrow('OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다');
});
```

### Forbidden GPT Image 2 Parameter Omission

**Source:** `apps/api/src/services/openai-image.service.ts` lines 143-151  
**Apply to:** `08-VERIFICATION.md`, `08-SMOKE.md`, `13-VERIFICATION.md`, `13-AUDIT-CHECK.md`

```ts
const response = (await client.images.edit({
  model: this.model,
  image: [sourceImage, characterImage],
  prompt,
  quality,
  n: 2,
  size: '1024x1024',
  output_format: 'png',
})) as OpenAIImageResponse;
```

**Test evidence source:** `apps/api/src/services/__tests__/openai-image.service.test.ts` lines 102-136

```ts
it('calls images.edit with GPT Image 2 and omits forbidden parameters', async () => {
  await service.generateIPChange('sk-test', pngBase64, pngBase64, {
    preserveStructure: true,
    transparentBackground: true,
    fixedBackground: true,
    fixedViewpoint: true,
    quality: 'high',
  });

  const firstCall = mocks.edit.mock.calls[0][0];
  expect(firstCall).toMatchObject({
    model: 'gpt-image-2',
    quality: 'high',
    n: 2,
    size: '1024x1024',
    output_format: 'png',
  });
  expect(firstCall.background).toBeUndefined();
  expect(firstCall.input_fidelity).toBeUndefined();
});
```

### OIP-02 Prompt Mapping

**Source:** `apps/api/src/services/openai-image.service.ts` lines 479-505 and 510-529  
**Apply to:** `08-VERIFICATION.md`, `13-VERIFICATION.md`

```ts
const preserveRules = [
  'Preserve product geometry, dimensions, crop, camera viewpoint, perspective, material, lighting, hardware, label placement, non-character text, and non-target areas.',
  'Preserve Image 2 character silhouette, proportions, face details, colors, and recognizable motifs.',
];

if (options.preserveStructure) {
  preserveRules.push(
    'Preserve product geometry, crop, viewpoint, proportions, and all physical construction exactly.'
  );
}

if (options.fixedViewpoint) {
  preserveRules.push('Use the same camera angle, lens feel, crop, and perspective as Image 1.');
}

if (options.fixedBackground) {
  preserveRules.push('Use a plain pure white opaque background (#ffffff).');
}

if (options.preserveHardware) {
  preserveRules.push(this.buildHardwarePrompt(options));
}
```

```text
Task:
Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2.

Must change:
- Replace the character/IP artwork on Image 1 with the character from Image 2.

Must preserve:
${preserveRules.map((rule) => `- ${rule}`).join('\n')}

Hard constraints:
- Do not add extra characters, logos, watermark, text, props, accessories, or decorative effects.
- Do not redesign the product body.
- Do not change hardware color, position, size, or shape.
- Do not alter saturation, contrast, camera angle, or surrounding objects unless explicitly requested.
- If transparent output was requested, still generate an opaque clean product-review image first.
```

### Route Test Harness Pattern

**Source:** `apps/api/src/routes/__tests__/generation.routes.test.ts` lines 13-23 and 82-107  
**Apply to:** only if planner adds route-level regression coverage

```ts
async function buildTestApp(): Promise<FastifyInstance> {
  const { default: generationRoutes } = await import('../generation.routes.js');
  const app = Fastify({ logger: false });

  app.decorate('authenticate', async (request: any) => {
    request.user = { id: 'user1' };
  });

  await app.register(generationRoutes);
  await app.ready();
  return app;
}
```

```ts
expect(response.statusCode).toBe(400);
expect(JSON.parse(response.body)).toEqual({
  success: false,
  error: {
    code: 'GENERATION_FAILED',
    message: 'OpenAI providerModel은 gpt-image-2여야 합니다',
  },
});
expect(vi.mocked(generationService.create)).not.toHaveBeenCalled();
```

### Safe Cleanup Boundaries

**Source:** `13-RESEARCH.md` lines 175-180  
**Apply to:** all Phase 8 artifact edits

```markdown
- **Deleting all `transparent` references blindly:** Some transparent references are valid for Sketch to Real `OSR-03` and forbidden-parameter checks; Phase 13 should target stale IP Change v2 transparent-option claims only.
- **Removing `fixedBackground` as if it were transparent output:** `fixedBackground` is the supported `OIP-02` background option and maps to a plain opaque background prompt rule.
- **Claiming live OpenAI IP smoke is complete:** Phase 8 remains `human_needed` for real OpenAI smoke and authenticated browser walkthrough.
- **Hand-editing the historical milestone audit as proof:** Phase 12 documented superseding evidence in a phase-local audit check instead of rewriting the historical audit finding.
```

## No Analog Found

None. Every likely Phase 13 artifact has either an exact Phase 8/13 artifact analog or the Phase 12 deterministic audit-check analog.

## Metadata

**Analog search scope:** `.planning/phases/**/*{VERIFICATION,SMOKE,VALIDATION,SUMMARY,AUDIT-CHECK}.md`, Phase 8 artifacts, Phase 12 audit closure, and OIP-02 web/API/test evidence files.  
**Files scanned:** 43 planning artifact candidates from `rg --files`/`find`, plus 7 requested source/test evidence files.  
**Pattern extraction date:** 2026-04-30  
**Source edit policy:** No runtime source edits inferred for Phase 13. Source/test files are evidence only unless planner explicitly adds a missing regression test.
