function normalizeRomanNumerals(text: string): string {
  return text.replace(/\b([ivxlcdm]+)\b/gi, (m) => m.toUpperCase());
}

/** Title/sentence-case a string, keeping roman numerals (I, II, IV…) uppercase.
 * e.g. "SEMESTER II" -> "Semester II". */
export function toSentenceCase(text: string): string {
  if (!text) return text;
  const capitalized = text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return normalizeRomanNumerals(capitalized);
}
