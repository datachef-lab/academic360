/** Display / sort order for career progression certificate sections (student console). */

export function sectionPriority(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("work experience") && n.includes("internship")) return 0;
  if (n.includes("internship")) return 0;
  if (n.includes("work experience")) return 1;
  if (n.includes("skills") || n.includes("certification")) return 2;
  if (n.includes("competitive exam") || n.includes("professional")) return 3;
  return 10;
}

export function sortCpCertificateMasters<T extends { name: string; sequence?: number }>(
  masters: T[],
): T[] {
  return masters.slice().sort((a, b) => {
    const priorityDiff = sectionPriority(a.name) - sectionPriority(b.name);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.sequence ?? 0) - (b.sequence ?? 0);
  });
}

/** Internship / work sections: Add Row below the question block instead of the header. */
export function usesInternshipWorkRowLayout(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n === "internship" ||
    n === "work experience" ||
    (n.includes("work experience") && n.includes("internship"))
  );
}

/** Put the "Type" column first wherever that field exists (display only; save payload unchanged). */
export function orderTableFieldsTypeFirst<T extends { name: string; sequence: number }>(
  fields: T[],
): T[] {
  const sorted = fields.slice().sort((a, b) => a.sequence - b.sequence);
  const typeIdx = sorted.findIndex((f) => f.name.trim().toLowerCase() === "type");
  if (typeIdx <= 0) return sorted;
  const typeField = sorted[typeIdx]!;
  const rest = sorted.filter((_, i) => i !== typeIdx);
  return [typeField, ...rest];
}
