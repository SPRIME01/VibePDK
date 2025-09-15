import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPromptFile } from '../lint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test cases for matrix_ids and thread validation in prompt frontmatter
function testMatrixIdsAndThreadValidation() {
  console.log('Testing matrix_ids and thread validation...');

  // Test 1: Valid matrix_ids with ADR pattern
  console.log('Test 1: Valid matrix_ids with ADR pattern');
  const validAdrResult = lintPromptFile(path.join(__dirname, 'fixtures', 'valid.adr.matrix.prompt.md'));
  assert.strictEqual(validAdrResult.ok, true, 'File with valid matrix_ids should pass');
  assert.strictEqual(validAdrResult.findings.length, 0, 'File with valid matrix_ids should have no findings');

  // Test 2: Valid matrix_ids with PRD pattern
  console.log('Test 2: Valid matrix_ids with PRD pattern');
  const validPrdResult = lintPromptFile(path.join(__dirname, 'fixtures', 'valid.prd.matrix.prompt.md'));
  assert.strictEqual(validPrdResult.ok, true, 'File with valid matrix_ids should pass');
  assert.strictEqual(validPrdResult.findings.length, 0, 'File with valid matrix_ids should have no findings');

  // Test 3: Valid matrix_ids with DEV- prefixed pattern
  console.log('Test 3: Valid matrix_ids with DEV- prefixed pattern');
  const validDevResult = lintPromptFile(path.join(__dirname, 'fixtures', 'valid.dev.matrix.prompt.md'));
  assert.strictEqual(validDevResult.ok, true, 'File with valid matrix_ids should pass');
  assert.strictEqual(validDevResult.findings.length, 0, 'File with valid matrix_ids should have no findings');

  // Test 4: Invalid matrix_ids pattern
  console.log('Test 4: Invalid matrix_ids pattern');
  const invalidMatrixResult = lintPromptFile(path.join(__dirname, 'fixtures', 'invalid.matrix.prompt.md'));
  assert.strictEqual(invalidMatrixResult.ok, false, 'File with invalid matrix_ids should fail');
  assert.ok(invalidMatrixResult.findings.includes('Matrix ID "INVALID-001" does not match pattern /^(ADR|ARD|PRD|SDS|TS|TASK|DEV-ADR|DEV-PRD|DEV-SDS)-\\d{3,4}$/'), 'Should detect invalid matrix_id pattern');

  // Test 5: Valid singular id (backwards compatibility)
  console.log('Test 5: Valid singular id (backwards compatibility)');
  const validSingularIdResult = lintPromptFile(path.join(__dirname, 'fixtures', 'valid.singular.id.prompt.md'));
  assert.strictEqual(validSingularIdResult.ok, true, 'File with valid singular id should pass');
  assert.strictEqual(validSingularIdResult.findings.length, 0, 'File with valid singular id should have no findings');

  // Test 6: Invalid singular id pattern
  console.log('Test 6: Invalid singular id pattern');
  const invalidSingularIdResult = lintPromptFile(path.join(__dirname, 'fixtures', 'invalid.singular.id.prompt.md'));
  assert.strictEqual(invalidSingularIdResult.ok, false, 'File with invalid singular id should fail');
  assert.ok(invalidSingularIdResult.findings.includes('Legacy ID "INVALID-001" does not match pattern /^(ADR|ARD|PRD|SDS|TS|TASK|DEV-ADR|DEV-PRD|DEV-SDS)-\\d{3,4}$/'), 'Should detect invalid singular id pattern');

  // Test 7: Missing thread
  console.log('Test 7: Missing thread');
  const missingThreadResult = lintPromptFile(path.join(__dirname, 'fixtures', 'missing.thread.prompt.md'));
  assert.strictEqual(missingThreadResult.ok, false, 'File without thread should fail');
  assert.ok(missingThreadResult.findings.includes('Missing frontmatter field: thread'), 'Should detect missing thread');

  // Test 8: Missing matrix_ids
  console.log('Test 8: Missing matrix_ids');
  const missingMatrixIdsResult = lintPromptFile(path.join(__dirname, 'fixtures', 'missing.matrix_ids.prompt.md'));
  assert.strictEqual(missingMatrixIdsResult.ok, false, 'File without matrix_ids should fail');
  assert.ok(missingMatrixIdsResult.findings.includes('Missing frontmatter field: matrix_ids'), 'Should detect missing matrix_ids');

  console.log('All matrix_ids and thread validation tests completed!');
}

// Run the tests
testMatrixIdsAndThreadValidation();
