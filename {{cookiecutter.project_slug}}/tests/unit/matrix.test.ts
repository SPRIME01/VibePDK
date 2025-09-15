import assert from 'node:assert';
import path from 'node:path';
import { buildMatrix } from '../../tools/spec/matrix.js';

// Test cases for matrix.js functionality - Red phase tests that will fail initially
function testMatrixFunctionality() {
  console.log('Testing matrix.js functionality...');

  // Test 1: Links spec/plan/tasks by the same thread value
  console.log('Test 1: Linking spec/plan/tasks by thread value');
  const matrixWithThread = buildMatrix(path.join(__dirname, 'fixtures'));
  // This should fail - thread linking not implemented
  assert.strictEqual(matrixWithThread.some((row: any) => row.artifacts.includes('spec.md') && row.artifacts.includes('plan.md') && row.artifacts.includes('tasks.md')), true, 'Should link spec, plan, and tasks with same thread');

  // Test 2: Aggregates contributing artifacts per ID in matrix_ids
  console.log('Test 2: Aggregating artifacts per matrix_id');
  const matrixWithAggregation = buildMatrix(path.join(__dirname, 'fixtures'));
  // This should fail - artifact aggregation not implemented
  assert.strictEqual(matrixWithAggregation.some((row: any) => row.artifacts.length > 1 && row.id.startsWith('PRD-')), true, 'Should aggregate multiple artifacts per matrix_id');

  // Test 3: Warns if triplet (spec/plan/tasks) is incomplete for non-docs-only threads
  console.log('Test 3: Warning on incomplete triplet for non-docs-only threads');
  const matrixWithWarnings = buildMatrix(path.join(__dirname, 'fixtures'));
  assert.strictEqual(matrixWithWarnings.some((row: any) => row.status === 'warning' && row.notes.includes('incomplete triplet')), true, 'Should warn on incomplete triplet for non-docs-only threads');

  // Test 4: Accepts missing tasks when docs_only: true is specified
  console.log('Test 4: Accepting missing tasks with docs_only: true');
  const matrixWithDocsOnly = buildMatrix(path.join(__dirname, 'fixtures'));
  // This should fail - docs_only handling not implemented
  assert.strictEqual(matrixWithDocsOnly.some((row: any) => row.artifacts.some((a: string) => a.includes('spec')) && !row.artifacts.some((a: string) => a.includes('task')) && row.status === 'complete'), true, 'Should accept missing tasks when docs_only: true');

  // Test 5: Accepts missing tasks when phase: docs is specified
  console.log('Test 5: Accepting missing tasks with phase: docs');
  const matrixWithPhaseDocs = buildMatrix(path.join(__dirname, 'fixtures'));
  // This should fail - phase:docs handling not implemented
  assert.strictEqual(matrixWithPhaseDocs.some((row: any) => row.artifacts.some((a: string) => a.includes('plan')) && !row.artifacts.some((a: string) => a.includes('task')) && row.status === 'complete'), true, 'Should accept missing tasks when phase: docs');

  console.log('All matrix functionality tests completed!');
}

// Run the tests
testMatrixFunctionality();
