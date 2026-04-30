# Phase 12: OpenAI Sketch Verification Closure - Pattern Map

**Mapped:** 2026-04-30  
**Files analyzed:** 15 (6 planning targets + 9 source evidence targets)  
**Analogs found:** 15 / 15

## File Classification

| File / Evidence Target | Role | Data Flow | Closest Analog | Match Quality |
|------------------------|------|-----------|----------------|---------------|
| `.planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` | verification artifact | transform | `.planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md`; `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` | exact |
| `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` | summary artifact | transform | `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` | exact-existing |
| `.planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md` | smoke checklist | batch/manual | `.planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md` | exact-existing |
| `.planning/v1.1-MILESTONE-AUDIT.md` or regenerated audit artifact | audit artifact | batch | `.planning/v1.1-MILESTONE-AUDIT.md`; `.planning/v1.1-INTEGRATION-CHECK.md` | exact-existing |
| `.planning/v1.1-INTEGRATION-CHECK.md` or regenerated integration artifact | integration artifact | batch | `.planning/v1.1-INTEGRATION-CHECK.md` | exact-existing |
| `.planning/REQUIREMENTS.md` | requirements traceability | transform | `.planning/REQUIREMENTS.md` current unchecked Phase 12 rows | conditional |
| `apps/api/src/services/openai-image.service.ts` | service evidence target | request-response/transform | same file, `generateSketchToReal()` | exact-source |
| `apps/api/src/services/background-removal.service.ts` | service/utility evidence target | transform | same file, quality gates | exact-source |
| `apps/api/src/worker.ts` | worker evidence target | event-driven | same file, OpenAI Sketch dispatch/post-process branch | exact-source |
| `apps/api/src/services/generation.service.ts` | service evidence target | CRUD/event-driven | same file, validation/enqueue/save patterns | exact-source |
| `apps/api/src/routes/generation.routes.ts` | route evidence target | request-response | same file, create schema validation | exact-source |
| `apps/api/src/services/__tests__/openai-image.service.test.ts` | test evidence target | batch | same file, OpenAI Sketch service tests | exact-source |
| `apps/api/src/services/__tests__/background-removal.service.test.ts` | test evidence target | batch | same file, transparent quality tests | exact-source |
| `apps/api/src/__tests__/worker.provider-continuation.test.ts` | test evidence target | batch/event-driven | same file, provider dispatch tests | role-match |
| `apps/web/src/app/projects/[id]/**/*.tsx` relevant pages | component/page evidence targets | request-response | project page, OpenAI Sketch form, result page, history page | exact-source |

## Pattern Assignments

### `.planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` (verification artifact, transform)

**Primary analogs:** `.planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md` and `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md`

**Frontmatter pattern** (copy shape, substitute Phase 9 IDs):

Source: `.planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md` lines 1-17

```markdown
---
phase: 10-provider-aware-result-continuation
verified: 2026-04-29T03:09:11Z
status: human_needed
score: "5/5 must-haves verified"
overrides_applied: 0
human_verification:
  - test: "Live OpenAI partial edit smoke"
    expected: "Existing result page partial edit sends selectedImageId, creates one OpenAI/gpt-image-2 edit result, and records OpenAI request/response/image-call metadata."
    why_human: "Requires a running app/API/DB stack, active DB-managed OpenAI key, a completed selected OpenAI result, and approved image content for transmission."
---
```

For Phase 9, use `phase: 09-openai-sketch-to-real-parity`, include `requirements: [PROV-02, OSR-01, OSR-02, OSR-03]`, and set `status` to `human_needed` or `partial_with_exception` unless fresh transparent alpha/composite evidence is collected.

**Verification report section order** (copy layout):

Source: `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` lines 28-52

```markdown
## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|

**Score:** 4/4 truths verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
```

Source: `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` lines 53-92

```markdown
### Key Link Verification
| From | To | Via | Status | Details |

### Data-Flow Trace
| Artifact | Data Variable | Source | Produces Real Data | Status |

### Automated Checks
| Command | Result |

### Requirements Coverage
| Requirement | Status | Evidence |
```

**Human-needed and residual-risk pattern**:

