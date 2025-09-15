import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPromptFile } from '../lint.js';

// Type definition for validation findings
interface ValidationFinding {
  severity: 'error' | 'warn';
  message: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test cases for filename taxonomy and required frontmatter validation
function testTaxonomyLinting() {
  console.log('Testing taxonomy linting...');

  // Test 1: Valid filename pattern and complete frontmatter
  console.log('Test 1: Valid filename and frontmatter');
  const validResult = lintPromptFile(path.join(__dirname, 'fixtures', 'example.test.prompt.md'));
  assert.strictEqual(validResult.ok, true, 'Valid file should pass linting');
  assert.strictEqual(validResult.findings.length, 0, 'Valid file should have no findings');

  // Test 2: Missing required frontmatter keys
  console.log('Test 2: Missing required frontmatter keys');
  const missingKeysResult = lintPromptFile(path.join(__dirname, 'fixtures', 'example.test.missing_keys.prompt.md'));
  assert.strictEqual(missingKeysResult.ok, false, 'File with missing keys should fail');
  assert.ok(missingKeysResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: title')), 'Should detect missing title');
  assert.ok(missingKeysResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: description')), 'Should detect missing description');
  assert.ok(missingKeysResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: domain')), 'Should detect missing domain');
  assert.ok(missingKeysResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: task')), 'Should detect missing task');
  assert.ok(missingKeysResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: kind')), 'Should detect missing kind');

  // Test 3: Bad filename pattern
  console.log('Test 3: Bad filename pattern');
  const badFilenameResult = lintPromptFile(path.join(__dirname, 'fixtures', 'bad_filename.prompt.md'));
  assert.strictEqual(badFilenameResult.ok, false, 'File with bad filename should fail');
  assert.ok(badFilenameResult.findings.some((f: ValidationFinding) => f.message.includes('Filename does not match pattern <domain>.<task>[.<phase>].<kind>.md')), 'Should detect bad filename pattern');

  // Test 4: Valid filename with optional phase
  console.log('Test 4: Valid filename with optional phase');
  const withPhaseResult = lintPromptFile(path.join(__dirname, 'fixtures', 'example.test.planning.prompt.md'));
  assert.strictEqual(withPhaseResult.ok, true, 'File with phase should pass');
  assert.strictEqual(withPhaseResult.findings.length, 0, 'File with phase should have no findings');

  // Test 5: Edge case - uppercase domain (should be normalized but pattern should pass)
  console.log('Test 5: Uppercase domain');
  const uppercaseResult = lintPromptFile(path.join(__dirname, 'fixtures', 'UPPERCASE.domain.prompt.md'));
  assert.strictEqual(uppercaseResult.ok, false, 'Uppercase domain should fail filename pattern check');

  // Test 6: Unexpected kind
  console.log('Test 6: Unexpected kind');
  const unexpectedKindResult = lintPromptFile(path.join(__dirname, 'fixtures', 'spec.unexpected.kind.md'));
  assert.strictEqual(unexpectedKindResult.ok, false, 'Unexpected kind should fail');
  assert.ok(unexpectedKindResult.findings.some((f: ValidationFinding) => f.message.includes('Unexpected file kind')), 'Should detect unexpected kind');

  // Regression tests for edge cases

  // Test 7: Special characters in domain/task/phase (in filename)
  console.log('Test 7: Special characters in filename');
  const specialCharsResult = lintPromptFile(path.join(__dirname, 'fixtures', 'special!chars.in-domain.prompt.md'));
  assert.strictEqual(specialCharsResult.ok, false, 'File with special characters in filename should fail filename pattern check');
  assert.ok(specialCharsResult.findings.some((f: ValidationFinding) => f.message.includes('Filename does not match pattern <domain>.<task>[.<phase>].<kind>.md')), 'Should detect special characters in filename');

  // Test 8: Very long field values
  console.log('Test 8: Very long field values');
  const longValuesResult = lintPromptFile(path.join(__dirname, 'fixtures', 'very.long.values.prompt.md'));
  assert.strictEqual(longValuesResult.ok, true, 'File with long values should pass (values are parsed correctly)');
  assert.strictEqual(longValuesResult.findings.length, 0, 'File with long values should have no findings');

  // Test 9: Missing frontmatter entirely
  console.log('Test 9: Missing frontmatter entirely');
  const noFrontmatterResult = lintPromptFile(path.join(__dirname, 'fixtures', 'no.frontmatter.prompt.md'));
  assert.strictEqual(noFrontmatterResult.ok, false, 'File without frontmatter should fail');
  assert.ok(noFrontmatterResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter (---)')), 'Should detect missing frontmatter');
  assert.ok(noFrontmatterResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: title')), 'Should detect missing title field');
  assert.ok(noFrontmatterResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: description')), 'Should detect missing description field');
  assert.ok(noFrontmatterResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: kind')), 'Should detect missing kind field');
  assert.ok(noFrontmatterResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: domain')), 'Should detect missing domain field');
  assert.ok(noFrontmatterResult.findings.some((f: ValidationFinding) => f.message.includes('Missing frontmatter field: task')), 'Should detect missing task field');

  // Test 10: Malformed YAML frontmatter
  console.log('Test 10: Malformed YAML frontmatter');
  const malformedYamlResult = lintPromptFile(path.join(__dirname, 'fixtures', 'malformed.yaml.prompt.md'));
  // The naive parser should ignore malformed lines and parse valid fields, so the file should pass
  assert.strictEqual(malformedYamlResult.ok, true, 'File with malformed YAML should pass as naive parser ignores invalid lines');
  assert.strictEqual(malformedYamlResult.findings.length, 0, 'Malformed YAML should have no findings as invalid lines are ignored');

  // Test 11: Incorrect kinds beyond prompt/chatmode/instructions
  console.log('Test 11: Incorrect kinds');
  const incorrectKindResult = lintPromptFile(path.join(__dirname, 'fixtures', 'spec.unexpected.kind.md'));
  assert.strictEqual(incorrectKindResult.ok, false, 'File with incorrect kind should fail');
  assert.ok(incorrectKindResult.findings.some((f: ValidationFinding) => f.message.includes('Unexpected file kind')), 'Should detect incorrect kind');

  console.log('All taxonomy linting tests passed!');
}

// Run the tests
testTaxonomyLinting();
