import { ReactNode } from "react";
import { CompactPanel } from "./CompactPanel";
import { formatInr } from "../data/dashboard-metrics";
import { SEMESTER_SUMMARY, type SemesterSummaryRow } from "../data/semester-breakdown";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "./FeesTable";

export type SemesterBreakdownVariant =
  | "collections"
  | "challans"
  | "transactions"
  | "structures"
  | "receipts"
  | "enrollment";

type ColumnDef = {
  id: string;
  header: string;
  cell: (row: SemesterSummaryRow) => ReactNode;
  total: () => ReactNode;
  align?: "right";
};

function sum(rows: SemesterSummaryRow[], pick: (r: SemesterSummaryRow) => number) {
  return rows.reduce((s, r) => s + pick(r), 0);
}

const ROWS = SEMESTER_SUMMARY;

const VARIANT_COLUMNS: Record<SemesterBreakdownVariant, ColumnDef[]> = {
  enrollment: [
    {
      id: "receivable",
      header: "Receivable",
      align: "right",
      cell: (r) => formatInr(r.receivable),
      total: () => formatInr(sum(ROWS, (r) => r.receivable)),
    },
    {
      id: "collected",
      header: "Collected",
      align: "right",
      cell: (r) => formatInr(r.collected),
      total: () => formatInr(sum(ROWS, (r) => r.collected)),
    },
    {
      id: "pending",
      header: "Pending",
      align: "right",
      cell: (r) => (r.pending > 0 ? formatInr(r.pending) : "—"),
      total: () => formatInr(sum(ROWS, (r) => r.pending)),
    },
    {
      id: "eligible",
      header: "Eligible",
      align: "right",
      cell: (r) => r.eligibleStudents.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.eligibleStudents).toLocaleString("en-IN"),
    },
    {
      id: "challansGen",
      header: "Challans gen.",
      align: "right",
      cell: (r) => r.challansGenerated.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.challansGenerated).toLocaleString("en-IN"),
    },
    {
      id: "challanPending",
      header: "Challan pending",
      align: "right",
      cell: (r) => r.challanPending.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.challanPending).toLocaleString("en-IN"),
    },
  ],
  collections: [
    {
      id: "receivable",
      header: "Receivable",
      align: "right",
      cell: (r) => formatInr(r.receivable),
      total: () => formatInr(sum(ROWS, (r) => r.receivable)),
    },
    {
      id: "collected",
      header: "Collected",
      align: "right",
      cell: (r) => formatInr(r.collected),
      total: () => formatInr(sum(ROWS, (r) => r.collected)),
    },
    {
      id: "pending",
      header: "Pending",
      align: "right",
      cell: (r) => formatInr(r.pending),
      total: () => formatInr(sum(ROWS, (r) => r.pending)),
    },
    {
      id: "pct",
      header: "Collection %",
      align: "right",
      cell: (r) => `${Math.round((r.collected / r.receivable) * 100)}%`,
      total: () => {
        const c = sum(ROWS, (r) => r.collected);
        const d = sum(ROWS, (r) => r.receivable);
        return `${Math.round((c / d) * 100)}%`;
      },
    },
  ],
  challans: [
    {
      id: "challansGen",
      header: "Generated",
      align: "right",
      cell: (r) => r.challansGenerated.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.challansGenerated).toLocaleString("en-IN"),
    },
    {
      id: "challanPending",
      header: "Not generated",
      align: "right",
      cell: (r) => r.challanPending.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.challanPending).toLocaleString("en-IN"),
    },
    {
      id: "eligible",
      header: "Eligible students",
      align: "right",
      cell: (r) => r.eligibleStudents.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.eligibleStudents).toLocaleString("en-IN"),
    },
  ],
  transactions: [
    {
      id: "txns",
      header: "Transactions",
      align: "right",
      cell: (r) => r.transactionsCount.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.transactionsCount).toLocaleString("en-IN"),
    },
    {
      id: "online",
      header: "Online",
      align: "right",
      cell: (r) => formatInr(r.onlineCollected),
      total: () => formatInr(sum(ROWS, (r) => r.onlineCollected)),
    },
    {
      id: "offline",
      header: "Cash + cheque",
      align: "right",
      cell: (r) => formatInr(r.cashCollected + r.chequeCollected),
      total: () => formatInr(sum(ROWS, (r) => r.cashCollected + r.chequeCollected)),
    },
  ],
  structures: [
    {
      id: "structures",
      header: "Structures",
      align: "right",
      cell: (r) => r.structuresCount.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.structuresCount).toLocaleString("en-IN"),
    },
    {
      id: "receivable",
      header: "Receivable",
      align: "right",
      cell: (r) => formatInr(r.receivable),
      total: () => formatInr(sum(ROWS, (r) => r.receivable)),
    },
    {
      id: "collected",
      header: "Collected",
      align: "right",
      cell: (r) => formatInr(r.collected),
      total: () => formatInr(sum(ROWS, (r) => r.collected)),
    },
  ],
  receipts: [
    {
      id: "receipts",
      header: "Receipts",
      align: "right",
      cell: (r) => r.receiptsIssued.toLocaleString("en-IN"),
      total: () => sum(ROWS, (r) => r.receiptsIssued).toLocaleString("en-IN"),
    },
    {
      id: "collected",
      header: "Collected",
      align: "right",
      cell: (r) => formatInr(r.collected),
      total: () => formatInr(sum(ROWS, (r) => r.collected)),
    },
    {
      id: "pending",
      header: "Pending",
      align: "right",
      cell: (r) => formatInr(r.pending),
      total: () => formatInr(sum(ROWS, (r) => r.pending)),
    },
  ],
};

const VARIANT_TITLES: Record<SemesterBreakdownVariant, string> = {
  enrollment: "Semester-wise · enrollment & fees",
  collections: "Semester-wise · collections",
  challans: "Semester-wise · challans",
  transactions: "Semester-wise · transactions",
  structures: "Semester-wise · fee structures",
  receipts: "Semester-wise · receipts",
};

type SemesterBreakdownPanelProps = {
  variant: SemesterBreakdownVariant;
};

export function SemesterBreakdownPanel({ variant }: SemesterBreakdownPanelProps) {
  const columns = VARIANT_COLUMNS[variant];

  return (
    <CompactPanel title={VARIANT_TITLES[variant]} noPadding>
      <FeesTable>
        <FeesTableHeader>
          <FeesTableHead className="w-[14%]">Semester</FeesTableHead>
          {columns.map((col) => (
            <FeesTableHead
              key={col.id}
              className={col.align === "right" ? "text-right" : undefined}
            >
              {col.header}
            </FeesTableHead>
          ))}
        </FeesTableHeader>
        <FeesTableBody>
          {ROWS.map((row) => (
            <FeesTableRow key={row.semester}>
              <FeesTableCell className="font-semibold">{row.semester}</FeesTableCell>
              {columns.map((col) => (
                <FeesTableCell
                  key={col.id}
                  className={col.align === "right" ? "text-right tabular-nums" : undefined}
                >
                  {col.cell(row)}
                </FeesTableCell>
              ))}
            </FeesTableRow>
          ))}
          <FeesTableRow highlight>
            <FeesTableCell className="font-semibold">Total</FeesTableCell>
            {columns.map((col) => (
              <FeesTableCell
                key={col.id}
                className={
                  col.align === "right" ? "text-right font-semibold tabular-nums" : "font-semibold"
                }
              >
                {col.total()}
              </FeesTableCell>
            ))}
          </FeesTableRow>
        </FeesTableBody>
      </FeesTable>
    </CompactPanel>
  );
}
