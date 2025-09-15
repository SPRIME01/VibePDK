---
kind: prompt
domain: spec
task: change
budget: M
mode: 'agent'
model: GPT-4.1
tools: ['codebase', 'search']
description: 'Change a feature (add/update/remove) with spec-first traceability and DX sync.'
---

# Change Feature (Add / Update / Remove) — Spec & DX Synchronized

## Inputs
{% raw %}
- Operation: {{OP}}  # one of: add, update, or remove
- Feature name: {{FEATURE_NAME}}
- Product IDs impacted (existing or new): {{PRD_IDS}} {{ADR_IDS}} {{SDS_IDS}} {{TS_IDS}}
- Developer IDs impacted (optional/new): {{DEV_IDS}}
- Rationale / business outcome: {{RATIONALE}}
- Constraints / non-goals: {{CONSTRAINTS}}
{% endraw %}

## Policy
- Read indexes first. Load only referenced sections unless gaps appear.
- If new IDs are required, propose IDs and exact headings.
- Architecture changes require ADR proposal or revision; do not bypass ADR.
- All edits must maintain traceability and DX readiness.

## Task
1) Impact Analysis
   - Identify affected modules/APIs/tests/docs. Note risks and cross-cutting concerns.
   - Call out dependency or sequencing impacts (build/test/ops).

2) Spec Edits
   - PRD: add or update acceptance criteria, success metrics, and scope.
   - ADR: create/update decision(s) if architecture or principles change.
   - SDS: update interfaces, boundaries, error contracts, and diagrams.
   - TS: update low-level details (schemas, payloads, limits, perf targets).
   - DEV-* (DX): onboarding steps, CI gates, lint/type rules, local tooling.

   For each edit, include the spec ID (new or existing), heading, and the exact diff or content to apply.

3) AI Guidance Sync
   - Update any AI guidance docs/prompts if applicable.
   - Update the traceability matrix and indexes.

4) Traceability
   - Update or regenerate the matrix (`docs/traceability_matrix.md`) with rows: Spec ID | Artifact | Status | PR link | Notes.

5) Change Artifacts
   - Generate PR title + body including: problem, solution, spec IDs, risks, test plan.
   - Suggest commit messages referencing spec IDs and DEV IDs.

## Output
- Direct file edits ready to apply.
- A single PR body containing: summary, spec changes list, test plan, and a checklist.
- If anything is ambiguous, include a Spec Gaps section with 2–3 resolution options.
