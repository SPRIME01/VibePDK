---
kind: prompt
domain: spec
task: implement
budget: M
mode: "agent"
model: GPT-4.1
tools: ["codebase", "search", "runTests"]
description: "Implement a feature per PRD/ADR/SDS/TS with tests and traceability."
---

# Implement Feature (Spec- & DX-Driven)

## Inputs

{% raw %}

- Product Feature IDs: {{PRD_IDS}}
- Related architectural decisions: {{ADR_IDS}}
- SDS/TS components: {{SDS_IDS}} {{TS_IDS}}
- Developer platform constraints (optional): {{DEV_IDS}}
  {% endraw %}

## Task

1. Plan edits with file list and impact radius.
2. Implement per SDS/TS boundaries and ADR constraints.
3. Add/extend tests and update CI gates per DEV specs.
4. Update traceability (e.g., `docs/traceability_matrix.md`) with PRD/ADR/SDS/TS/DEV IDs.

## Output

- Direct file edits.
- Short PR description with spec references.