Source: `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` lines 97-117

```markdown
### Human Verification Required

1. **Real OpenAI GPT Image 2 smoke**
   - Test: Run the Phase 8 `images-edit.sh` smoke with `OPENAI_API_KEY`, one product source image, and one character reference image.
   - Expected: Two usable candidates from one `n: 2` edit call, request IDs recorded, no `background: "transparent"` or `input_fidelity` sent.
   - Why human: Credentials and representative images are unavailable in this environment.

### Residual Risks

- Real OpenAI behavior is still unproven without live request IDs and sample outputs.
```

**Phase 9 evidence rows to cite**:

Source: `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` lines 37-50

```markdown
- Authenticated browser smoke on the current branch verified the project page entries `IP 변경 v1`, `IP 변경 v2`, `스케치 실사화 v1`, `스케치 실사화 v2`, and `히스토리`.
- Authenticated browser smoke on `/sketch-to-real/openai` verified the v2 form and default options: `균형모드`, `구조 우선 유지`, `시점 고정`, and `배경 고정`.
- Successful app-level opaque Sketch v2 generation: `834cbc00-4523-4150-8ee4-f2220356c236`.
- Successful OpenAI request ID recorded in DB: `req_b78ef6875e7e4b889486726a42e304fc`.
```

Source: `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` lines 115-124

```markdown
- Request ID: `req_b78ef6875e7e4b889486726a42e304fc`.
- Selected quality value: `medium`.
- Two output image paths captured.
- Candidate order evidence: `output_1.png -> 후보 1`, `output_2.png -> 후보 2`, unchanged after candidate 2 selection, reload, save, history open, and reopen.
- Source checks confirm `background: "transparent"` was not sent.
- Source checks confirm `input_fidelity` was not sent.
```

**OSR-03 status pattern**:

Source: `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` lines 126-145

```markdown
transparent-background verification: `blocked - live transparent output and dark-composite evidence unavailable because transparent generation still hit OpenAI 403`.

Required evidence before marking this passed:
- Final downloaded transparent PNG alpha-channel evidence, such as `metadata.hasAlpha === true`.
- `transparentPixelRatio >= 0.15`.
- `transparentPixelRatio <= 0.95`.
- `transparentBorderRatio >= 0.85`.
- `darkCompositeBorderLuma <= 40` when composited over `#0A0A0B`.
- Confirmation that transparency was created by post-processing after opaque GPT Image 2 generation, not by sending `background: "transparent"`.
```

Recommended Phase 9 requirement statuses:

| Requirement | Status Pattern | Evidence to cite |
|-------------|----------------|------------------|
| `PROV-02` | `SATISFIED` | Project page v1/v2 links, v2 form route, local Docker browser smoke |
| `OSR-01` | `SATISFIED, transparent live smoke pending` | `generateSketchToReal()` uses `images.edit` with `n: 2`; opaque live request/output paths |
| `OSR-02` | `SATISFIED, visual review pending` | prompt source/tests enforce preservation and material-only texture behavior |
| `OSR-03` | `PARTIAL` or `SATISFIED_WITH_EXCEPTION` | source/tests prove post-process path; final live alpha/composite proof missing unless collected in Phase 12 |

---

### `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` (summary artifact, transform, optional)

**Analog:** existing `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md`

Update this file only if Phase 12 collects new transparent evidence or explicitly records a milestone exception. Preserve the existing accepted-with-deferred-followup history unless new evidence supersedes it.

**Existing transparent status pattern** (lines 147-164):

```markdown
## Evidence Status

| Evidence | Status |
|---|---|
| Browser result page | passed for opaque Sketch v2 output on local Docker current branch |
| Candidate order persistence | passed for opaque generation `834cbc00-4523-4150-8ee4-f2220356c236` |
| OpenAI request ID | opaque success captured: `req_b78ef6875e7e4b889486726a42e304fc`; earlier/transparent failures also captured |
| Transparent final asset alpha/ratio/composite | blocked because transparent generation `7418ceef-19cf-41fa-b317-cbf5cf711dfe` hit OpenAI 403 before output creation |
```

**Release-decision pattern** (lines 166-172):

```markdown
## Release Decision

