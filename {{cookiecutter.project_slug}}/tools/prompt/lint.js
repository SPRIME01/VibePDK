/**
 * Prompt/Mode/Instruction linter
 * - Validates title and YAML frontmatter presence
 * - Enforces taxonomy fields: kind, domain, task (phase optional)
 * Implements: PRD-014/017; DEV-PRD-007/010
 */
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { loadConfig } = require('./config');

/** Valid file kinds */
const VALID_KINDS = ['prompt', 'chatmode', 'instructions'];

/** Regex pattern for valid matrix IDs */
const MATRIX_ID_PATTERN = /^(ADR|ARD|PRD|SDS|TS|TASK|DEV-ADR|DEV-PRD|DEV-SDS)-\d{3,4}$/;


/**
 * Extracts YAML frontmatter from markdown text
 * @param {string} text - The markdown text to parse
 * @returns {Object} Object containing raw frontmatter text and parsed fields
 */
function extractFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/m);
  if (!m) return { raw: null, fields: {} };

  const raw = m[1];
  const fields = {};

  // naive YAML: key: value on single line (ignore arrays/objects except simple scalars)
  for (const line of raw.split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
    if (!mm) continue;

    const key = mm[1].trim();
    let val = mm[2].trim();

    // Handle array values for matrix_ids
    if (key === 'matrix_ids') {
      // Parse array format: [item1, item2, ...] or just a single item
      if (val.startsWith('[') && val.endsWith(']')) {
        // Remove brackets and split by comma
        const items = val.slice(1, -1).split(',').map(item => {
          let trimmed = item.trim();
          // Strip quotes if present
          if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
            trimmed = trimmed.slice(1, -1);
          }
          return trimmed;
        });
        fields[key] = items;
      } else {
        // Single item, treat as array with one element
        // Strip quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
          val = val.slice(1, -1);
        }
        fields[key] = [val];
      }
      continue;
    }

    // strip quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
      val = val.slice(1, -1);
    }
    fields[key] = val;
  }

  return { raw, fields };
}

/**
 * Validates filename pattern against expected taxonomy format
 * @param {string} filename - The filename to validate
 * @returns {Object} Validation result with validity, reason, and extracted parts
 */
function validateFilenamePattern(filename) {
  // Pattern: <domain>.<task>[.<phase>].<kind>.md
  // Domain, task, phase should be lowercase alphanumeric with hyphens/underscores
  const pattern = /^([a-z0-9_-]+)\.([a-z0-9_-]+)(\.([a-z0-9_-]+))?\.([a-z0-9_-]+)\.md$/;
  const match = pattern.exec(path.basename(filename));

  if (!match) {
    return {
      valid: false,
      reason: 'Filename does not match pattern <domain>.<task>[.<phase>].<kind>.md'
    };
  }

  const domain = match[1];
  const task = match[2];
  const phase = match[4] || null; // Optional phase
  const kind = match[5];

  return { valid: true, domain, task, phase, kind };
}

/**
 * Classifies a file based on its filename pattern
 * @param {string} file - The file path to classify
 * @returns {string} The file kind or 'invalid' if pattern doesn't match
 */
function classify(file) {
  const filenameValidation = validateFilenamePattern(file);
  return filenameValidation.valid ? filenameValidation.kind : 'invalid';
}

/**
 * Validates required frontmatter fields based on file kind
 * @param {Object} fields - The parsed frontmatter fields
 * @param {string} kind - The file kind
 * @returns {Object[]} Array of validation findings with severity and message
 */
function validateRequiredFields(fields, kind) {
  const findings = [];
  const config = loadConfig();
  const defaultSeverity = config.gating === 'warn' ? 'warn' : 'error';

  // Required fields for all valid kinds - these are always errors
  if (!fields.title) findings.push({ severity: defaultSeverity, message: "Missing frontmatter field: title" });
  if (!fields.description) findings.push({ severity: defaultSeverity, message: "Missing frontmatter field: description" });
  if (!fields.kind) findings.push({ severity: defaultSeverity, message: "Missing frontmatter field: kind" });
  if (!fields.domain) findings.push({ severity: defaultSeverity, message: "Missing frontmatter field: domain" });
  if (kind !== 'instructions' && !fields.task) findings.push({ severity: defaultSeverity, message: "Missing frontmatter field: task" });

  return findings;
}

/**
 * Validates recommended frontmatter fields based on file kind
 * @param {Object} fields - The parsed frontmatter fields
 * @param {string} kind - The file kind
 * @returns {Object[]} Array of recommendation findings with severity and message
 */
function validateRecommendedFields(fields, kind) {
  const findings = [];

  // Optional but recommended fields - these are always warnings
  if ((kind === 'prompt' || kind === 'chatmode') && !fields.budget) {
    findings.push({ severity: 'warn', message: "Recommend adding frontmatter field: budget (S|M|L)" });
  }
  if (kind === 'instructions' && !fields.precedence) {
    findings.push({ severity: 'warn', message: "Recommend adding frontmatter field: precedence" });
  }

  return findings;
}

