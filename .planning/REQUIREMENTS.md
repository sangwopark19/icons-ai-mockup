# Requirements: AI Mockup Platform

**Defined:** 2026-04-23
**Core Value:** 사용자가 원하는 제품 목업을 구조와 디테일을 잃지 않고 빠르게 생성하고 비교할 수 있어야 한다.

## v1 Requirements

Requirements for milestone v1.1 OpenAI GPT Image 2 Dual Provider.

### Provider Selection

- [x] **PROV-01**: User can open an OpenAI GPT Image 2 version of the IP Change workflow from a project without losing access to the existing Gemini version.
- [ ] **PROV-02**: User can open an OpenAI GPT Image 2 version of the Sketch to Real workflow from a project without losing access to the existing Gemini version.
- [x] **PROV-03**: User can see which provider and model produced each generation in the result view and project history.
- [x] **PROV-04**: User can regenerate a saved generation with the same provider and core options used for the original request.

### OpenAI IP Change

- [x] **OIP-01**: User can generate two OpenAI GPT Image 2 IP Change candidates from a source product image and a character reference image.
- [x] **OIP-02**: User can request OpenAI IP Change with structure, viewpoint, background, and hardware-preservation options.
- [x] **OIP-03**: User can save, review, and download OpenAI IP Change results through the existing project history flow.

### OpenAI Sketch To Real

- [ ] **OSR-01**: User can generate two OpenAI GPT Image 2 Sketch to Real candidates from a sketch and an optional texture reference.
- [ ] **OSR-02**: User can preserve sketch layout and key character/product details while applying realistic material treatment in the OpenAI Sketch to Real workflow.
- [ ] **OSR-03**: User can request transparent-background output from the OpenAI Sketch to Real workflow and receive a background-removed final asset through the existing post-process flow.

### OpenAI Editing

- [x] **OED-01**: User can request a partial edit on an OpenAI-generated result from the existing result page.
- [ ] **OED-02**: User can create a style-copy generation from an approved OpenAI result while changing only the named target.
- [ ] **OED-03**: User can iterate on OpenAI edits or style-copy follow-ups without mixing state with Gemini-only style memory.

### Operations And Observability

- [x] **OPS-01**: Admin can store and activate OpenAI API keys separately from Gemini API keys. Validated in Phase 7.
- [x] **OPS-02**: Admin can view provider-aware generation metadata for OpenAI runs, including provider, model, and request identifiers needed for support. Validated in Phase 7.
- [ ] **OPS-03**: System routes each queued generation job to the correct provider runtime based on the saved generation request. Validated in Phase 7 foundation: worker validates saved provider/model and rejects unsupported OpenAI runtime without Gemini fallback.
- [x] **OPS-04**: System stores the OpenAI response linkage needed for OpenAI regenerate, style-copy, and multi-turn edit flows. Validated in Phase 7 foundation: schema and admin payload support OpenAI linkage fields; runtime population follows in OpenAI workflow phases.

## v2 Requirements

### Provider Comparison

- **COMP-01**: User can compare Gemini and OpenAI results side by side in one review surface.
- **COMP-02**: User can duplicate a request from one provider into the other with one action.

### Advanced Editing

- **MASK-01**: User can select a masked region in the UI for precise OpenAI edit requests.
- **MASK-02**: User can preview the editable region before submitting a masked edit.

### Operations

- **COST-01**: Admin can monitor provider-specific cost and latency trends over time.
- **KEY-07**: Admin can rotate provider keys with scheduled or rule-based activation.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full Gemini to OpenAI migration | This milestone is explicitly a parallel rollout, not a replacement |
| Direct transparent output from OpenAI generation | `gpt-image-2` does not support transparent backgrounds; existing post-process flow should be reused |
| Cross-provider style memory reuse | Gemini `thoughtSignature` and OpenAI response linkage are incompatible mechanisms |
| Video generation or non-image OpenAI features | The milestone focuses on matching the existing image product surface only |
| Full provider comparison dashboard | Useful later, but not required to deliver the first OpenAI track |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROV-01 | Phase 8 | Pending |
| PROV-02 | Phase 12 | Pending |
| PROV-03 | Phase 10 | Complete |
| PROV-04 | Phase 10 | Complete |
| OIP-01 | Phase 8 | Pending |
| OIP-02 | Phase 13 | Pending |
| OIP-03 | Phase 8 | Pending |
| OSR-01 | Phase 12 | Pending |
| OSR-02 | Phase 12 | Pending |
| OSR-03 | Phase 12 | Pending |
| OED-01 | Phase 10 | Complete |
| OED-02 | Phase 11 | Pending |
| OED-03 | Phase 11 | Pending |
| OPS-01 | Phase 7 | Satisfied |
| OPS-02 | Phase 7 | Satisfied |
| OPS-03 | Phase 11 | Pending |
| OPS-04 | Phase 7 | Foundation Satisfied |

**Coverage:**
- v1 requirements: 17 total
- Checked complete after audit gap reset: 10
- Pending gap closure: 7
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-29 after v1.1 milestone audit gap planning*
