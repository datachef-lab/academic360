import XLSX from "xlsx";

export interface ReadBulkExcelSheetResult {
  sheetName: string;
  /** First row of the sheet is treated as headers (sheet_to_json default). */
  rows: Record<string, unknown>[];
  /** Keys from the first data row (header names as in Excel). */
  headerKeys: string[];
}

/**
 * Reads one worksheet as an array of row objects (header row → keys).
 */
export function readBulkExcelSheet(
  filePath: string,
  options?: { sheetIndex?: number },
): ReadBulkExcelSheetResult {
  const sheetIndex = options?.sheetIndex ?? 0;
  const workbook = XLSX.readFile(filePath);
  if (!workbook.SheetNames.length) {
    throw new Error("Excel workbook has no sheets");
  }
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) {
    throw new Error(`Excel workbook has no sheet at index ${sheetIndex}`);
  }
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error("Failed to read worksheet from Excel file");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });
  if (rows.length === 0) {
    throw new Error("Excel sheet has no data rows");
  }

  const headerKeys = Object.keys(rows[0] ?? {});
  return { sheetName, rows, headerKeys };
}

/**
 * Ensures every required column name exists in the sheet headers (exact string match).
 */
export function validateBulkExcelRequiredColumns(
  headerKeys: string[],
  requiredColumns: readonly string[],
): void {
  const missing = requiredColumns.filter((c) => !headerKeys.includes(c));
  if (missing.length > 0) {
    throw new Error(
      `Missing required column(s): ${missing.join(", ")}. Found: ${headerKeys.join(", ")}`,
    );
  }
}

/**
 * Drops rows where `isRowEmpty` returns true (e.g. all required fields blank).
 */
export function filterNonEmptyBulkRows<T>(
  rows: Record<string, unknown>[],
  mapRow: (row: Record<string, unknown>) => T,
  isRowEmpty: (mapped: T) => boolean,
): T[] {
  const out: T[] = [];
  for (const row of rows) {
    const mapped = mapRow(row);
    if (!isRowEmpty(mapped)) {
      out.push(mapped);
    }
  }
  if (out.length === 0) {
    throw new Error("Excel sheet has no non-empty data rows");
  }
  return out;
}

/**
 * Read first sheet → validate required headers → map each row → drop empty rows.
 * Use this from bulk upload handlers so column rules stay in one place per template.
 */
export function parseBulkExcelWithRequiredColumns<T>(
  filePath: string,
  requiredColumns: readonly string[],
  mapRow: (row: Record<string, unknown>) => T,
  isRowEmpty: (mapped: T) => boolean,
  options?: { sheetIndex?: number },
): T[] {
  const { rows, headerKeys } = readBulkExcelSheet(filePath, options);
  validateBulkExcelRequiredColumns(headerKeys, requiredColumns);
  return filterNonEmptyBulkRows(rows, mapRow, isRowEmpty);
}
