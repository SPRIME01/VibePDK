import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
const budgets = require('../../tools/prompt/budgets');
const lint = require('../../tools/prompt/lint');

// Budget checks
const tokens = budgets.estimateTokensByHeuristic('word '.repeat(4000));
assert.ok(tokens > 0);
const res = budgets.evaluateAgainstBudget(tokens, 'default');
assert.ok(['warn', 'hard', 'ok'].includes(res.level));

// Lint checks (create a temp prompt)
const tmp = path.join(__dirname, '..', 'fixtures');
fs.mkdirSync(tmp, { recursive: true });
const okPrompt = path.join(tmp, 'spec.implement.prompt.md');
fs.writeFileSync(okPrompt, `---\ntitle: Test Prompt\ndescription: A test prompt\nkind: prompt\ndomain: spec\ntask: implement\nmatrix_ids: [PRD-001]\nthread: test-thread\n---\n# Title\nBody`, 'utf8');
const lint1 = lint.lintPromptFile(okPrompt);
assert.strictEqual(lint1.ok, true);

const badPrompt = path.join(tmp, 'bad.prompt.md');
fs.writeFileSync(badPrompt, `No frontmatter\nNo title`, 'utf8');
// Set gating to error mode to ensure the bad prompt fails
process.env.PROMPT_LINT_GATING = 'error';
const lint2 = lint.lintPromptFile(badPrompt);
assert.strictEqual(lint2.ok, false);
assert.ok(lint2.findings.length >= 1);
// Clean up environment variable
delete process.env.PROMPT_LINT_GATING;
