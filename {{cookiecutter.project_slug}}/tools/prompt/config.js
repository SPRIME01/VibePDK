/**
 * Configuration loader for prompt linter
 * Supports multiple configuration sources with precedence:
 * 1. Environment variables (highest priority)
 * 2. .promptlintrc file (JSON or YAML)
 * 3. Default values (lowest priority)
 */
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

/** Default configuration values */
const DEFAULT_CONFIG = {
  gating: 'error',
  // Future configuration options can be added here
};

/**
 * Schema for configuration validation
 */
const CONFIG_SCHEMA = {
  gating: {
    type: 'string',
    enum: ['warn', 'error'],
    default: 'error'
  }
  // Future schema definitions can be added here
};

/**
 * Validates configuration object against schema
 * @param {Object} config - Configuration object to validate
 * @returns {Object} Validated configuration with defaults applied
 */
function validateConfig(config) {
  const validated = { ...DEFAULT_CONFIG };

  // Validate gating level
  if (config.gating !== undefined) {
    if (typeof config.gating !== 'string') {
      console.warn(`Invalid gating configuration: must be string, got ${typeof config.gating}. Using default.`);
    } else if (!CONFIG_SCHEMA.gating.enum.includes(config.gating.toLowerCase())) {
      console.warn(`Invalid gating value: "${config.gating}". Must be one of: ${CONFIG_SCHEMA.gating.enum.join(', ')}. Using default.`);
    } else {
      validated.gating = config.gating.toLowerCase();
    }
  }

  // Future validation for other config options

  return validated;
}

/**
 * Finds and loads .promptlintrc file from current directory or parent directories
 * @returns {Object|null} Configuration object from rc file, or null if not found
 */
function loadRcFile() {
  let currentDir = process.cwd();
  const rootDir = path.parse(currentDir).root;

  while (currentDir !== rootDir) {
    const rcFiles = [
      path.join(currentDir, '.promptlintrc'),
      path.join(currentDir, '.promptlintrc.json'),
      path.join(currentDir, '.promptlintrc.yaml'),
      path.join(currentDir, '.promptlintrc.yml')
    ];

    for (const rcFile of rcFiles) {
      if (fs.existsSync(rcFile)) {
        try {
          const content = fs.readFileSync(rcFile, 'utf8');
          let config;

          if (rcFile.endsWith('.json')) {
            config = JSON.parse(content);
          } else {
            // Assume YAML for .yaml, .yml, or no extension
            config = yaml.load(content);
          }

          console.log(`Loaded configuration from: ${rcFile}`);
          return validateConfig(config);
        } catch (error) {
          console.warn(`Error parsing configuration file ${rcFile}: ${error.message}`);
          return null;
        }
      }
    }

    // Move up to parent directory
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Loads configuration from environment variables
 * @returns {Object} Configuration from environment variables
 */
function loadEnvConfig() {
  const config = {};

  if (process.env.PROMPT_LINT_GATING) {
    config.gating = process.env.PROMPT_LINT_GATING;
  }

  // Future environment variable support can be added here

  return validateConfig(config);
}

/**
 * Main configuration loader function
 * @returns {Object} Final configuration with proper precedence
 */
function loadConfig() {
  // 1. Load from environment variables (highest priority)
  const envConfig = loadEnvConfig();

  // If environment variables are set (even if they match defaults), use them
  if (process.env.PROMPT_LINT_GATING !== undefined) {
    return envConfig;
  }

  // 2. Load from rc file (medium priority)
  const rcConfig = loadRcFile();
  if (rcConfig) {
    return rcConfig;
  }

  // 3. Use defaults (lowest priority)
  return DEFAULT_CONFIG;
}

module.exports = {
  loadConfig,
  validateConfig,
  DEFAULT_CONFIG,
  CONFIG_SCHEMA
};
