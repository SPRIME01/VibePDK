---
title: Malformed YAML Test
description: This frontmatter has malformed YAML syntax
kind: prompt
domain: example
task: test
budget: M
invalid-yaml-line: without colon this is wrong
---

# Malformed YAML Test

This file has malformed YAML frontmatter that should trigger parsing issues.
