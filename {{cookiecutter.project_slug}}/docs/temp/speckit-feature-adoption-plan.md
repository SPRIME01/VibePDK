# Speckit Feature Adoption — Execution Checklist (TDD cycles)

## Overview
This plan implements the migration in small TDD cycles. Each cycle: Red (failing test) → Green (minimal implementation) → Refactor → Regression test → Update checklist.

Note: “Spec IDs” refer to Traceability Matrix IDs (ADR/ARD, PRD, SDS, TS, TASK, and project-prefixed variants). Use frontmatter matrix_ids and thread to join artifacts.

## Pre-flight

- [ ] Verify runtimes (Python 3.12 via uv, Node 24 with Corepack, pnpm)
  - [ ] Run `uv --version` and `uv python list | grep 3.12`
  - [ ] Run `node -v`
  - [ ] Run `corepack enable`
  - [ ] Run `corepack prepare pnpm@latest --activate`
- [ ] Install development dependencies
  - [ ] Run `uv sync --dev`
  - [ ] From repo root of baked template when testing Node scripts, run `pnpm install`

---

## Cycle 1 — Prompt linter: filename taxonomy and required frontmatter

- [x] Red — add failing Node test to flag missing keys and bad filenames
  - [x] Create `tools/prompt/__tests__/lint.taxonomy.spec.ts` (cases: missing title/domain/task/kind; bad filename)
  - [x] Run `pnpm test:node` and observe failing assertions
- [x] Green — implement taxonomy and required key validation in `tools/prompt/lint.js`
  - [x] Validate filename pattern `<domain>.<task>[.<phase>].<kind>.md`
  - [x] Require keys: title, description, domain, task, kind (phase optional)
  - [x] Run `pnpm test:node` and confirm tests pass
- [x] Refactor — extract small validators and keep strict types
- [x] Regression — add edge tests (uppercase domain, unexpected kind)
- [x] Update checklist — mark Cycle 1 done

---

## Cycle 2 — Linter: model key must exist in `.github/models.yaml`

- [x] Red — add failing test for unknown model key (or warn in warn-mode)
  - [x] Add `tools/prompt/__tests__/lint.model.spec.ts`
  - [x] Run `pnpm test:node` and observe failure
- [x] Green — implement model lookup in `lint.js` (load `.github/models.yaml`)
  - [x] Default to warn (config flag enables error mode)
  - [x] Run `pnpm test:node` and confirm pass
- [x] Refactor — cache models; tighten types
- [x] Regression — test with a retired model
- [x] Update checklist — mark completed tasks

---

## Cycle 3 — Linter: multipart Traceability IDs and thread

- [x] Red — add failing tests for `matrix_ids` array patterns and required `thread`
  - [x] Create `tools/prompt/__tests__/lint.matrix_ids.spec.ts`
  - [x] Include cases: accepts ADR/ARD/PRD/SDS/TS/TASK and DEV-* variants; rejects bad patterns; requires thread
  - [x] Run `pnpm test:node` and observe failure
- [x] Green — implement `matrix_ids` and `thread` validation in `lint.js`
  - [x] Use pattern `^(ADR|ARD|PRD|SDS|TS|TASK|DEV-ADR|DEV-PRD|DEV-SDS)-\d{3,4}$`
  - [x] Back-compat: if singular `id` exists, normalize to `matrix_ids: [id]`
  - [x] Run `pnpm test:node` and confirm pass
- [x] Refactor — centralize regex and helpers
- [x] Regression — add docs-only case (see Cycle 6)
- [x] Update checklist — mark Cycle 3 done

---

## Cycle 4 — Add spec/plan/tasks templates (family-aware)

- [x] Red — add pytest expecting new template files to exist
  - [x] Add `tests/test_cookiecutter_generation.py::test_templates_exist` asserting:
    - [x] `{{cookiecutter.project_slug}}/.github/prompts/spec.feature.template.md`
    - [x] `{{cookiecutter.project_slug}}/.github/prompts/spec.plan.{adr,prd,sds,ts,task}.prompt.md`
    - [x] `{{cookiecutter.project_slug}}/.github/prompts/spec.tasks.template.md`
  - [x] Run `uv run pytest -q -k templates_exist` and observe failure
- [x] Green — add template files with frontmatter (title, domain=spec, task, kind=template|prompt, matrix_ids, thread)
  - [x] Run `uv run pytest -q -k templates_exist` and confirm pass
- [x] Diagnose and fix TemplateSyntaxError preventing test execution
  - [x] Identify root cause: node_modules directory containing GitHub Actions syntax being processed as Jinja2 templates
  - [x] Remove node_modules directory from template
  - [x] Verify test now runs correctly
- [x] Refactor — keep templates concise; reference Constitution instruction
- [x] Regression — add pytest checking frontmatter validity via linter
- [x] Update checklist — mark Cycle 4 done

