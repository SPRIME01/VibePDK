const fs = require('fs');
const path = require('path');

/**
 * Detects legacy files in .github/{prompts,chatmodes,instructions} directories
 * that don't match the pattern <domain>.<task>[.<phase>].<kind>.md
 * and proposes corrected names by converting hyphens to dots.
 *
 * @returns {Object} Mapping of current file paths to proposed new paths
 */
function detectLegacyFiles() {
  const directories = [
    '.github/prompts',
    '.github/chatmodes',
    '.github/instructions'
  ];

  const legacyFiles = {};

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      return;
    }

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const newName = proposeCorrectName(file);
        if (newName !== file) {
          legacyFiles[filePath] = path.join(dir, newName);
        }
      }
    });
  });

  return legacyFiles;
}

/**
 * Proposes a corrected filename by converting hyphens to dots
 * and ensuring the pattern <domain>.<task>[.<phase>].<kind>.md
 *
 * @param {string} filename - The original filename
 * @returns {string} The proposed corrected filename
 */
function proposeCorrectName(filename) {
  // Check if the file is one of the supported kinds
  const kindMatch = filename.match(/\.(prompt|chatmode|instructions)\.md$/);
  if (!kindMatch) {
    return filename; // Not a file we care about
  }

  const kind = kindMatch[1];
  // Find the position of the kind suffix including the dot
  const suffix = `.${kind}.md`;
  const suffixIndex = filename.lastIndexOf(suffix);
  if (suffixIndex === -1) {
    return filename; // Should not happen since we matched with regex
  }

  const prefix = filename.slice(0, suffixIndex); // Get everything before the suffix

  // Count the number of dots in the prefix
  const dotCount = (prefix.match(/\./g) || []).length;

  // If the prefix contains hyphens and has fewer than 2 dots, it's likely legacy
  if (prefix.includes('-') && dotCount < 2) {
    // Replace all hyphens with dots
    let correctedPrefix = prefix.replace(/-/g, '.');

    // Ensure we have at least one dot (domain.task) in the prefix
    if (!correctedPrefix.includes('.')) {
      // If no dots after replacement, it's invalid but we'll return as is
      return filename;
    }

    return `${correctedPrefix}${suffix}`;
  }

  // Check if the prefix matches the expected pattern (alphanumeric with dots only)
  const patternMatch = prefix.match(/^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/);
  if (!patternMatch) {
    // If it doesn't match the pattern, but has no hyphens or too many dots, it might be other issues
    // For now, we only handle hyphen conversion for files with fewer than 2 dots
    return filename;
  }

  return filename;
}

module.exports = {
  detectLegacyFiles,
  proposeCorrectName
};