1. Transparent-background live smoke evidence is deferred to follow-up work and must still record alpha/ratio/dark-composite evidence before Phase 09 is claimed fully live-smoke verified.
```

If Phase 12 uses an exception instead of live proof, add the blocker, owner/follow-up condition, and exact missing evidence. Do not invent output paths, request IDs, or metrics.

---

### `.planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md` (smoke checklist, batch/manual, optional)

**Analog:** existing `.planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md`

Keep this as the checklist source of truth. Update only if Phase 12 adds a new explicit exception checklist or new transparent evidence fields.

**Automated command pattern** (lines 12-30):

```markdown
pnpm --filter @mockup-ai/api test
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

**Transparent evidence pattern** (lines 76-90):

```markdown
Transparent output must be verified as post-processed output after opaque GPT Image 2 generation. Do not treat direct GPT Image 2 transparency as supported behavior.

- Final downloaded transparent PNG has `metadata.hasAlpha === true` or equivalent alpha-channel evidence.
- `transparentPixelRatio >= 0.15`.
- `transparentPixelRatio <= 0.95`.
- `transparentBorderRatio >= 0.85`.
- `darkCompositeBorderLuma <= 40` when composited over `#0A0A0B`.
```

**Evidence-recording pattern** (lines 92-108):

```markdown
Record this evidence in `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md`:

- OpenAI Sketch real smoke status: `passed` with request ID evidence, or `manual_needed - OPENAI_API_KEY unavailable`, or another precise blocker.
- Transparent-background status: alpha evidence, `transparentPixelRatio`, `transparentBorderRatio`, `darkCompositeBorderLuma`, and dark/contrasting-background composite evidence path, or explicit `manual_needed`.
```

---

### `.planning/v1.1-MILESTONE-AUDIT.md` or regenerated audit artifact (audit artifact, batch)

**Analog:** `.planning/v1.1-MILESTONE-AUDIT.md`

Prefer regenerating audit artifacts via the existing GSD audit workflow instead of hand-editing audit results. The planner should treat the current audit as closure evidence and compare after `09-VERIFICATION.md` exists.

**Current blocker pattern** (lines 12-39):

```yaml
- id: "PROV-02"
  status: "orphaned"
  verification_status: "missing"
  evidence: "Phase 9 SUMMARY files list PROV-02 as complete, but .planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md is missing."
- id: "OSR-03"
  status: "orphaned"
  verification_status: "missing"
  evidence: "Phase 9 has no VERIFICATION.md, and 09-SUMMARY.md records transparent-background live evidence as blocked/deferred after OpenAI 403."
```

**Verdict/action pattern** (lines 122-130 and 258-266):

```markdown
v1.1 is not ready to complete as passed.

1. Phase 9 has no `09-VERIFICATION.md`, so its four assigned requirements are orphaned by the audit workflow even though plan SUMMARY frontmatter claims completion.
2. The OpenAI Sketch transparent-background requirement has deferred live evidence and no alpha/composite proof.