---

## Cycle 5 — Just recipes as primary interface; delegate to pnpm/Nx/bash

- [x] Red — add Node test ensuring scripts exist or Just recipes resolve
  - [x] Add `tools/test/__tests__/scripts.spec.ts` asserting scaffold/lint scripts or `just --list` contains expected recipes
  - [x] Run `pnpm test:node` and observe failure
- [x] Green — implement Just recipes in `{{cookiecutter.project_slug}}/justfile`
  - [x] Add `spec-feature THREAD=`
  - [x] Add `spec-plan THREAD= FAMILY=` (adr|prd|sds|ts|task)
  - [x] Add `spec-tasks THREAD=`
  - [x] Add `prompt-lint` → `node tools/prompt/lint.js ...`
  - [x] Add `spec-matrix` → `node tools/spec/matrix.js`
  - [x] Mirror with pnpm scripts in `{{cookiecutter.project_slug}}/package.json`
  - [x] Run `just --list` and `pnpm test:node` and confirm pass
- [x] Refactor — DRY file-copy logic (bash or Node helper)
- [x] Regression — test error on unknown FAMILY
- [x] Update checklist — mark Cycle 5 done

---

## Cycle 6 — Matrix: link by `thread`, aggregate by `matrix_ids`, docs-only support

- [x] Red — add failing Node tests for `tools/spec/matrix.js`
  - [x] Create `tools/spec/__tests__/matrix.spec.ts` (moved to `tests/unit/matrix.test.ts` for better test organization)
  - [x] Include cases:
    - [x] Links spec/plan/tasks by same `thread`
    - [x] Aggregates contributing artifacts per ID in `matrix_ids`
    - [x] Warns if triplet incomplete for non-docs-only threads
    - [x] Accepts missing tasks when `docs_only: true` or `phase: docs`
  - [x] Run `pnpm test:node` and observe failure
- [x] Green — implement behavior in `matrix.js`
  - [x] Run `pnpm test:node` and confirm pass
- [x] Refactor — extract parser; add types (created `matrix.d.ts` for TypeScript support)
- [x] Regression — handle multiple families on same thread (via thread-based linking)
- [x] Update checklist — mark Cycle 6 done

---

## Cycle 7 — Constitution & Gates instruction; linter gating modes

- [x] Red — add linter tests for gating levels (warn vs error)
  - [x] Add `tools/prompt/__tests__/lint.gates.spec.ts`
  - [x] Run `pnpm test:node` and observe failure
- [x] Green — add Constitution instructions and gating
  - [x] Add `{{cookiecutter.project_slug}}/.github/instructions/ai-workflows.constitution.instructions.md`
  - [x] Update linter to respect env/config: start WARN (non-block), support ERROR mode
  - [x] Run `pnpm test:node` and confirm pass
- [x] Refactor — config via env or rc file document via direnv;
- [x] Regression — ensure gating escalates correctly under flag
- [x] Update checklist — mark Cycle 7 done

---

## Cycle 8 — CI wiring (non-blocking → blocking)

- [ ] Red — simulate pipeline locally to ensure WARN mode is non-blocking
  - [ ] Run `pnpm prompt:lint` and `pnpm spec:matrix` in WARN mode with a known bad fixture (expect success exit)
- [ ] Green — update CI workflows in template to run steps
  - [ ] `corepack enable`
  - [ ] `pnpm install`
  - [ ] `pnpm prompt:lint` (WARN mode initially)
  - [ ] `pnpm spec:matrix`
  - [ ] Python: `uv sync --dev && uv run pytest -q`
- [ ] Refactor — cache pnpm; minimize CI time
- [ ] Regression — flip to ERROR mode in a preview branch and verify violations fail CI
- [ ] Update checklist — mark Cycle 8 done

---

## Cycle 9 — Docs and onboarding

- [ ] Red — run markdown link-check and capture failures
  - [ ] Run `pnpm docs:links` and note failures
- [ ] Green — update docs content
  - [ ] Add “How to author specs” describing `thread` and `matrix_ids`
  - [ ] Document Just recipes and families
  - [ ] Clarify Spec IDs = Traceability Matrix IDs
  - [ ] Run `pnpm docs:links` and confirm pass
- [ ] Refactor — trim redundancies; cross-link Constitution
- [ ] Regression — add example under `docs/specs/example-thread/` (optional)
- [ ] Update checklist — mark Cycle 9 done

---

## Finalization

- [ ] Ensure full suite is green
  - [ ] `uv run pytest -q`
  - [ ] `corepack enable && pnpm install && pnpm test:node`
- [ ] Manually run `just prompt-lint` and `just spec-matrix`
- [ ] Resolve open decision items and record in ADR/DEV docs
- [ ] Announce CI escalation timeline (WARN → ERROR) in docs

---

## Retrofit cycles (R1–R5)

