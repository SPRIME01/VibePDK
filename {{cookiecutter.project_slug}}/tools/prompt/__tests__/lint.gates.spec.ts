import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPromptFile } from '../lint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test cases for gating levels (warn vs error) in linting
function testGatingLevels() {
  console.log('Testing gating levels...');

  // Test 1: In WARN mode, validation failures should produce warnings but not fail lint
  console.log('Test 1: WARN mode - validation failures should warn but not fail');
  process.env.PROMPT_LINT_GATING = 'warn';
  const warnModeResult = lintPromptFile(path.join(__dirname, 'fixtures', 'gating.missing_title.prompt.md'));
  // In WARN mode, even with errors, the lint should pass (ok: true)
  assert.strictEqual(warnModeResult.ok, true, 'In WARN mode, files with validation issues should pass linting');
  assert.ok(warnModeResult.findings.length > 0, 'In WARN mode, findings should still be reported');
  assert.ok(warnModeResult.findings.some(f => f.message.includes('Missing frontmatter field: title')), 'Should detect missing title as warning');

  // Test 2: In ERROR mode, validation failures should produce errors and fail lint
  console.log('Test 2: ERROR mode - validation failures should error and fail');
  process.env.PROMPT_LINT_GATING = 'error';
  const errorModeResult = lintPromptFile(path.join(__dirname, 'fixtures', 'gating.missing_title.prompt.md'));
  // In ERROR mode, validation errors should cause failure (ok: false)
  assert.strictEqual(errorModeResult.ok, false, 'In ERROR mode, files with validation issues should fail linting');
  assert.ok(errorModeResult.findings.length > 0, 'In ERROR mode, findings should be reported');
  assert.ok(errorModeResult.findings.some(f => f.message.includes('Missing frontmatter field: title')), 'Should detect missing title as error');

  // Test 3: Different validation types can have different severity levels
  console.log('Test 3: Different validation types with different severities');
  process.env.PROMPT_LINT_GATING = 'warn';
  const mixedSeverityResult = lintPromptFile(path.join(__dirname, 'fixtures', 'gating.mixed_issues.prompt.md'));
  // In WARN mode, critical errors should be warnings, less critical should be warnings
  assert.strictEqual(mixedSeverityResult.ok, true, 'In WARN mode, mixed severity issues should pass');
  const errorFindings = mixedSeverityResult.findings.filter(f => f.severity === 'error');
  const warnFindings = mixedSeverityResult.findings.filter(f => f.severity === 'warn');
  assert.ok(errorFindings.length === 0, 'In WARN mode, no findings should be marked as ERROR');
  assert.ok(warnFindings.length > 0, 'In WARN mode, findings should be marked as WARN');

  process.env.PROMPT_LINT_GATING = 'error';
  const mixedSeverityErrorResult = lintPromptFile(path.join(__dirname, 'fixtures', 'gating.mixed_issues.prompt.md'));
  // In ERROR mode, critical errors should be errors, less critical should be warnings
  assert.strictEqual(mixedSeverityErrorResult.ok, false, 'In ERROR mode, critical errors should cause failure');
  const errorFindings2 = mixedSeverityErrorResult.findings.filter(f => f.severity === 'error');
  const warnFindings2 = mixedSeverityErrorResult.findings.filter(f => f.severity === 'warn');
  assert.ok(errorFindings2.length > 0, 'In ERROR mode, critical findings should be marked as ERROR');
  assert.ok(warnFindings2.length > 0, 'In ERROR mode, less critical findings should be marked as WARN');

  // Test 4: Default gating level should be ERROR
  console.log('Test 4: Default gating level should be ERROR');
  delete process.env.PROMPT_LINT_GATING;
  const defaultModeResult = lintPromptFile(path.join(__dirname, 'fixtures', 'gating.missing_title.prompt.md'));
  assert.strictEqual(defaultModeResult.ok, false, 'Default gating level should be ERROR (fail on validation issues)');

  console.log('All gating level tests completed!');
}

// Run the tests
testGatingLevels();
