# Prompt Playbook From Official OpenAI Guidance

Official prompting guidance used here:

- GPT Image 1.5 Prompting Guide
- Image generation guide
- Image generation tool guide

## Reusable rules

- Keep prompts structured: scene/goal -> subject -> key details -> constraints.
- For multi-image work, reference each image by index and role.
- State what changes and what stays.
- For edits, restate preserve constraints on every turn to reduce drift.
- Use concrete material, composition, and viewpoint language instead of vague "high quality" padding.
- For text in images, quote the text exactly.

## MockupAI-specific invariants

Always lock these when relevant:

- product structure
- camera viewpoint
- crop
- material
- seams and hardware
- label/text not named in the change
- character silhouette and face

## Quality guidance

- `low`: draft or quick ideation
- `medium`: normal design review
- `high`: close-up character details, small text, or final internal review

## Wording guidance

Prefer:

- `edit Image 1 by ...`
- `change only ...`
- `keep everything else the same`

Avoid:

- `merge`
- `combine`
- long freeform paragraphs that hide the preservation rules

## Safety reminder

The ChatGPT Images 2.0 system card highlights stronger realism and higher risk for deceptive real-person imagery. Do not loosen prompts around real people, public figures, minors, or sensitive fabricated events.
