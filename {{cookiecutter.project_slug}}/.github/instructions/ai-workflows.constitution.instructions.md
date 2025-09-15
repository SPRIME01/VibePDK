---
title: AI Workflows Constitution Instructions
domain: ai-workflows
task: constitution
kind: instructions
matrix_ids: [DEV-PRD-007, DEV-PRD-010]
thread: ai-workflows-thread
---

# AI Workflows Constitution Instructions

## Gating Levels Overview

The prompt linter supports two gating levels to control validation strictness:

### WARN Mode
- **Purpose**: Development and exploratory phases where flexibility is needed
- **Behavior**: Validation failures produce warnings but do not fail linting
- **Use Case**: Early development, rapid iteration, and testing new prompt patterns

### ERROR Mode
- **Purpose**: Production and quality assurance phases where strict compliance is required
- **Behavior**: Validation failures produce errors and cause linting to fail
- **Use Case**: CI/CD pipelines, production readiness, and enforcement of standards

## Configuration and Usage

### Configuration Precedence
The prompt linter supports multiple configuration sources with the following precedence (highest to lowest):
1. **Environment variables** - Highest priority, override all other sources
2. **Configuration file (.promptlintrc)** - Project-specific settings
3. **Default values** - Built-in defaults

### Environment Variable Configuration
Set the `PROMPT_LINT_GATING` environment variable to control the gating level:

```bash
# WARN mode - warnings only, no failures
export PROMPT_LINT_GATING=warn

# ERROR mode - strict validation with failures
export PROMPT_LINT_GATING=error

# Default behavior (if not set) is ERROR mode
```

### Configuration File (.promptlintrc)
Create a `.promptlintrc` file in your project root to define gating levels and other settings. Supports JSON and YAML formats.

**JSON format example:**
```json
{
  "gating": "warn"
}
```

**YAML format example:**
```yaml
gating: warn
```

The configuration file is automatically discovered by searching from the current directory up to the filesystem root.

### Local Development with direnv
For local development, use `direnv` to manage environment-specific configuration:

1. Install direnv: `brew install direnv` (macOS) or use your package manager
2. Create `.envrc` file in your project root:
```bash
# .envrc
export PROMPT_LINT_GATING=warn
```
3. Allow the .envrc file: `direnv allow`
4. The settings will be automatically loaded when you enter the directory

This approach keeps local development settings separate from production configuration.

### Command Line Usage
Run the prompt linter with the desired gating level:

```bash
# With explicit gating level (highest precedence)
PROMPT_LINT_GATING=warn node tools/prompt/lint.js path/to/prompt.md

# Or set environment variable first
export PROMPT_LINT_GATING=warn
node tools/prompt/lint.js path/to/prompt.md

# Using configuration file - create .promptlintrc with {"gating": "warn"}
node tools/prompt/lint.js path/to/prompt.md
```

### CI/CD Integration
In your CI pipeline configuration (GitHub Actions, GitLab CI, etc.):

**Using environment variables (recommended for CI):**
```yaml
# Example GitHub Actions workflow
jobs:
  lint-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Lint prompts (WARN mode for development)
        env:
          PROMPT_LINT_GATING: warn
        run: |
          for f in .github/prompts/*.prompt.md; do
            node tools/prompt/lint.js "$f" || exit 1
          done
      - name: Lint prompts (ERROR mode for production)
        env:
          PROMPT_LINT_GATING: error
        run: |
          for f in .github/prompts/*.prompt.md; do
            node tools/prompt/lint.js "$f"
          done
```

**Using configuration file:**
Alternatively, commit a `.promptlintrc` file to your repository:

```json
{
  "gating": "error"
}
```

This approach is useful for team-wide consistency and reduces CI configuration complexity.

## Best Practices: WARN vs ERROR Modes

### When to Use WARN Mode
- **Development Phase**: During initial prompt creation and experimentation
- **Refactoring**: When making significant changes to prompt structure
- **Learning**: When team members are learning the prompt taxonomy system
- **Exploratory Work**: Testing new patterns or approaches that might not yet comply with standards

