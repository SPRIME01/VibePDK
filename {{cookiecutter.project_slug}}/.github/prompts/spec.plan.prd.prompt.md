---
title: "[PRD] {% raw %}{{ FEATURE_NAME }}{% endraw %}"
description: "Product Requirements Document for {% raw %}{{ FEATURE_NAME }}{% endraw %}"
domain: spec
task: plan
kind: prompt
matrix_ids: [PRD-{% raw %}{{ PRD_ID }}{% endraw %}]
thread: "{% raw %}{{ THREAD_ID }}{% endraw %}"
---

# Product Requirements Document (PRD-{% raw %}{{ PRD_ID }}{% endraw %})

## Problem Statement

Describe the problem this feature solves for users.

## Goals & Objectives

List measurable goals and success criteria.

## User Stories

- As a [user type], I want [goal] so that [benefit]

## Requirements

### Functional

- Specific functional requirements

### Non-Functional

- Performance, security, usability requirements

## Success Metrics

- KPIs and metrics to measure success

## References

- Related ADRs, SDS, etc.
