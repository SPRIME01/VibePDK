---
description: A test prompt file with mixed validation issues to test severity levels
kind: prompt
domain: gating
task: test
matrix_ids: [INVALID-001]
thread: test-thread
---

# This file has mixed validation issues

This should trigger both critical errors (missing title, invalid matrix ID) and warnings (missing budget).