### Cycle R1 — Legacy filename detection (report only)

- [ ] Red — add test to list legacy names in `.github/{prompts,chatmodes,instructions}` that don’t match `<domain>.<task>[.<phase>].<kind>.md`
- [ ] Green — implement `tools/prompt/legacy_detector.js` to emit a JSON plan with proposed new names (no writes)
- [ ] Refactor — extract parser for current files; add strict types
- [ ] Regression — verify representative cases
  - [ ] prompts: kind=prompt, e.g., `vibecoder-debug.prompt.md` → propose `debug.vibecoder.prompt.md`
  - [ ] chatmodes: kind=chatmode (often already compliant)
  - [ ] instructions: kind=instructions; if missing task, propose `general.<task>.instructions.md` or `ai-workflows.constitution.instructions.md`
- [ ] Update checklist — mark R1 done

### Cycle R2 — Safe rename engine + Just wrappers

- [ ] Red — add test for dry-run/write modes; write mode uses `git mv`, preserves history, rejects collisions
- [ ] Green — implement `tools/prompt/rename.js`
  - [ ] Support inputs: plan JSON from R1, flags `--dry-run|--write`, `--scope=prompts|chatmodes|instructions|all`
  - [ ] Enforce suffix rules: `.prompt.md|.chatmode.md|.instructions.md`
  - [ ] Add safety: back up plan file; require `--confirm`
- [ ] Add Just recipes
  - [ ] `prompt-rename-dry` — generate plan and print diff
  - [ ] `prompt-rename-write` — apply plan with `--confirm`
  - [ ] `prompt-rename-scope SCOPE=` — limit to one area
- [ ] Refactor — small helpers; stable path normalization
- [ ] Regression — handle colliding targets, unchanged names, unknown kinds
- [ ] Update checklist — mark R2 done

### Cycle R3 — Reference updates and redirects

- [ ] Red — scan docs for old filenames and fail if unresolved after rename (simple grep/glob)
- [ ] Green — implement `tools/docs/update_refs.js` to rewrite intra-repo links in `docs/**` and `.github/**`
- [ ] Refactor — limit scope; exclude code blocks
- [ ] Regression — verify `docs/spec_index.md`, `docs/traceability_matrix.md`, and prompt lists updated
- [ ] Update checklist — mark R3 done

### Cycle R4 — Enforce taxonomy in linter (warn → error)

- [ ] Red — make linter fail on legacy names when `ENFORCE=error`; warn when `ENFORCE=warn`
- [ ] Green — extend `tools/prompt/lint.js`
  - [ ] Error on mismatched filename unless `LEGACY_ALLOW=true`
  - [ ] Provide “suggested name” based on R1 rules
- [ ] Refactor — share parser/regex with detector
- [ ] Regression — run CI in WARN mode initially; ERROR in later phase
- [ ] Update checklist — mark R4 done

### Cycle R5 — Manual spot-check and rollback guard

- [ ] Red — add script test ensuring rollback plan (list of `git mv` inverse ops) produced with rename plan
- [ ] Green — write `rename-plan.json` and `rename-rollback.json` from `tools/prompt/rename.js`
- [ ] Refactor — document in README
- [ ] Regression — apply rollback in temp branch and verify restore
- [ ] Update checklist — mark R5 done

---

## Quick sample mappings (verify during dry-run)

- [ ] Verify prompt mappings
  - [ ] `vibecoder-debug.prompt.md` → `debug.vibecoder.prompt.md`
  - [ ] `tool.techstack.sync.prompt.md` → `tool.techstack.sync.prompt.md` (already OK)
  - [ ] `spec.transcript.to-devspec.prompt.md` → `spec.transcript.to-devspec.prompt.md` (OK)
- [ ] Verify chatmode mappings
  - [ ] `debug.repro.chatmode.md` (OK)
  - [ ] `tdd.red.chatmode.md` (OK)
- [ ] Verify instruction mappings
  - [ ] `ai-workflows.instructions.md` → keep or split into `ai-workflows.constitution.instructions.md` and `ai-workflows.general.instructions.md` as needed
  - [ ] `general.instructions.md` → `general.overview.instructions.md` (adds task)

---

## command run tasks

- [ ] Detect legacy names (no writes)
  - [ ] Run:
    ```zsh
    pnpm node tools/prompt/legacy_detector.js --scope=all > rename-plan.json
    ```
- [ ] Apply Just wrappers (dry-run first, then write with confirm)
  - [ ] Run:
    ```zsh
    just prompt-rename-dry
    just prompt-rename-write
    ```
- [ ] Update references after rename
  - [ ] Run:
    ```zsh
    pnpm node tools/docs/update_refs.js --plan rename-plan.json
    ```
- [ ] Enforce linter locally in error mode
  - [ ] Run:
    ```zsh
    ENFORCE=error pnpm prompt:lint
    ```

