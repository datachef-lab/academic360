import type { Row, Worksheet } from "exceljs";

/** Standard grey header fill used across admin Excel exports */
export const EXCEL_REPORT_HEADER_FILL_ARGB = "FFD3D3D3";
export const EXCEL_REPORT_BODY_BORDER_COLOR_ARGB = "FFD3D3D3";

/**
 * Shared (frozen, reused) border objects for streaming exports. ExcelJS's
 * style manager hashes/dedupes style objects into the workbook's shared
 * style table — the same object reference can safely be assigned to every
 * cell instead of allocating a fresh `{ top: {...}, left: {...}, ... }`
 * literal per cell, which is what made `applyStandardExcelReportTableStyling`
 * O(rows*cols) in allocations on huge sheets. Mirrors the
 * `EXCEL_THIN_BORDER` pattern already used in
 * `fees/services/fee-structure.service.ts`.
 */
export const EXCEL_REPORT_HEADER_THIN_BORDER = Object.freeze({
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  bottom: { style: "thin" as const },
  right: { style: "thin" as const },
});

export const EXCEL_REPORT_BODY_THIN_BORDER = Object.freeze({
  top: {
    style: "thin" as const,
    color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
  },
  left: {
    style: "thin" as const,
    color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
  },
  bottom: {
    style: "thin" as const,
    color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
  },
  right: {
    style: "thin" as const,
    color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
  },
});

/**
 * Row-by-row equivalent of the header block in
 * `applyStandardExcelReportTableStyling` — for use with
 * `ExcelJS.stream.xlsx.WorkbookWriter`, where rows are committed (and can no
 * longer be revisited) as soon as they're written, so the whole-sheet
 * `eachRow` pass that function does is not available. Call once on row 1.
 */
export function styleStreamedHeaderRow(row: Row): void {
  row.font = { bold: true, size: 12 };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_REPORT_HEADER_FILL_ARGB },
  };
  row.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
  };
  row.height = 20;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = EXCEL_REPORT_HEADER_THIN_BORDER;
  });
}

/**
 * Row-by-row equivalent of the body-border block in
 * `applyStandardExcelReportTableStyling`. Call on every data row (row number
 * > 1) as it's added, before `row.commit()`.
 */
export function styleStreamedBodyRow(row: Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = EXCEL_REPORT_BODY_THIN_BORDER;
  });
}

/**
 * Grey header row, full grid borders, frozen header — matches student/promotion/subject exports.
 * Call after all rows are added. No-op if the sheet has no rows.
 */
export function applyStandardExcelReportTableStyling(sheet: Worksheet): void {
  if (sheet.rowCount < 1) return;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_REPORT_HEADER_FILL_ARGB },
  };
  headerRow.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
  };
  headerRow.height = 20;
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: {
            style: "thin",
            color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
          },
          left: {
            style: "thin",
            color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
          },
          bottom: {
            style: "thin",
            color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
          },
          right: {
            style: "thin",
            color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
          },
        };
      });
    }
  });

  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

/**
 * Header row + freeze only. Use for very large sheets where per-cell body borders are too slow.
 */
export function applyReportHeaderAndFreezeOnly(sheet: Worksheet): void {
  if (sheet.rowCount < 1) return;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_REPORT_HEADER_FILL_ARGB },
  };
  headerRow.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
  };
  headerRow.height = 20;
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function approximateCellTextLength(val: unknown): number {
  if (val == null) return 0;
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return String(val).length;
  }
  if (val instanceof Date) return val.toISOString().length;
  return 0;
}

/**
 * Set column widths from current cell text lengths (simple heuristic).
 */
export function autosizeExcelSheetColumns(
  sheet: Worksheet,
  columnCount: number,
  options?: { minWidth?: number; maxWidth?: number },
): void {
  const minW = options?.minWidth ?? 10;
  const maxW = options?.maxWidth ?? 55;
  for (let c = 1; c <= columnCount; c++) {
    let maxLen = minW;
    for (let r = 1; r <= sheet.rowCount; r++) {
      const val = sheet.getRow(r).getCell(c).value;
      const len = approximateCellTextLength(val);
      maxLen = Math.max(maxLen, Math.min(len + 2, maxW));
    }
    sheet.getColumn(c).width = maxLen;
  }
}
