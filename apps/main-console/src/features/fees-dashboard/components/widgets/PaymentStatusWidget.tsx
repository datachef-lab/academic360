import { CompactPanel } from "../CompactPanel";
import { formatInr } from "../../data/dashboard-metrics";
import { useFeesDashboard } from "../../context/FeesDashboardContext";
import { DashboardEmptyState } from "../DashboardEmptyState";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "../FeesTable";

export function PaymentStatusWidget() {
  const { dashboard, dashboardLoading } = useFeesDashboard();
  const rows = dashboard?.paymentStatus ?? [];

  return (
    <CompactPanel title="Payment status" noPadding>
      {rows.length === 0 && !dashboardLoading ? (
        <DashboardEmptyState message="No fee collection records for active students in this scope." />
      ) : (
        <FeesTable>
          <FeesTableHeader>
            <FeesTableHead>Status</FeesTableHead>
            <FeesTableHead className="text-right">Count</FeesTableHead>
            <FeesTableHead className="text-right">Amount</FeesTableHead>
            <FeesTableHead className="text-right">Share</FeesTableHead>
          </FeesTableHeader>
          <FeesTableBody>
            {rows.map((r) => (
              <FeesTableRow key={r.status}>
                <FeesTableCell className="font-medium">{r.status}</FeesTableCell>
                <FeesTableCell className="text-right">
                  {r.count.toLocaleString("en-IN")}
                </FeesTableCell>
                <FeesTableCell className="text-right font-semibold">
                  {formatInr(r.amount)}
                </FeesTableCell>
                <FeesTableCell className="text-right">{r.sharePct}%</FeesTableCell>
              </FeesTableRow>
            ))}
          </FeesTableBody>
        </FeesTable>
      )}
      <p className="border-t border-[#b8b8b8] px-3 py-2 text-sm text-[#1a1a1a]">
        Source: fee_student_mappings · active users · paid / partial / unpaid
      </p>
    </CompactPanel>
  );
}
