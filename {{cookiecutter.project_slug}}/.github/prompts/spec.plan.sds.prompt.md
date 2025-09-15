---
title: "[SDS] {% raw %}{{ FEATURE_NAME }}{% endraw %}"
description: "System Design Specification for {% raw %}{{ FEATURE_NAME }}{% endraw %}"
domain: spec
task: plan
kind: prompt
matrix_ids: [SDS-{% raw %}{{ SDS_ID }}{% endraw %}]
thread: "{% raw %}{{ THREAD_ID }}{% endraw %}"
---

# System Design Specification (SDS-{% raw %}{{ SDS_ID }}{% endraw %})

## Overview

Brief overview of the system design for {% raw %}{{ FEATURE_NAME }}{% endraw %}.

## Architecture

### Components

List key components and their responsibilities.

### Diagram

Describe or reference architectural diagrams.

## Interfaces

### APIs

- Endpoint specifications
- Request/response formats
- Error handling

### Data Models

- Schema definitions
- Relationships

## Implementation Details

### Technologies

- Frameworks, libraries, tools

### Deployment

- Infrastructure requirements
- Scaling considerations

## References

- Related PRDs, ADRs, etc.
