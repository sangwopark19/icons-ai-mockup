# Phase 8: OpenAI IP Change Parity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `08-CONTEXT.md` - this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 08-openai-ip-change-parity
**Areas discussed:** Entry and labeling, Form options and defaults, OpenAI output quality contract, Result and history lifecycle

---

## Entry And Labeling

| Question | Option | Description | Selected |
|---|---|---|---|
| Project entry exposure | Separate parallel menu/card | `IP 변경` v1 and v2 appear beside each other from the project context. | ✓ |
| Project entry exposure | Provider toggle inside existing page | Keeps one route but makes v2 less discoverable. | |
| Project entry exposure | Single entry then provider selection | Adds a step before generation setup. | |

**User's choice:** `1-1`
**Notes:** v2 is a parallel workflow, not a replacement.

| Question | Option | Description | Selected |
|---|---|---|---|
| Route structure | `/projects/:id/ip-change/openai` | Separate v2 route while preserving the current route. | ✓ |
| Route structure | `/projects/:id/ip-change?provider=openai` | One route with query-driven provider state. | |
| Route structure | `/projects/:id/openai-ip-change` | Fully separate route name. | |

**User's choice:** `2-1`
**Notes:** Keep Gemini route unchanged.

| Question | Option | Description | Selected |
|---|---|---|---|
| User-facing label | v1/v2 label without model names | Hide provider/model terms from users; call the new flow v2. | ✓ |
| User-facing label | `IP 변경 (Gemini)` / `IP 변경 (OpenAI)` | Clear provider naming but exposes implementation terms. | |
| User-facing label | `GPT Image 2 IP 변경` | Emphasizes model but violates user's label preference. | |

**User's choice:** "서로 모델명은 사용자에게 보여주지말고 이번에 새로 만드는건 v2 라고 해"
**Notes:** User-facing labels must avoid model names.

| Question | Option | Description | Selected |
|---|---|---|---|
| Visual priority | Equal card parity with slight v2 emphasis | v1/v2 look like siblings; v2 gets a little more emphasis because it is new. | ✓ |
| Visual priority | `NEW` emphasis | More promotional but may make v1 feel obsolete. | |
| Visual priority | v2 as beta/secondary | More conservative but weakens parity. | |

**User's choice:** "1번처럼 하는데 v2니까 조금더 강조하게"
**Notes:** Emphasis should not imply v1 is deprecated.

---

## Form Options And Defaults

| Question | Option | Description | Selected |
|---|---|---|---|
| Form surface | Same fields as existing IP Change | Preserve current product expectations and parity. | ✓ |
| Form surface | Same fields with advanced options collapsed | Cleaner UI but less direct parity. | |
| Form surface | Required inputs only | Simpler but changes the workflow. | |

**User's choice:** `1-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| v2 defaults | Preservation-oriented defaults | Structure, viewpoint, and background locks enabled by default. | ✓ |
| v2 defaults | Match Gemini defaults exactly | Familiar but weaker v2 preservation contract. | |
| v2 defaults | All preservation options on | Strong but may over-constrain hardware without details. | |

**User's choice:** `2-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| Transparent background | Keep option plus post-processing | UI parity remains; OpenAI generation stays opaque. | ✓ |
| Transparent background | Hide on v2 | Avoids API constraint but breaks parity. | |
| Transparent background | Keep option plus warning copy | More explanatory but adds UI copy. | |

**User's choice:** `3-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| User instruction priority | Explicit override only | Ordinary instructions stay inside preservation rules. | ✓ |
| User instruction priority | Always highest priority | Flexible but can break structure preservation. | |
| User instruction priority | Remove user instructions | Stable but too restrictive. | |

**User's choice:** `4-1`

---

## OpenAI Output Quality Contract

| Question | Option | Description | Selected |
|---|---|---|---|
| API flow | Image API edit | Best match for source product + character reference IP replacement. | ✓ |
| API flow | Responses API | Useful later for multi-turn follow-ups but more complex now. | |
| API flow | Planner discretion | Leaves endpoint choice open. | |

**User's choice:** `1-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| Candidate count | Always two | Matches current product expectations and Phase 8 criteria. | ✓ |
| Candidate count | User-selectable 1-4 | More flexible but expands UI/API scope. | |
| Candidate count | Default two with hidden config | Operational flexibility with extra complexity. | |

**User's choice:** `2-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| Quality control | User-selectable modes | `빠른모드`, `균형모드`, `퀄리티모드`; default `균형모드`. | ✓ |
| Quality control | Medium default only | Simple but no user quality choice. | |
| Quality control | High default only | Higher quality but higher cost/latency. | |
| Quality control | Auto | Delegates to model but weakens predictability. | |

**User's choice:** "1,2 셋 다하고 사용자가 선택할 수 있게 해줘 (빠른모드, 균형모드, 퀄리티모드)"
**Notes:** Interpret as all three quality tiers exposed to users, with balanced mode as default.

| Question | Option | Description | Selected |
|---|---|---|---|
| Prompt contract | Strict replacement | Preserve product invariants and replace only character/IP artwork. | ✓ |
| Prompt contract | Creative reinterpretation | More varied output but product structure can drift. | |
| Prompt contract | Strict only when options enabled | Default result can be unstable. | |

**User's choice:** `4-1`

---

## Result And History Lifecycle

| Question | Option | Description | Selected |
|---|---|---|---|
| Result/history label | v1/v2 labels | Hide model/provider terms from users; keep internal provider/model metadata. | ✓ |
| Result/history label | Gemini/OpenAI labels | Clear but exposes implementation. | |
| Result/history label | v2 only on result page | History becomes harder to distinguish. | |

**User's choice:** `1-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| Active v2 actions | Select/save/reopen/download only | Matches Phase 8 scope and avoids broken follow-up flows. | ✓ |
| Active v2 actions | Show all and fail unsupported actions | Easier but poor UX. | |
| Active v2 actions | Hide all Phase 10 buttons | Clean but less informative. | |

**User's choice:** `2-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| Disabled follow-up copy | Short guidance | `v2 후속 편집은 다음 업데이트에서 지원됩니다`. | ✓ |
| Disabled follow-up copy | Disabled only | Quiet but unclear. | |
| Disabled follow-up copy | Hide buttons | No explanation. | |

**User's choice:** `3-1`

| Question | Option | Description | Selected |
|---|---|---|---|
| History reopen lifecycle | Existing selected-image lifecycle | Select one candidate, save, reopen with v2 badge. | ✓ |
| History reopen lifecycle | Save both candidates immediately | Convenient but noisy. | |
| History reopen lifecycle | Separate v2 history section | Strong separation but weak parity. | |

**User's choice:** `4-1`

---

## the agent's Discretion

- Exact v2 card styling and badge treatment.
- Exact component reuse/refactor strategy for v1 and v2 pages.
- Exact internal quality-mode type names and request field names.
- Exact disabled-action UI treatment as long as unsupported v2 follow-ups cannot execute.

## Deferred Ideas

None.
