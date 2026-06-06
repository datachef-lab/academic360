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

export function streamSemesterLabels(
  segment: FeeMisStreamSegment,
  filterLabels?: string[],
): string[] {
  if (filterLabels?.length) {
    return [...filterLabels];
  }
  const labels = new Set<string>();
  for (const row of segment.detailRows) {
    const label = row.semesterLabel?.trim();
    if (label) labels.add(label);
  }
  const totalLabel = segment.totalRow.semesterLabel?.trim();
  if (totalLabel) labels.add(totalLabel);
  return [...labels].sort((a, b) => a.localeCompare(b));
}

/** Split block height evenly between AMT and NOS (differs by at most one row). */
export function streamFeeRowSpans(programCount: number): {
  blockRows: number;
  amtRowSpan: number;
  nosRowSpan: number;
} {
  const blockRows = programCount > 0 ? programCount + 1 : 2;
  const amtRowSpan = Math.floor(blockRows / 2);
  const nosRowSpan = blockRows - amtRowSpan;
  return { blockRows, amtRowSpan, nosRowSpan };
}