/**
 * Validates matrix_ids field against allowed patterns
 * @param {Object} fields - The parsed frontmatter fields
 * @returns {Object[]} Array of validation findings with severity and message
 */
function validateMatrixIds(fields) {
  const findings = [];
  const config = loadConfig();
  const defaultSeverity = config.gating === 'warn' ? 'warn' : 'error';

  // Check for legacy singular id field
  if (fields.id !== undefined && fields.matrix_ids === undefined) {
    // Backwards compatibility: normalize singular id to matrix_ids array
    if (typeof fields.id === 'string' && MATRIX_ID_PATTERN.test(fields.id)) {
      // This is a valid case, no error needed
      return findings;
    } else if (typeof fields.id !== 'string') {
      findings.push({ severity: defaultSeverity, message: 'Legacy field "id" must be a string' });
      return findings;
    } else {
      findings.push({ severity: defaultSeverity, message: `Legacy ID "${fields.id}" does not match pattern ${MATRIX_ID_PATTERN.toString()}` });
      return findings;
    }
  }

  // Check for matrix_ids field
  if (fields.matrix_ids === undefined) {
    findings.push({ severity: defaultSeverity, message: 'Missing frontmatter field: matrix_ids' });
    return findings;
  }

  // Validate matrix_ids is an array
  if (!Array.isArray(fields.matrix_ids)) {
    findings.push({ severity: defaultSeverity, message: 'Field "matrix_ids" must be an array' });
    return findings;
  }

  // Validate each matrix_id in the array
  for (const id of fields.matrix_ids) {
    if (typeof id !== 'string') {
      findings.push({ severity: defaultSeverity, message: 'Each item in "matrix_ids" must be a string' });
      continue;
    }

    if (!MATRIX_ID_PATTERN.test(id)) {
      findings.push({ severity: defaultSeverity, message: `Matrix ID "${id}" does not match pattern ${MATRIX_ID_PATTERN.toString()}` });
    }
  }

  return findings;
}

/**
 * Validates thread field
 * @param {Object} fields - The parsed frontmatter fields
 * @returns {Object[]} Array of validation findings with severity and message
 */
function validateThread(fields) {
  const findings = [];
  const config = loadConfig();
  const defaultSeverity = config.gating === 'warn' ? 'warn' : 'error';

  if (fields.thread === undefined) {
    findings.push({ severity: defaultSeverity, message: 'Missing frontmatter field: thread' });
    return findings;
  }

  if (typeof fields.thread !== 'string') {
    findings.push({ severity: defaultSeverity, message: 'Field "thread" must be a string' });
    return findings;
  }

  if (fields.thread.trim() === '') {
    findings.push({ severity: defaultSeverity, message: 'Field "thread" cannot be empty' });
    return findings;
  }

  return findings;
}

/**
 * Validates markdown title presence
 * @param {string} text - The markdown text to validate
 * @returns {Object[]} Array of title validation findings with severity and message
 */
function validateTitle(text) {
  const config = loadConfig();
  const defaultSeverity = config.gating === 'warn' ? 'warn' : 'error';
  return /^#\s+.+/m.test(text) ? [] : [{ severity: defaultSeverity, message: 'Missing H1 title (# ...)' }];
}

/**
 * Validates frontmatter presence
 * @param {string} raw - The raw frontmatter text
 * @returns {Object[]} Array of frontmatter validation findings with severity and message
 */
function validateFrontmatterPresence(raw) {
  const config = loadConfig();
  const defaultSeverity = config.gating === 'warn' ? 'warn' : 'error';
  return raw ? [] : [{ severity: defaultSeverity, message: 'Missing frontmatter (---)' }];
}

/**
 * Validates filename pattern and kind
 * @param {string} file - The file path to validate
 * @returns {Object[]} Array of filename validation findings with severity and message
 */
function validateFilenameAndKind(file) {
  const findings = [];
  const config = loadConfig();
  const defaultSeverity = config.gating === 'warn' ? 'warn' : 'error';
  const filenameValidation = validateFilenamePattern(file);

  if (!filenameValidation.valid) {
    findings.push({ severity: defaultSeverity, message: filenameValidation.reason });
  } else if (!VALID_KINDS.includes(filenameValidation.kind)) {
    findings.push({ severity: defaultSeverity, message: 'Unexpected file kind' });
  }

  return findings;
}

/**
 * Cache for loaded models to avoid repeated file I/O operations.
 * Uses module-level caching for thread-safe performance in Node.js.
 * @type {string[]|null} Array of model names or null if not yet loaded
 */
let cachedModels = null;

