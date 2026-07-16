import { ReactNode, useMemo } from "react";
import { CompactPanel } from "./CompactPanel";
import { SemesterClassLabel } from "./SemesterClassLabel";
import { formatInr } from "../data/dashboard-metrics";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import type { SemesterBreakdownRow } from "../types/dashboard-api";
import { DashboardEmptyState } from "./DashboardEmptyState";
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

type SemesterRow = SemesterBreakdownRow;

type ColumnDef = {
  id: string;
  header: string;
  cell: (row: SemesterRow) => ReactNode;
  total: (rows: SemesterRow[]) => ReactNode;
  align?: "right";
};

function sum(rows: SemesterRow[], pick: (r: SemesterRow) => number) {
  return rows.reduce((s, r) => s + pick(r), 0);
}

function buildColumns(): Record<SemesterBreakdownVariant, ColumnDef[]> {
  return {
    enrollment: [
      {
        id: "receivable",
        header: "Receivable",
        align: "right",
        cell: (r) => formatInr(r.receivable),
        total: (rs) => formatInr(sum(rs, (r) => r.receivable)),
      },
      {
        id: "collected",
        header: "Collected",
        align: "right",
        cell: (r) => formatInr(r.collected),
        total: (rs) => formatInr(sum(rs, (r) => r.collected)),
      },
      {
        id: "pending",
        header: "Pending",
        align: "right",
        cell: (r) => (r.pending > 0 ? formatInr(r.pending) : "—"),
        total: (rs) => formatInr(sum(rs, (r) => r.pending)),
      },
      {
        id: "eligible",
        header: "Eligible",
        align: "right",
        cell: (r) => r.eligibleStudents.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.eligibleStudents).toLocaleString("en-IN"),
      },
      {
        id: "challansGen",
        header: "Challans gen.",
        align: "right",
        cell: (r) => r.challansGenerated.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.challansGenerated).toLocaleString("en-IN"),
      },
      {
        id: "challanPending",
        header: "Challan pending",
        align: "right",
        cell: (r) => r.challanPending.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.challanPending).toLocaleString("en-IN"),
      },
    ],
    collections: [
      {
        id: "receivable",
        header: "Receivable",
        align: "right",
        cell: (r) => formatInr(r.receivable),
        total: (rs) => formatInr(sum(rs, (r) => r.receivable)),
      },
      {
        id: "collected",
        header: "Collected",
        align: "right",
        cell: (r) => formatInr(r.collected),
        total: (rs) => formatInr(sum(rs, (r) => r.collected)),
      },
      {
        id: "pending",
        header: "Pending",
        align: "right",
        cell: (r) => formatInr(r.pending),
        total: (rs) => formatInr(sum(rs, (r) => r.pending)),
      },
      {
        id: "pct",
        header: "Collection %",
        align: "right",
        cell: (r) =>
          r.receivable > 0 ? `${Math.round((r.collected / r.receivable) * 100)}%` : "—",
        total: (rs) => {
          const c = sum(rs, (r) => r.collected);
          const d = sum(rs, (r) => r.receivable);
          return d > 0 ? `${Math.round((c / d) * 100)}%` : "—";
        },
      },
    ],
    challans: [
      {
        id: "challansGen",
        header: "Generated",
        align: "right",
        cell: (r) => r.challansGenerated.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.challansGenerated).toLocaleString("en-IN"),
      },
      {
        id: "challanPending",
        header: "Not generated",
        align: "right",
        cell: (r) => r.challanPending.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.challanPending).toLocaleString("en-IN"),
      },
      {
        id: "challanOnly",
        header: "Challan only",
        align: "right",
        cell: (r) => r.challanOnly.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.challanOnly).toLocaleString("en-IN"),
      },
      {
        id: "eligible",
        header: "Eligible students",
        align: "right",
        cell: (r) => r.eligibleStudents.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.eligibleStudents).toLocaleString("en-IN"),
      },
    ],
    transactions: [
      {
        id: "txns",
        header: "Transactions",
        align: "right",
        cell: (r) => r.transactionsCount.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.transactionsCount).toLocaleString("en-IN"),
      },
      {
        id: "online",
        header: "Online",
        align: "right",
        cell: (r) => formatInr(r.onlineCollected),
        total: (rs) => formatInr(sum(rs, (r) => r.onlineCollected)),
      },
      {
        id: "offline",
        header: "Cash + cheque",
        align: "right",
        cell: (r) => formatInr(r.cashCollected + r.chequeCollected),
        total: (rs) => formatInr(sum(rs, (r) => r.cashCollected + r.chequeCollected)),
      },
    ],
    structures: [
      {
        id: "structures",
        header: "Structures",
        align: "right",
        cell: (r) => r.structuresCount.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.structuresCount).toLocaleString("en-IN"),
      },
      {
        id: "receivable",
        header: "Receivable",
        align: "right",
        cell: (r) => formatInr(r.receivable),
        total: (rs) => formatInr(sum(rs, (r) => r.receivable)),
      },
      {
        id: "collected",
        header: "Collected",
        align: "right",
        cell: (r) => formatInr(r.collected),
        total: (rs) => formatInr(sum(rs, (r) => r.collected)),
      },
    ],
    receipts: [
      {
        id: "receipts",
        header: "Receipts",
        align: "right",
        cell: (r) => r.receiptsIssued.toLocaleString("en-IN"),
        total: (rs) => sum(rs, (r) => r.receiptsIssued).toLocaleString("en-IN"),
      },
      {
        id: "collected",
        header: "Collected",
        align: "right",
        cell: (r) => formatInr(r.collected),
        total: (rs) => formatInr(sum(rs, (r) => r.collected)),
      },
      {
        id: "pending",
        header: "Pending",
        align: "right",
        cell: (r) => formatInr(r.pending),
        total: (rs) => formatInr(sum(rs, (r) => r.pending)),
      },
    ],
  };
}

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
  semesterNumeralOnly?: boolean;
};

export function SemesterBreakdownPanel({
  variant,
  semesterNumeralOnly = false,
}: SemesterBreakdownPanelProps) {
  const { dashboard, dashboardLoading } = useFeesDashboard();
  const rows = useMemo(() => dashboard?.semesterBreakdown ?? [], [dashboard?.semesterBreakdown]);
  const columns = buildColumns()[variant];

  return (
    <CompactPanel title={VARIANT_TITLES[variant]} noPadding>
      {rows.length === 0 && !dashboardLoading ? (
        <DashboardEmptyState />
      ) : (
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
            {rows.map((row) => (
              <FeesTableRow key={row.semester}>
                <FeesTableCell className="font-semibold">
                  <SemesterClassLabel name={row.semester} numeralOnly={semesterNumeralOnly} />
                </FeesTableCell>
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
            {rows.length > 0 && (
              <FeesTableRow highlight>
                <FeesTableCell className="font-semibold">Total</FeesTableCell>
                {columns.map((col) => (
                  <FeesTableCell
                    key={col.id}
                    className={
                      col.align === "right"
                        ? "text-right font-semibold tabular-nums"
                        : "font-semibold"
                    }
                  >
                    {col.total(rows)}
                  </FeesTableCell>
                ))}
              </FeesTableRow>
            )}
          </FeesTableBody>
        </FeesTable>
      )}
    </CompactPanel>
  );
}
