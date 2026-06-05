/** Display / sort order for career progression certificate sections (student console). */

export const DEFAULT_FIELD_FONT_SIZE = 16;
export const DEFAULT_DESCRIPTION_FONT_SIZE = 14;

export type CpCertificateFieldDisplay = {
  name: string;
  description?: string | null;
  fieldFontSize?: number | null;
  descriptionFontSize?: number | null;
  isRequired?: boolean;
};

function clampFontSize(value: number | null | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.min(72, Math.max(8, Math.round(value)));
}

export function resolveFieldFontSize(value?: number | null): number {
  return clampFontSize(value, DEFAULT_FIELD_FONT_SIZE);
}

export function resolveDescriptionFontSize(value?: number | null): number {
  return clampFontSize(value, DEFAULT_DESCRIPTION_FONT_SIZE);
}

type CpActiveFlagRow = {
  isActive?: boolean | null;
  is_active?: boolean | null;
};

type CpTemplateFieldRow = CpActiveFlagRow & {
  name: string;
  options?: CpActiveFlagRow[];
};

type CpTemplateMasterRow = CpActiveFlagRow & {
  fields: CpTemplateFieldRow[];
};

function isCpMasterRowActive(row: CpActiveFlagRow): boolean {
  const flag = row.isActive ?? row.is_active;
  return flag !== false;
}

/** Keep only active certificate masters, fields, and select options. */
export function filterActiveCpTemplateMasters<T>(masters: T[]): T[] {
  return masters
    .filter((cm) => isCpMasterRowActive(cm as CpActiveFlagRow))
    .map((cm) => {
      const row = cm as T & CpTemplateMasterRow;
      return {
        ...row,
        fields: row.fields
          .filter((f) => isCpMasterRowActive(f))
          .map((f) => ({
            ...f,
            options: (f.options ?? []).filter((o) => isCpMasterRowActive(o)),
          })),
      } as T;
    })
    .filter((cm) => (cm as CpTemplateMasterRow).fields.length > 0);
}

/** Normalize API field rows (camelCase or snake_case) for display. */
export function normalizeCpTemplateMasters<T>(masters: T[]): T[] {
  const normalized = masters.map((cm) => {
    const row = cm as T & CpTemplateMasterRow;
    return {
      ...row,
      fields: row.fields.map((f) => normalizeCpFieldForDisplay(f)),
    } as T;
  });
  return filterActiveCpTemplateMasters(normalized);
}

export function normalizeCpFieldForDisplay<T extends { name: string }>(
  field: T,
): T & CpCertificateFieldDisplay {
  const raw = field as T & Record<string, unknown>;
  const fieldFontSize = raw.fieldFontSize ?? raw.field_font_size;
  const descriptionFontSize = raw.descriptionFontSize ?? raw.description_font_size;
  const description = raw.description;

  return {
    ...field,
    fieldFontSize: typeof fieldFontSize === "number" ? fieldFontSize : null,
    descriptionFontSize: typeof descriptionFontSize === "number" ? descriptionFontSize : null,
    description:
      typeof description === "string"
        ? description
        : description == null
          ? null
          : String(description),
  };
}

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
