/**
 * Thin ExcelJS wrapper every library-report export goes through. Applies the
 * shared `applyStandardExcelReportTableStyling` (grey header row, thin
 * borders, frozen row 1) so every workbook the user downloads looks the same
 * as the entry/exit export they already know.
 *
 * Extras this wrapper layers on top:
 *  - `intro` — plain-English "How to read this sheet" lines rendered ABOVE
 *    the header row (row 1..N are intro, N+1 is blank, N+2 is header). Kept
 *    ABOVE the header so the intro doesn't disrupt the sticky-header + data
 *    alignment that the standard styling expects.
 *  - `totals` — bold totals row appended after data with a distinct fill so
 *    the eye immediately lands on it at the bottom.
 *  - `moneyKeys` — a list of column keys whose cells hold currency values;
 *    they get a soft green fill so a librarian can eyeball "which columns
 *    are amounts" at a glance.
 */

import ExcelJS from "exceljs";
import {
  applyStandardExcelReportTableStyling,
  autosizeExcelSheetColumns,
  EXCEL_REPORT_BODY_BORDER_COLOR_ARGB,
} from "@/utils/excel-report-styling.js";

/** Soft mint fill for currency cells so amount columns stand out. */
const MONEY_CELL_FILL_ARGB = "FFE7F5EC";
/** Slightly darker mint for the totals row so it reads as a summary. */
const TOTALS_ROW_FILL_ARGB = "FFCDECD5";

export type WorkbookSheet = {
  name: string;
  columns: Array<{ header: string; key: string; width?: number }>;
  rows: Array<Record<string, unknown>>;
  intro?: string[];
  totals?: Record<string, unknown>;
  /**
   * Column `key`s that hold monetary values. Cells in these columns get a
   * soft green fill so an amount column is visually distinct from a count
   * column at a glance.
   */
  moneyKeys?: string[];
};

export async function buildStandardWorkbook(
  sheets: WorkbookSheet[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const s of sheets) {
    const sheet = workbook.addWorksheet(s.name.slice(0, 31));

    // 1. Header row via sheet.columns — this writes row 1 as the header
    //    and binds `key`s so keyed addRow(...) lands in the right columns.
    sheet.columns = s.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 16,
    }));

    // 2. Data rows come next.
    for (const row of s.rows) sheet.addRow(row);

    // 3. Totals row (bold, distinct fill, top border) appended after data.
    let totalsRowNumber: number | null = null;
    if (s.totals) {
      const totalsRow = sheet.addRow(s.totals);
      totalsRowNumber = totalsRow.number;
      totalsRow.font = { bold: true };
      totalsRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: TOTALS_ROW_FILL_ARGB },
      };
      totalsRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          ...(cell.border ?? {}),
          top: { style: "medium" },
        };
      });
    }

    // 4. Standard styling on the header + body borders. Freezes row 1.
    applyStandardExcelReportTableStyling(sheet);

    // 5. Green fill for money columns (excluding header row 1 and the
    //    totals row, which have their own fills). Applied AFTER the
    //    standard styling so it overwrites the default white body fill.
    if (s.moneyKeys && s.moneyKeys.length > 0) {
      const moneyColIndexes: number[] = [];
      s.moneyKeys.forEach((k) => {
        const idx = s.columns.findIndex((c) => c.key === k);
        if (idx >= 0) moneyColIndexes.push(idx + 1); // ExcelJS is 1-indexed.
      });
      const lastRow = sheet.rowCount;
      for (let r = 2; r <= lastRow; r++) {
        if (r === totalsRowNumber) continue; // totals row keeps its own fill
        for (const c of moneyColIndexes) {
          const cell = sheet.getRow(r).getCell(c);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: MONEY_CELL_FILL_ARGB },
          };
        }
      }
    }

    // 6. Intro rows — inserted at the top after everything else is laid
    //    out so row 1 stays the header for the standard-styling pass. Each
    //    intro line goes into column A only (not merged — merging cells
    //    that were previously part of another merge crashes ExcelJS with
    //    "Cannot merge range already merged cells"). Excel renders long
    //    text in A1 across visually-adjacent empty cells anyway, so the
    //    result reads exactly like a merged banner without the fragility.
    if (s.intro && s.intro.length > 0) {
      // `spliceRows(startRow, deleteCount, ...newRowValues)` inserts an
      // array of rows in one shot — cleaner than repeated insertRow(1)
      // with its shift/re-shift semantics.
      const introRowValues = s.intro.map((line) => [line]);
      // Add a trailing blank row as a visual gap between intro and header.
      sheet.spliceRows(1, 0, ...introRowValues, []);
      for (let r = 1; r <= s.intro.length; r++) {
        const row = sheet.getRow(r);
        row.font = { italic: true, color: { argb: "FF334155" } };
        row.alignment = { wrapText: true, vertical: "middle" };
        row.getCell(1).border = {
          bottom: {
            style: "hair",
            color: { argb: EXCEL_REPORT_BODY_BORDER_COLOR_ARGB },
          },
        };
      }
      // Re-freeze so the frozen split lines up with the header, which is
      // now at row `intro.length + 2` (intro + blank spacer + header).
      sheet.views = [{ state: "frozen", ySplit: s.intro.length + 2 }];
    }

    // 7. Autosize AFTER all rows exist so widths reflect real content.
    autosizeExcelSheetColumns(sheet, s.columns.length, {
      minWidth: 18,
      maxWidth: 60,
    });
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
