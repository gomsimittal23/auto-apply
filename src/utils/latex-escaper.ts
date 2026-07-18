/**
 * Safely escapes special LaTeX characters in a string to prevent compilation errors.
 */
export function escapeLatex(text: string): string {
  if (!text) return "";

  // The order of replacements is critical!
  // We must replace backslash first so we don't escape backslashes introduced by other replacements.
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}
export default escapeLatex;