Run `$gsd-plan-milestone-gaps` or create a narrow gap-closure phase that:
2. Generates or re-runs Phase 9 verification so PROV-02/OSR-01/OSR-02/OSR-03 are no longer orphaned.
3. Captures or explicitly defers OSR-03 transparent-background alpha/composite evidence in a verification artifact.
```

After Phase 12, the regenerated audit should no longer report `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03` as orphaned. If `OSR-03` remains partial, the audit should point to the explicit exception or human-needed row in `09-VERIFICATION.md`.

---

### `.planning/v1.1-INTEGRATION-CHECK.md` or regenerated integration artifact (integration artifact, batch)

**Analog:** `.planning/v1.1-INTEGRATION-CHECK.md`

Use this for source wiring language and `OSR-03` partial wording.

**Wiring summary pattern** (lines 25-31):

```markdown
- OpenAI Sketch to Real v2 entry/form/API/queue/worker/runtime/result/history: WIRED in source; transparent live evidence remains partial.
```

**Requirement integration rows** (lines 125-128):

```markdown
| `PROV-02` | Project page v1/v2 Sketch links -> separate routes | WIRED | - |
| `OSR-01` | Sketch v2 form -> OpenAI create payload `outputCount: 2` -> OpenAI Image API `n: 2` -> two-result UI | WIRED | Opaque live smoke passed; transparent request live failed |
| `OSR-02` | Sketch v2 product/material options -> prompt preserve/add/hard constraints | WIRED | Visual quality evidence remains human-review dependent |
| `OSR-03` | Sketch transparent option -> opaque OpenAI prompt -> worker `removeUniformLightBackground()` -> transparent PNG save | PARTIAL | Live alpha/composite evidence deferred/blocked |
```

---

### `.planning/REQUIREMENTS.md` (requirements traceability, transform, conditional)

**Analog:** current `.planning/REQUIREMENTS.md` rows found by grep.

Only update requirement checkboxes if the plan explicitly gates this on `09-VERIFICATION.md` plus follow-up audit result. Current rows are:

```markdown
13:- [ ] **PROV-02**: User can open an OpenAI GPT Image 2 version of the Sketch to Real workflow from a project without losing access to the existing Gemini version.
25:- [ ] **OSR-01**: User can generate two OpenAI GPT Image 2 Sketch to Real candidates from a sketch and an optional texture reference.
26:- [ ] **OSR-02**: User can preserve sketch layout and key character/product details while applying realistic material treatment in the OpenAI Sketch to Real workflow.
27:- [ ] **OSR-03**: User can request transparent-background output from the OpenAI Sketch to Real workflow and receive a background-removed final asset through the existing post-process flow.
```

Do not mark `OSR-03` fully complete unless final alpha/composite evidence exists or milestone policy explicitly accepts `SATISFIED_WITH_EXCEPTION`.

## Source Evidence Patterns

### OpenAI Sketch Runtime

**Source:** `apps/api/src/services/openai-image.service.ts`

**Imports/options pattern** (lines 1-39):

```typescript
import OpenAI, { toFile } from 'openai';
import type { HardwareSpec } from '@mockup-ai/shared/types';

export interface OpenAISketchToRealOptions {
  preserveStructure?: boolean;
  transparentBackground?: boolean;
  fixedBackground?: boolean;
  fixedViewpoint?: boolean;
  userInstructions?: string;
  productCategory?: string;
  productCategoryOther?: string;
  materialPreset?: string;
  materialOther?: string;
  quality?: OpenAIQuality;
  prompt?: string;
}
```

**Image API edit pattern** (lines 186-232):

```typescript
async generateSketchToReal(
  apiKey: string,
  sketchImageBase64: string,
  textureImageBase64OrNull: string | null,
  options: OpenAISketchToRealOptions
): Promise<OpenAIImageGenerationResult> {
  const prompt = this.buildSketchToRealPrompt(options);
  const quality = options.quality ?? 'medium';
  const inputImages = [sketchImage];

  if (textureImageBase64OrNull) {
    inputImages.push(textureImage);
  }

  const response = (await client.images.edit({
    model: this.model,
    image: inputImages,
    prompt,
    quality,
    n: 2,
    size: '1024x1024',
    output_format: 'png',
  })) as OpenAIImageResponse;
}
```

**Prompt preservation/transparent post-process wording** (lines 560-599):

```typescript
if (options.transparentBackground) {
  outputRules.push(
    'For transparent-background requests, generate an opaque image on a clean uniform light/near-white product-review background suitable for local background removal.'
  );
}

return `Task:
Edit Image 1 into a photorealistic product mockup.

Image roles:
- Image 1: designer sketch. Treat it as the locked design spec.
- Image 2, optional: material/texture reference. Apply only the material, texture, finish, and color behavior from this image.

Must preserve:
${preserveRules.map((rule) => `- ${rule}`).join('\n')}

Hard constraints:
- Do not ask for or create direct transparent output from GPT Image 2.
```

**Input safety/error pattern** (lines 793-830):

```typescript
private normalizeUserControlledPromptText(value: string): string {
  const blockedHeaderPattern =
    /^(Task|Image roles|Must change|Must preserve exactly|Must preserve|Hard constraints|Output|User instructions)\s*:/i;

  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(blockedHeaderPattern, (_match, header: string) => `[${header}]`))
    .join(' ');
}

private detectMimeType(buffer: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' {
  throw new Error('지원하지 않는 이미지 형식입니다');
}
```

