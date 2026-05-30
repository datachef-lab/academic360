const ROMAN_FROM_DIGIT: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
};

function digitToRoman(value: number): string {
  if (ROMAN_FROM_DIGIT[value]) return ROMAN_FROM_DIGIT[value];
  return String(value);
}

export type ParsedSemesterClassName = {
  label: string;
  numeral: string | null;
};

/** "SEMESTER II" → { label: "Semester", numeral: "II" } */
export function parseSemesterClassName(name: string): ParsedSemesterClassName {
  const trimmed = name.trim();
  if (!trimmed) return { label: "Semester", numeral: null };

  const explicit = trimmed.match(/^semester\s*([IVXLCDM]+|\d+)\s*$/i);
  if (explicit) {
    const token = explicit[1].toUpperCase();
    return {
      label: "Semester",
      numeral: /^\d+$/.test(token) ? digitToRoman(Number(token)) : token,
    };
  }

  const abbreviated = trimmed.match(/^sem\.?\s*([IVXLCDM]+|\d+)\s*$/i);
  if (abbreviated) {
    const token = abbreviated[1].toUpperCase();
    return {
      label: "Semester",
      numeral: /^\d+$/.test(token) ? digitToRoman(Number(token)) : token,
    };
  }

  const trailingRoman = trimmed.match(/^(.+?)\s+([IVXLCDM]+)$/i);
  if (trailingRoman) {
    const prefix = trailingRoman[1].trim();
    const word = prefix.replace(/\s+/g, " ");
    const label =
      word.toLowerCase() === "semester"
        ? "Semester"
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    return { label, numeral: trailingRoman[2].toUpperCase() };
  }

  return { label: trimmed, numeral: null };
}

export function formatSemesterClassOptionLabel(name: string): string {
  const parsed = parseSemesterClassName(name);
  return parsed.numeral ? `${parsed.label} ${parsed.numeral}` : parsed.label;
}