### When to Use ERROR Mode
- **Production Ready**: When prompts are being deployed to production environments
- **CI/CD Pipelines**: In automated testing and deployment workflows
- **Quality Gates**: As part of pull request validation and code review
- **Compliance**: When strict adherence to standards is required

### Escalation Strategy
Implement a phased approach to move from WARN to ERROR mode:

1. **Phase 1 (WARN)**: All validation issues are warnings during development
2. **Phase 2 (Mixed)**: Critical issues are errors, non-critical are warnings
3. **Phase 3 (ERROR)**: All validation issues are errors for production readiness

## CI Integration and Escalation

### GitHub Actions Example
Create a workflow that escalates from WARN to ERROR based on conditions:

```yaml
name: Prompt Linting with Escalation

on:
  pull_request:
    paths:
      - '**.prompt.md'
      - '.github/workflows/prompt-lint.yml'

jobs:
  lint-prompts:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        gating_level: [warn, error]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Lint prompts with ${{ matrix.gating_level }} mode
        env:
          PROMPT_LINT_GATING: ${{ matrix.gating_level }}
        run: |
          for f in .github/prompts/*.prompt.md; do
            node tools/prompt/lint.js "$f"
          done
```

### Escalation Triggers
Configure escalation based on:

- **Branch Protection**: ERROR mode on main/master branch, WARN on feature branches
- **Time-based**: Gradually increase strictness over project timeline
- **Metrics-based**: Escalate when warning count drops below threshold
- **Manual Override**: Allow temporary WARN mode for specific scenarios

## Traceability and Specification References

This implementation supports the following specification IDs from the traceability matrix:

- **DEV-PRD-007**: Prompt linting and validation functionality
- **DEV-PRD-010**: Metrics and logging integration for AI workflows

Refer to the traceability matrix for complete coverage mapping:
- File: `docs/traceability_matrix.md`
- Generated by: `tools/spec/matrix.js`

### Related Specifications
- **PRD-014**: Prompt lifecycle management and validation
- **PRD-017**: Budget enforcement and cost control for AI prompts
- **SDS-006**: Automation layer for spec parsing and validation

## Validation Types and Severity

The linter handles different validation types with appropriate severity:

### Critical Errors (Always ERROR in strict mode)
- Missing frontmatter (`---`)
- Missing H1 title (`# Title`)
- Invalid file naming pattern
- Missing required fields (title, description, kind, domain, task)

### Validation Warnings (Can be WARN or ERROR)
- Missing recommended fields (budget, precedence)
- Model validation issues
- Matrix ID pattern mismatches
- Thread field validation

## Troubleshooting and Common Issues

### WARN Mode Not Working
- Ensure `PROMPT_LINT_GATING=warn` is set before running the linter
- Check that the environment variable is exported correctly
- Verify no `.promptlintrc` file is overriding the environment variable

### ERROR Mode Too Strict
- Use WARN mode during development phases
- Address validation issues incrementally
- Consider implementing a grace period for new requirements

### Environment Variable Conflicts
- Clear any existing `PROMPT_LINT_GATING` settings
- Use explicit setting in CI configuration files
- Check for conflicting `.promptlintrc` files in parent directories

### Configuration File Not Found
- Ensure `.promptlintrc` is in the project root or appropriate parent directory
- Verify file format (JSON or YAML) is correct
- Check file permissions are readable

### Configuration Precedence Issues
Remember the precedence order: environment variables > configuration file > defaults
- Environment variables always take precedence
- Configuration files provide project-wide defaults
- Use `echo $PROMPT_LINT_GATING` to check current environment setting

## Version History

- **Cycle 7**: Initial implementation of gating levels
- **Cycle 7 Update**: Added support for `.promptlintrc` configuration files and direnv integration
- **Future**: Planned support for per-validation type severity configuration

For questions or issues, reference the AI workflows thread and relevant specification IDs.