### Background Removal Evidence

**Source:** `apps/api/src/services/background-removal.service.ts`

**Metrics shape** (lines 3-13):

```typescript
export interface TransparentBackgroundQuality {
  width: number;
  height: number;
  hasAlpha: boolean;
  transparentPixelRatio: number;
  transparentBorderRatio: number;
  opaqueCenterOrSubjectRatio: number;
  darkCompositeBorderLuma: number;
  edgeBackgroundLuma: number;
  edgeBackgroundStdDev: number;
}
```

**Fail-closed background gate** (lines 110-115):

```typescript
function assertLightUniformBackground(bg: BackgroundEstimate): void {
  const channelSpread = Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b);

  if (bg.luma < 210 || channelSpread > 35 || bg.stdDev > 24) {
    throw new Error('균일한 밝은 배경이 아니어서 배경 제거를 중단했습니다');
  }
}
```

**Quality thresholds** (lines 252-271):

```typescript
export function assertTransparentOutputQuality(quality: TransparentBackgroundQuality): void {
  if (!quality.hasAlpha) throw new Error('투명 채널이 없습니다');
  if (quality.transparentPixelRatio < 0.15 || quality.transparentPixelRatio > 0.95) {
    throw new Error('투명 픽셀 비율이 품질 기준을 벗어났습니다');
  }
  if (quality.transparentBorderRatio < 0.85) throw new Error('외곽 배경이 충분히 제거되지 않았습니다');
  if (quality.opaqueCenterOrSubjectRatio < 0.6) throw new Error('중앙 피사체가 과도하게 지워졌습니다');
  if (quality.darkCompositeBorderLuma > 40) throw new Error('어두운 배경 합성 시 외곽 밝기가 너무 높습니다');
}
```

**Post-process function** (lines 274-305):

```typescript
export async function removeUniformLightBackground(
  buffer: Buffer
): Promise<{ buffer: Buffer; hasTransparency: true; quality: TransparentBackgroundQuality }> {
  const raw = await decodeRgba(buffer);
  const background = estimateEdgeBackground(raw);
  assertLightUniformBackground(background);

  const backgroundMask = floodFillEdgeBackground(raw, background);
  const featheredAlpha = await featherAlphaMask(backgroundMask, raw.width, raw.height);
  const output = await sharp(outputRaw, { raw: { width: raw.width, height: raw.height, channels: 4 } })
    .png()
    .toBuffer();
  const quality = await analyzeTransparentOutputQuality(output);
  assertTransparentOutputQuality(quality);

  return { buffer: output, hasTransparency: true, quality };
}
```

### Worker Dispatch/Post-Process Evidence

**Source:** `apps/api/src/worker.ts`

**Import/type pattern** (lines 1-20):

```typescript
import { openaiImageService } from './services/openai-image.service.js';
import { removeUniformLightBackground } from './services/background-removal.service.js';

type ProcessedGeneratedImage = {
  buffer: Buffer;
  hasTransparency: boolean;
};
```

**OpenAI Sketch dispatch pattern** (lines 633-650):

```typescript
const result = await openaiImageService.generateSketchToReal(
  activeApiKey,
  sourceImageBase64,
  textureImageBase64 || null,
  {
    preserveStructure: options.preserveStructure,
    transparentBackground: options.transparentBackground,
    fixedBackground: options.fixedBackground,
    fixedViewpoint: options.fixedViewpoint,
    userInstructions: options.userInstructions,
    productCategory: options.productCategory,
    materialPreset: options.materialPreset,
    quality: options.quality,
    prompt: job.data.prompt,
  }
);
```

**Transparent post-process/save pattern** (lines 694-730):