/**
 * Loads models from .github/models.yaml with performance caching.
 * The function caches the models list after first load to avoid
 * repeated file system operations and YAML parsing.
 *
 * @returns {string[]} Array of valid model names from models.yaml
 * @throws Will not throw but returns empty array on file errors
 */
function loadModels() {
  // Return cached models if available (performance optimization)
  if (cachedModels !== null) {
    return cachedModels;
  }

  const modelsPath = path.join(__dirname, '..', '..', '.github', 'models.yaml');
  if (fs.existsSync(modelsPath)) {
    try {
      const modelsContent = fs.readFileSync(modelsPath, 'utf8');
      const config = yaml.load(modelsContent);
      // Cache the result for subsequent calls
      cachedModels = Array.isArray(config.models) ? config.models : [];
      return cachedModels;
    } catch (e) {
      console.error(`Error loading models from ${modelsPath}: ${e.message}`);
      // Cache empty array to avoid repeated error handling
      cachedModels = [];
      return cachedModels;
    }
  }
  console.error(`Models file not found: ${modelsPath}`);
  // Cache empty array to avoid repeated file existence checks
  cachedModels = [];
  return cachedModels;
}

/**
 * Validates model field against allowed models from models.yaml
 * @param {Object} fields - The parsed frontmatter fields object
 * @param {string[]} models - Array of valid model names to validate against
 * @returns {Object[]} Array of validation findings with severity and message
 */
function validateModel(fields, models) {
  const findings = [];
  const config = loadConfig();
  const defaultSeverity = config.gating === 'warn' ? 'warn' : 'error';
  const modelValue = fields.model;

  // Only validate if model field is present and not null/undefined
  if (modelValue !== undefined && modelValue !== null) {
    if (typeof modelValue !== 'string') {
      findings.push({ severity: defaultSeverity, message: `Model field must be a string, got ${typeof modelValue}` });
    } else if (modelValue.trim() === '') {
      findings.push({ severity: defaultSeverity, message: 'Model "" not found in .github/models.yaml' });
    } else if (!models.includes(modelValue)) {
      findings.push({ severity: defaultSeverity, message: `Model "${modelValue}" not found in .github/models.yaml` });
    }
  }

  return findings;
}

/**
 * Lints a prompt file for taxonomy and frontmatter validation
 * @param {string} file - The file path to lint
 * @returns {Object} Linting result with ok status and findings array
 */
function lintPromptFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const findings = [];
  const config = loadConfig();

  // Validate basic markdown structure
  findings.push(...validateTitle(text));

  const { fields, raw } = extractFrontmatter(text);
  findings.push(...validateFrontmatterPresence(raw));

  const kind = classify(file);
  findings.push(...validateFilenameAndKind(file));

  // Validate required fields and model for valid kinds
  if (VALID_KINDS.includes(kind)) {
    findings.push(...validateRequiredFields(fields, kind));

    // Validate model if present
    const models = loadModels();
    findings.push(...validateModel(fields, models));

    // Validate matrix_ids and thread (only for spec-related files)
    if (fields.domain === 'spec' || (fields.task && (fields.task.includes('spec') || fields.task.includes('plan') || fields.task.includes('feature')))) {
      findings.push(...validateMatrixIds(fields));
      findings.push(...validateThread(fields));
    }

    // Recommended fields
    findings.push(...validateRecommendedFields(fields, kind));
  }

  // Determine pass/fail based on gating mode
  let ok = true;
  if (config.gating === 'error') {
    // In error mode, fail only if there are error severity findings
    const hasErrors = findings.some(finding => finding.severity === 'error');
    ok = !hasErrors;
  } else {
    // In warn mode, always pass (only warnings)
    ok = true;
  }

  return { ok, findings };
}

// Command line interface
if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: lint.js <file>');
    process.exit(2);
  }

  const res = lintPromptFile(path.resolve(file));

  // Format findings for output with severity prefixes
  const formattedFindings = res.findings.map(f => {
    const prefix = f.severity === 'error' ? '[ERROR] ' : '[WARN] ';
    return prefix + f.message;
  });

  if (!res.ok) {
    console.error(`[prompt:lint] FAIL ${file}:\n - ${formattedFindings.join('\n - ')}`);
    process.exit(1);
  } else {
    // In warn mode, we might have warnings but still pass
    const hasWarnings = res.findings.some(f => f.severity === 'warn');
    const status = hasWarnings ? 'PASS (with warnings)' : 'PASS';
    console.log(`[prompt:lint] ${status} ${file}${formattedFindings.length ? '\n - ' + formattedFindings.join('\n - ') : ''}`);
  }
}

module.exports = {
  lintPromptFile,
  extractFrontmatter,
  validateFilenamePattern,
  validateRequiredFields,
  validateRecommendedFields,
  validateTitle,
  validateFrontmatterPresence,
  validateFilenameAndKind,
  validateMatrixIds,
  validateThread
};
