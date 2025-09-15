---
kind: prompt
domain: spec
task: transcript
budget: M
mode: 'agent'
model: GPT-4.1
tools: ['codebase', 'search']
description: 'Convert a conversation transcript into product spec drafts with IDs.'
---

# Convert Transcript to Product Spec Draft

## Inputs
{% raw %}
- Conversation transcript or summary
- Target spec IDs (proposed): {{PRD_IDS}} {{ADR_IDS}} {{SDS_IDS}} {{TS_IDS}}
{% endraw %}

## Task
- Extract user needs, scope, acceptance criteria, and key decisions.
- Propose spec IDs and exact headings; flag ambiguities as Spec Gaps with options.
- Output a minimal draft suitable for `docs/PRD.md`/`docs/ADR.md`/`docs/SDS.md`.

## Output
- Markdown sections ready to insert into the appropriate product spec file(s).
