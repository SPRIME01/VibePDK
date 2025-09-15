import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPromptFile } from '../lint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test cases for model validation in prompt frontmatter
function testModelValidation() {
  console.log('Testing model validation...');

  // Test 1: Valid model key that exists in models.yaml (GPT-4.1)
  console.log('Test 1: Valid model key (GPT-4.1)');
  const validModelResult = lintPromptFile(path.join(__dirname, 'fixtures', 'valid.model.prompt.md'));
  // This should pass once model validation is implemented
  assert.strictEqual(validModelResult.ok, true, 'File with valid model should pass linting');
  // Check that there are no model-related errors (recommendations are okay)
  const modelErrors = validModelResult.findings.filter(f => f.includes('Model') && !f.includes('Recommend'));
  assert.strictEqual(modelErrors.length, 0, 'File with valid model should have no model errors');

  // Test 2: Valid model key that exists in models.yaml (GPT-5 mini (Preview))
  console.log('Test 2: Valid model key (GPT-5 mini (Preview))');
  const validChatmodeModelResult = lintPromptFile(path.join(__dirname, 'fixtures', 'valid.chatmode.model.prompt.md'));
  // This should pass once model validation is implemented
  assert.strictEqual(validChatmodeModelResult.ok, true, 'File with valid chatmode model should pass linting');
  // Check that there are no model-related errors (recommendations are okay)
  const modelErrors2 = validChatmodeModelResult.findings.filter(f => f.includes('Model') && !f.includes('Recommend'));
  assert.strictEqual(modelErrors2.length, 0, 'File with valid chatmode model should have no model errors');

  // Test 3: Invalid model key that doesn't exist in models.yaml
  console.log('Test 3: Invalid model key');
  const invalidModelResult = lintPromptFile(path.join(__dirname, 'fixtures', 'invalid.model.prompt.md'));
  // This should fail once model validation is implemented
  assert.strictEqual(invalidModelResult.ok, false, 'File with invalid model should fail linting');
  assert.ok(invalidModelResult.findings.includes('Model "gpt-3.5-turbo" not found in .github/models.yaml'), 'Should detect invalid model');

  // Test 4: Edge case - model with special characters
  console.log('Test 4: Model with special characters');
  const specialCharsModelResult = lintPromptFile(path.join(__dirname, 'fixtures', 'special.chars.model.prompt.md'));
  // This should fail once model validation is implemented
  assert.strictEqual(specialCharsModelResult.ok, false, 'File with model containing special characters should fail linting');
  assert.ok(specialCharsModelResult.findings.includes('Model "gpt-4@special" not found in .github/models.yaml'), 'Should detect model with special characters');

  // Test 5: Edge case - retired model (simulated)
  console.log('Test 5: Retired model');
  const retiredModelResult = lintPromptFile(path.join(__dirname, 'fixtures', 'retired.model.prompt.md'));
  // This should fail once model validation is implemented
  assert.strictEqual(retiredModelResult.ok, false, 'File with retired model should fail linting');
  assert.ok(retiredModelResult.findings.includes('Model "gpt-3" not found in .github/models.yaml'), 'Should detect retired model');

  // Test 6: Missing model key (should not fail as model is optional)
  console.log('Test 6: Missing model key');
  const missingModelResult = lintPromptFile(path.join(__dirname, 'fixtures', 'missing.model.prompt.md'));
  // This should pass as model is optional
  assert.strictEqual(missingModelResult.ok, true, 'File without model should pass linting');
  // Check that there are no model-related errors (recommendations are okay)
  const modelErrors6 = missingModelResult.findings.filter(f => f.includes('Model') && !f.includes('Recommend'));
  assert.strictEqual(modelErrors6.length, 0, 'File without model should have no model errors');

  // Test 7: Empty model key
  console.log('Test 7: Empty model key');
  const emptyModelResult = lintPromptFile(path.join(__dirname, 'fixtures', 'empty.model.prompt.md'));
  // This should fail once model validation is implemented
  assert.strictEqual(emptyModelResult.ok, false, 'File with empty model should fail linting');
  assert.ok(emptyModelResult.findings.includes('Model "" not found in .github/models.yaml'), 'Should detect empty model');

  console.log('All model validation tests completed!');
}

// Run the tests
testModelValidation();
