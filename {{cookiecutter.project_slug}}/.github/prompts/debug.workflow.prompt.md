---
kind: prompt
domain: debug
task: workflow
budget: M
mode: "agent"
model: GPT-4.1
tools: ["codebase", "search", "runTests"]
description: "Structured debugging phases from report to regression."
---

# Debugging Workflow

## Inputs

{% raw %}

- Bug summary and steps: {{BUG}}
- Affected module(s): {{TARGET}}
- Env/versions (optional): {{ENV}}
  {% endraw %}

## Start

- Normalize report; identify missing info and plan reproduction.

## Repro

- Add a failing test that captures the defect.

## Isolate

- Bisect or instrument to find root cause; keep diffs small.

## Fix

- Apply the minimal fix; ensure tests pass.

## Refactor

- Clean up, remove instrumentation, improve clarity.

## Regress

- Add regression cases; run broader suites.

## Output

- Direct edits, failing→passing tests, and a concise note linking spec/ADR implications if any.
