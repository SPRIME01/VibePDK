/**
 * Type definitions for matrix.js module
 */

/**
 * Matrix row interface
 */
interface MatrixRow {
  id: string;
  artifacts: string[];
  status: string;
  notes: string;
}

/**
 * Builds a traceability matrix from markdown files in docs directory
 * @param rootDir - Root directory of the project
 * @returns Array of matrix rows
 */
declare function buildMatrix(rootDir: string): MatrixRow[];

/**
 * Renders matrix rows as a markdown table
 * @param rows - Matrix rows
 * @returns Markdown table string
 */
declare function renderMatrixTable(rows: MatrixRow[]): string;

/**
 * Updates the traceability matrix file
 * @param rootDir - Root directory of the project
 * @returns Result with file path and row count
 */
declare function updateMatrixFile(rootDir: string): { file: string; count: number };

export { buildMatrix, renderMatrixTable, updateMatrixFile, MatrixRow };