```typescript
const processedImages: ProcessedGeneratedImage[] = [];
for (const image of generatedImages) {
  if (provider === 'openai' && mode === 'sketch_to_real' && options.transparentBackground) {
    try {
      const processed = await removeUniformLightBackground(image);
      processedImages.push({
        buffer: processed.buffer,
        hasTransparency: processed.hasTransparency,
      });
    } catch {
      throw new Error('배경 제거에 실패했습니다. 원본 결과를 저장하거나 다시 생성해주세요.');
    }
  } else {
    processedImages.push({ buffer: image, hasTransparency: false });
  }
}

await generationService.saveGeneratedImage(
  generationId,
  result.filePath,
  result.thumbnailPath,
  result.metadata,
  { hasTransparency: image.hasTransparency, isSelected: i === 0 }
);
```

### Request Validation/Queue Evidence

**Sources:** `apps/api/src/routes/generation.routes.ts`, `apps/api/src/services/generation.service.ts`, `apps/api/src/lib/queue.ts`

**Route validation pattern** (`generation.routes.ts` lines 67-139):

```typescript
if (value.provider === 'openai' && !['ip_change', 'sketch_to_real'].includes(value.mode)) {
  ctx.addIssue({ message: 'OpenAI provider는 현재 IP 변경 v2와 스케치 실사화 v2만 지원합니다' });
}

if (value.provider === 'openai' && value.options?.outputCount !== undefined && value.options.outputCount !== 2) {
  ctx.addIssue({ path: ['options', 'outputCount'], message: 'OpenAI v2는 후보 2개 생성만 지원합니다' });
}

if (value.provider === 'openai' && value.mode === 'sketch_to_real') {
  if (!hasTrimmedValue(options?.productCategory)) {
    ctx.addIssue({ path: ['options', 'productCategory'], message: 'OpenAI 스케치 실사화 v2에는 제품 종류가 필요합니다' });
  }
  if (!hasTrimmedValue(options?.materialPreset)) {
    ctx.addIssue({ path: ['options', 'materialPreset'], message: 'OpenAI 스케치 실사화 v2에는 재질 가이드가 필요합니다' });
  }
}
```

**Service validation pattern** (`generation.service.ts` lines 157-194):

```typescript
if (provider === 'openai' && !['ip_change', 'sketch_to_real'].includes(input.mode)) {
  throw new Error('OpenAI provider는 현재 IP 변경 v2와 스케치 실사화 v2만 지원합니다');
}

if (provider === 'openai' && input.options?.outputCount !== undefined && input.options.outputCount !== 2) {
  throw new Error('OpenAI v2는 후보 2개 생성만 지원합니다');
}

if (provider === 'openai' && input.mode === 'sketch_to_real') {
  if (!hasTrimmedValue(input.options?.productCategory)) {
    throw new Error('OpenAI 스케치 실사화 v2에는 제품 종류가 필요합니다');
  }
  if (!hasTrimmedValue(input.options?.materialPreset)) {
    throw new Error('OpenAI 스케치 실사화 v2에는 재질 가이드가 필요합니다');
  }
}
```

**Queue payload pattern** (`apps/api/src/lib/queue.ts` lines 7-34):

```typescript
export interface GenerationJobData {
  generationId: string;
  userId: string;
  projectId: string;
  mode: 'ip_change' | 'sketch_to_real';
  provider: 'gemini' | 'openai';
  providerModel: string;
  textureImagePath?: string;
  options: {
    preserveStructure: boolean;
    transparentBackground: boolean;
    productCategory?: string;
    materialPreset?: string;
    quality?: 'low' | 'medium' | 'high';
  };
}
```

### Test Evidence Patterns

**OpenAI service test:** `apps/api/src/services/__tests__/openai-image.service.test.ts` lines 282-301

```typescript
const result = await openaiImageService.generateSketchToReal('sk-test', pngBase64, null, {
  preserveStructure: true,
  fixedBackground: true,
  fixedViewpoint: true,
  productCategory: 'mug',
  materialPreset: 'ceramic',
});

expect(result.images).toHaveLength(2);
expect(firstCall).toMatchObject({
  model: 'gpt-image-2',
  quality: 'medium',
  n: 2,
  size: '1024x1024',
  output_format: 'png',
});
expect(firstCall.background).toBeUndefined();
expect(firstCall.input_fidelity).toBeUndefined();
```

**Prompt contract test:** `apps/api/src/services/__tests__/openai-image.service.test.ts` lines 318-365

