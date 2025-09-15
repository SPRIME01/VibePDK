const assert = require('node:assert');
const path = require('node:path');
const { detectLegacyFiles, proposeCorrectName } = require('../legacy_detector');

// Test cases for legacy files that don't match the pattern <domain>.<task>[.<phase>].<kind>.md
const LEGACY_FILES = [
  // Prompts with hyphens instead of dots
  '.github/prompts/spec-housekeeping.prompt.md',
  '.github/prompts/test-hardening.prompt.md',
  '.github/prompts/vibecoder-debug.prompt.md',
  '.github/prompts/vibecoder-tdd.prompt.md',

  // Chatmodes with incorrect patterns
  '.github/chatmodes/persona.senior-backend.chatmode.md',
  '.github/chatmodes/persona.senior-frontend.chatmode.md',
  '.github/chatmodes/persona.system-architect.chatmode.md',
  '.github/chatmodes/persona.ux-ui-designer.chatmode.md',
  '.github/chatmodes/persona.ux-ui.chatmode.md',
  '.github/chatmodes/product.elevator-pitch.chatmode.md',
  '.github/chatmodes/product.features-list.chatmode.md',
  '.github/chatmodes/product.problem-statement.chatmode.md',
  '.github/chatmodes/product.target-audience.chatmode.md',

  // Instructions with hyphens instead of dots
  '.github/instructions/ai-workflows.instructions.md',
  '.github/instructions/commit-msg.instructions.md',
  '.github/instructions/dev-docs.instructions.md'
];

// Expected corrected names based on the pattern <domain>.<task>[.<phase>].<kind>.md
const EXPECTED_CORRECTIONS: Record<string, string> = {
  '.github/prompts/spec-housekeeping.prompt.md': '.github/prompts/spec.housekeeping.prompt.md',
  '.github/prompts/test-hardening.prompt.md': '.github/prompts/test.hardening.prompt.md',
  '.github/prompts/vibecoder-debug.prompt.md': '.github/prompts/vibecoder.debug.prompt.md',
  '.github/prompts/vibecoder-tdd.prompt.md': '.github/prompts/vibecoder.tdd.prompt.md',

  '.github/chatmodes/persona.senior-backend.chatmode.md': '.github/chatmodes/persona.senior.backend.chatmode.md',
  '.github/chatmodes/persona.senior-frontend.chatmode.md': '.github/chatmodes/persona.senior.frontend.chatmode.md',
  '.github/chatmodes/persona.system-architect.chatmode.md': '.github/chatmodes/persona.system.architect.chatmode.md',
  '.github/chatmodes/persona.ux-ui-designer.chatmode.md': '.github/chatmodes/persona.ux.ui.designer.chatmode.md',
  '.github/chatmodes/persona.ux-ui.chatmode.md': '.github/chatmodes/persona.ux.ui.chatmode.md',
  '.github/chatmodes/product.elevator-pitch.chatmode.md': '.github/chatmodes/product.elevator.pitch.chatmode.md',
  '.github/chatmodes/product.features-list.chatmode.md': '.github/chatmodes/product.features.list.chatmode.md',
  '.github/chatmodes/product.problem-statement.chatmode.md': '.github/chatmodes/product.problem.statement.chatmode.md',
  '.github/chatmodes/product.target-audience.chatmode.md': '.github/chatmodes/product.target.audience.chatmode.md',

  '.github/instructions/ai-workflows.instructions.md': '.github/instructions/ai.workflows.instructions.md',
  '.github/instructions/commit-msg.instructions.md': '.github/instructions/commit.msg.instructions.md',
  '.github/instructions/dev-docs.instructions.md': '.github/instructions/dev.docs.instructions.md'
};

// Test function to run the legacy detector tests
function testLegacyDetector() {
  console.log('Testing legacy detector...');

  // Test 1: should detect legacy files and propose correct names
  console.log('Test 1: Detecting legacy files and proposing correct names');
  const result = detectLegacyFiles();

    // Verify that all legacy files are detected
    LEGACY_FILES.forEach(legacyFile => {
      assert.ok(result[legacyFile], `Legacy file ${legacyFile} should be detected`);
    });

    // Verify that the proposed corrections match expected patterns
    Object.entries(result).forEach(([currentPath, newPath]) => {
      if (currentPath in EXPECTED_CORRECTIONS) {
        const expectedPath = EXPECTED_CORRECTIONS[currentPath];
        assert.strictEqual(
          newPath,
          expectedPath,
          `Correction for ${currentPath} should be ${expectedPath}, got ${newPath}`
        );
      }
    });

  // Test 2: should return a JSON plan with currentPath to newPath mapping
  console.log('Test 2: JSON plan structure');
  const result2 = detectLegacyFiles();

  // Verify the result is an object with string keys and values
  assert.strictEqual(typeof result2, 'object');
  Object.entries(result2).forEach(([key, value]) => {
    assert.strictEqual(typeof key, 'string');
    assert.strictEqual(typeof value, 'string');
  });

  // Test 3: should only scan .github/{prompts,chatmodes,instructions} directories
  console.log('Test 3: Directory scanning scope');
  const result3 = detectLegacyFiles();

  // All detected files should be in the expected directories
  Object.keys(result3).forEach(filePath => {
    assert.ok(
      filePath.startsWith('.github/prompts/') ||
      filePath.startsWith('.github/chatmodes/') ||
      filePath.startsWith('.github/instructions/'),
      `File ${filePath} should be in one of the scanned directories`
    );
  });

  console.log('All tests passed!');
}

// Regression tests for edge cases
function testRegressionCases() {
  console.log('\nTesting regression cases...');

  // Test 4: Files that already follow correct pattern should not be flagged
  console.log('Test 4: Valid files should not be flagged as legacy');
  const result = detectLegacyFiles();

  // These files should NOT be in the result (they follow correct pattern)
  const validFiles = [
    '.github/prompts/spec.change.prompt.md',
    '.github/prompts/spec.implement.prompt.md',
    '.github/prompts/spec.items.load.prompt.md',
    '.github/prompts/spec.traceability.update.prompt.md',
    '.github/chatmodes/persona.qa.chatmode.md',
    '.github/chatmodes/product.manager.chatmode.md'
  ];

  validFiles.forEach(validFile => {
    assert.ok(!result[validFile], `Valid file ${validFile} should not be flagged as legacy`);
  });

  // Test 5: Edge case - filename with only one component before suffix
  console.log('Test 5: Single component filenames');
  // This test requires mocking the file system, so we'll test the proposeCorrectName function directly
  const singleComponentTest = proposeCorrectName('single.prompt.md');
  assert.strictEqual(singleComponentTest, 'single.prompt.md', 'Single component should remain unchanged');

  const singleComponentWithHyphen = proposeCorrectName('single-component.prompt.md');
  assert.strictEqual(singleComponentWithHyphen, 'single.component.prompt.md', 'Single component with hyphen should be corrected');

  // Test 6: Invalid characters in filename
  console.log('Test 6: Invalid characters');
  const invalidChars = proposeCorrectName('invalid@chars.prompt.md');
  assert.strictEqual(invalidChars, 'invalid@chars.prompt.md', 'Files with invalid chars should remain unchanged');

  // Test 7: Mixed hyphen/dot patterns
  console.log('Test 7: Mixed patterns');
  const mixedPattern = proposeCorrectName('domain.task-phase.chatmode.md');
  assert.strictEqual(mixedPattern, 'domain.task.phase.chatmode.md', 'Mixed hyphen/dot patterns should be corrected');

  console.log('All regression tests passed!');
}

// Run all tests
testLegacyDetector();
testRegressionCases();
