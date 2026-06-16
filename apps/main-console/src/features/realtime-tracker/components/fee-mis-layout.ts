import type { FeeMisCourseRow } from "../types/realtime-tracker-types";

export type FeeMisStreamSegment = {
  id: string;
  detailRows: FeeMisCourseRow[];
  totalRow: FeeMisCourseRow;
};

export type FeeMisSummaryRow = {
  course: FeeMisCourseRow;
};

/** Stream block (courses + TOTAL) or trailing UG / grand total rows. */
export type FeeMisTableBlock =
  | { kind: "stream"; segment: FeeMisStreamSegment }
  | { kind: "summary"; summary: FeeMisSummaryRow };

export function buildFeeMisTableBlocks(rows: FeeMisCourseRow[]): FeeMisTableBlock[] {
  const blocks: FeeMisTableBlock[] = [];
  let pendingDetails: FeeMisCourseRow[] = [];

  for (const row of rows) {
    const isStreamTotal = row.isSubtotal && row.courseName === "TOTAL" && !row.isGrandTotal;
    if (isStreamTotal) {
      blocks.push({
        kind: "stream",
        segment: {
          id: row.groupKey,
          detailRows: pendingDetails,
          totalRow: row,
        },
      });
      pendingDetails = [];
      continue;
    }

    if (row.isSubtotal || row.isGrandTotal) {
      blocks.push({ kind: "summary", summary: { course: row } });
      continue;
    }

    pendingDetails.push(row);
  }

  return blocks;
}
