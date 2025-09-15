/* Generate/update docs/traceability_matrix.md by scanning docs for Spec IDs.
Implements: PRD-002/PRD-007; SDS-003 */
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { extractIdsFromFile, validateIdFormat } = require('./ids');

/**
 * Recursively gathers all markdown files from a directory
 * @param {string} root - Root directory to search
 * @returns {string[]} Array of absolute file paths
 */
function gatherMarkdownFiles(root) {
    const out = [];
    const entries = fs.readdirSync(root, { withFileTypes: true });

    for (const e of entries) {
        const p = path.join(root, e.name);
        if (e.isDirectory()) {
            if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
            out.push(...gatherMarkdownFiles(p));
        } else if (e.isFile() && e.name.endsWith('.md')) {
            out.push(p);
        }
    }
    return out;
}

/**
 * Extracts YAML frontmatter from markdown text
 * @param {string} text - The markdown text to parse
 * @returns {Object} Parsed frontmatter fields
 */
function extractFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    try {
        return yaml.load(match[1]) || {};
    } catch (e) {
        console.error('Error parsing YAML frontmatter:', e.message);
        return {};
    }
}

/**
 * Determines the status of a thread based on artifacts and frontmatter
 * @param {Set<string>} artifacts - Set of artifact filenames
 * @param {Object} frontmatter - Frontmatter fields
 * @returns {{status: string, notes: string}} Status and notes
 */
function determineStatus(artifacts, frontmatter) {
    const artifactNames = [...artifacts];
    const hasSpec = artifactNames.some(name => name.includes('spec'));
    const hasPlan = artifactNames.some(name => name.includes('plan'));
    const hasTasks = artifactNames.some(name => name.includes('task'));

    // Handle docs_only or phase:docs cases
    if (frontmatter.docs_only === true || frontmatter.phase === 'docs') {
        if (hasSpec || hasPlan) {
            return { status: 'complete', notes: '' };
        }
    }

    // Check for complete triplet (spec, plan, tasks)
    if (hasSpec && hasPlan && hasTasks) {
        return { status: 'complete', notes: '' };
    }

    // Warning for incomplete triplet
    if (hasSpec || hasPlan || hasTasks) {
        const missing = [];
        if (!hasSpec) missing.push('spec');
        if (!hasPlan) missing.push('plan');
        if (!hasTasks) missing.push('tasks');
        return { status: 'warning', notes: `incomplete triplet: missing ${missing.join(', ')}` };
    }

    return { status: 'referenced', notes: '' };
}

/**
 * Builds a traceability matrix from markdown files in docs directory
 * @param {string} rootDir - Root directory of the project
 * @returns {Array<{id: string, artifacts: string[], status: string, notes: string}>} Matrix rows
 */
function buildMatrix(rootDir) {
    const files = gatherMarkdownFiles(path.join(rootDir, 'docs'));
    const threadMap = new Map(); // thread -> { artifacts: Set, frontmatter: combined }

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const frontmatter = extractFrontmatter(content);
        const filename = path.basename(file);

        if (frontmatter.thread) {
            const thread = frontmatter.thread;
            let threadData = threadMap.get(thread) || { artifacts: new Set(), frontmatter: {} };
            threadData.artifacts.add(filename);

            // Merge frontmatter (for docs_only and phase)
            if (frontmatter.docs_only !== undefined) {
                threadData.frontmatter.docs_only = frontmatter.docs_only;
            }
            if (frontmatter.phase !== undefined) {
                threadData.frontmatter.phase = frontmatter.phase;
            }

            threadMap.set(thread, threadData);
        }
    }

    // Also handle matrix_ids from text content for backward compatibility
    const idMap = new Map(); // id -> { artifacts: Set, status, notes }
    for (const file of files) {
        const ids = extractIdsFromFile(file);
        for (const spec of ids) {
            if (!validateIdFormat(spec.id)) continue;
            const row = idMap.get(spec.id) || { artifacts: new Set(), status: 'referenced', notes: '' };
            row.artifacts.add(path.relative(rootDir, spec.source));
            idMap.set(spec.id, row);
        }
    }

    // Combine thread-based and id-based data
    const combinedRows = new Map();

    // Add thread-based entries
    for (const [thread, threadData] of threadMap.entries()) {
        const { status, notes } = determineStatus(threadData.artifacts, threadData.frontmatter);
        combinedRows.set(thread, {
            id: thread,
            artifacts: [...threadData.artifacts].sort(),
            status,
            notes
        });
    }

    // Add id-based entries (for backward compatibility)
    for (const [id, row] of idMap.entries()) {
        if (!combinedRows.has(id)) {
            combinedRows.set(id, {
                id,
                artifacts: [...row.artifacts].sort(),
                status: row.status,
                notes: row.notes
            });
        }
    }

    return [...combinedRows.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Renders matrix rows as a markdown table
 * @param {Array<{id: string, artifacts: string[], status: string, notes: string}>} rows - Matrix rows
 * @returns {string} Markdown table
 */
function renderMatrixTable(rows) {
    const header = '| Spec ID | Artifacts | Status | Notes |\n|---|---|---|---|';
    const lines = rows.map(r => `| ${r.id} | ${r.artifacts.join('<br>')} | ${r.status} | ${r.notes} |`);
    return [header, ...lines].join('\n');
}

/**
 * Updates the traceability matrix file
 * @param {string} rootDir - Root directory of the project
 * @returns {{file: string, count: number}} Result with file path and row count
 */
function updateMatrixFile(rootDir) {
    const rows = buildMatrix(rootDir);
    const table = renderMatrixTable(rows);
    const file = path.join(rootDir, 'docs', 'traceability_matrix.md');
    const banner = '# Traceability Matrix\n\nNote: This file is generated/updated by tools/spec/matrix.js. Do not edit manually.\n\n';
    const content = banner + table + '\n';
    fs.writeFileSync(file, content, 'utf8');
    return { file, count: rows.length };
}

if (require.main === module) {
    const root = process.cwd();
    const result = updateMatrixFile(root);
    console.log(`[matrix] Updated ${result.file} with ${result.count} row(s).`);
}

module.exports = { buildMatrix, renderMatrixTable, updateMatrixFile };