```typescript
const sections = [
  'Task:',
  'Image roles:',
  'Product category:',
  'Material guidance:',
  'Must preserve:',
  'Must add:',
  'User instructions:',
  'Hard constraints:',
  'Output:',
];

expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
expect(prompt).toContain('Image 1: designer sketch. Treat it as the locked design spec.');
expect(prompt).toContain('Preserve exact layout, silhouette, proportions, face details, product construction, and perspective from Image 1.');
expect(prompt).toContain('These hard constraints override any conflicting user instructions');
```

**Transparent prompt test:** `apps/api/src/services/__tests__/openai-image.service.test.ts` lines 368-382

```typescript
await openaiImageService.generateSketchToReal('sk-test', pngBase64, null, {
  transparentBackground: true,
  fixedBackground: true,
});

expect(firstCall.prompt).toContain('clean uniform light/near-white');
expect(firstCall.prompt).toContain('opaque');
expect(firstCall.prompt).toContain('product-review background');
expect(firstCall.prompt).toContain('suitable for local background removal');
expect(firstCall.background).toBeUndefined();
expect(firstCall.input_fidelity).toBeUndefined();
```

**Background removal test:** `apps/api/src/services/__tests__/background-removal.service.test.ts` lines 30-54

```typescript
it('removes a uniform light product-review background and passes quality gates', async () => {
  const result = await removeUniformLightBackground(input);
  const metadata = await sharp(result.buffer).metadata();
  const quality = await analyzeTransparentOutputQuality(result.buffer);

  expect(result.hasTransparency).toBe(true);
  expect(metadata.hasAlpha).toBe(true);
  expect(quality.transparentBorderRatio).toBeGreaterThanOrEqual(0.85);
  expect(quality.transparentPixelRatio).toBeGreaterThanOrEqual(0.15);
  expect(quality.transparentPixelRatio).toBeLessThanOrEqual(0.95);
  expect(quality.darkCompositeBorderLuma).toBeLessThanOrEqual(40);
});
```

**Worker dispatch test:** `apps/api/src/__tests__/worker.provider-continuation.test.ts` lines 462-484

```typescript
await processGenerationJob({
  data: baseOpenAIJob({
    generationId: 'gen-sketch',
    mode: 'sketch_to_real',
    styleReferenceId: undefined,
    selectedImageId: undefined,
    copyTarget: undefined,
    characterImagePath: undefined,
  }),
});

expect(openaiImageService.generateSketchToReal).toHaveBeenCalledTimes(1);
expect(openaiImageService.generateStyleCopyWithLinkage).not.toHaveBeenCalled();
expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
```

### Web Evidence Patterns

**Project v1/v2 entry evidence:** `apps/web/src/app/projects/[id]/page.tsx` lines 110-125 and 234-246

```tsx
<Link href={`/projects/${projectId}/sketch-to-real`}>
  <span>스케치 실사화 v1</span>
</Link>
<Link href={`/projects/${projectId}/sketch-to-real/openai`}>
  <span>스케치 실사화 v2</span>
</Link>
```

**OpenAI Sketch submit payload:** `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` lines 174-199

```tsx
body: JSON.stringify({
  projectId,
  mode: 'sketch_to_real',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  sourceImagePath,
  textureImagePath,
  options: {
    outputCount: 2,
    quality,
    preserveStructure,
    fixedViewpoint,
    fixedBackground,
    transparentBackground,
    productCategory,
    materialPreset,
  },
}),
```

**Transparent UI option:** `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` lines 443-451

```tsx
<label className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={transparentBackground}
    onChange={(event) => setTransparentBackground(event.target.checked)}
  />
  <span className="text-sm text-[var(--text-secondary)]">투명 배경 (누끼)</span>
</label>
```

**Result page v2 copy and two-candidate guard:** `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` lines 27-57 and 480-500

```tsx
sketch_to_real: {
  loadingBody: '스케치 구조를 보존한 두 후보를 준비 중입니다. 완료되면 바로 선택할 수 있습니다.',
  failedBody: 'v2 스케치 실사화 생성에 실패했습니다. 스케치와 재질 정보를 확인한 뒤 다시 시도해주세요.',
  formPath: 'sketch-to-real/openai',
  selectedAlt: '선택된 v2 스케치 실사화 결과',
  candidateAltPrefix: 'v2 스케치 실사화 후보',
  downloadLabel: '선택 이미지 다운로드',
}
```

```tsx
if (
  generation.provider === 'openai' &&
  generation.mode === 'sketch_to_real' &&
  orderedImages.length !== 2 &&
  orderedImages.length !== 1
) {
  return <p>후보 2개가 필요하지만 현재 {orderedImages.length}개가 저장되어 있습니다.</p>;
}
```

**History badge evidence:** `apps/web/src/app/projects/[id]/history/page.tsx` lines 164-172

```tsx
{isVersionedMode && (
  <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)]">
    {item.provider === 'openai' ? 'v2' : 'v1'}
  </span>
)}
```

## Shared Patterns

### Verification Artifact as Audit Contract

**Source:** `.planning/v1.1-MILESTONE-AUDIT.md` lines 160-169  
**Apply to:** `09-VERIFICATION.md`

The audit treats requirements absent from phase `VERIFICATION.md` files as unsatisfied. The planner must ensure `09-VERIFICATION.md` explicitly names `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03`.

```markdown
| PROV-02 | SUMMARY claims completion, but no Phase 9 verification artifact exists. |
| OSR-01 | SUMMARY claims completion, but no Phase 9 verification artifact exists. |
| OSR-02 | SUMMARY claims completion, but no Phase 9 verification artifact exists. |
| OSR-03 | SUMMARY claims completion, no verification artifact exists, and transparent-background live evidence is deferred. |
```

### OSR-03 Evidence Discipline

**Source:** `12-VALIDATION.md` lines 38, 55, 63  
**Apply to:** `09-VERIFICATION.md`, optional `09-SUMMARY.md`, follow-up audit

Do not mark transparent support fully passed without either metric proof or a documented exception.

```markdown
grep -E "transparentPixelRatio|transparentBorderRatio|darkCompositeBorderLuma|milestone exception|human_needed" .planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md
```

### Secret/Data Handling

**Source:** `12-VALIDATION.md` lines 60-64  
**Apply to:** all planning artifacts

Record request IDs, sanitized paths, statuses, and derived metrics only. Do not commit API keys, raw sample images, base64 payloads, or raw vendor response bodies.

### Standard Verification Commands

**Source:** `12-VALIDATION.md` lines 18-21  
**Apply to:** Phase 12 verification tasks

```bash
pnpm --filter @mockup-ai/api test
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

## No Analog Found

None. Every target has an exact local planning or source analog. `OSR-03` live transparent evidence may be absent, but the artifact pattern and source/test evidence patterns exist.

## Metadata

**Analog search scope:** `.planning/phases/08-*`, `.planning/phases/09-*`, `.planning/phases/10-*`, `.planning/v1.1-*.md`, `apps/api/src`, `apps/web/src`  
**Files scanned:** 15 targeted files plus `rg` source/planning searches  
**Pattern extraction date:** 2026-04-30  
**Write target:** `.planning/phases/12-openai-sketch-verification-closure/12-PATTERNS.md`

## PATTERN MAPPING COMPLETE

**Phase:** 12 - OpenAI Sketch Verification Closure  
**Files classified:** 15  
**Analogs found:** 15 / 15

### Coverage

- Files with exact analog: 13
- Files with role-match analog: 1
- Files with conditional analog: 1
- Files with no analog: 0

### Key Patterns Identified

- Verification closure must follow existing `VERIFICATION.md` layout: frontmatter, observable truths, required artifacts, key links, data-flow trace, checks, requirements coverage, human verification, residual risks.
- `OSR-03` must be represented as post-processed transparency evidence with alpha/ratio/dark-composite metrics, or as an explicit `human_needed` / milestone exception.
- Source evidence already exists for OpenAI Sketch v2 entry, request payload, `images.edit` `n: 2`, prompt preservation, worker post-processing, `hasTransparency` persistence, and tests.

### File Created

`.planning/phases/12-openai-sketch-verification-closure/12-PATTERNS.md`

### Ready for Planning

Pattern mapping complete. Planner can now reference analog patterns in `PLAN.md` files.
