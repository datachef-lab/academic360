import { useMemo } from "react";
import { CompactPanel } from "./CompactPanel";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "./FeesTable";
import { formatInr } from "../data/dashboard-metrics";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { formatPaymentChannel, paymentChannelRecordedBy } from "../utils/dashboard-display";

export function PaymentChannelsPanel() {
  const { dashboard, dashboardLoading } = useFeesDashboard();

  const rows = useMemo(
    () =>
      (dashboard?.paymentChannels ?? []).map((c) => ({
        channel: formatPaymentChannel(c.channel),
        studentCount: c.studentCount,
        amount: c.amount,
        recordedBy: paymentChannelRecordedBy(c.channel),
      })),
    [dashboard?.paymentChannels],
  );

  return (
    <CompactPanel title="Payment channel · student entries" noPadding>
      {rows.length === 0 && !dashboardLoading ? (
        <DashboardEmptyState message="No payment channel entries found." />
      ) : (
        <FeesTable>
          <FeesTableHeader>
            <FeesTableHead>Channel</FeesTableHead>
            <FeesTableHead className="text-right">Students</FeesTableHead>
            <FeesTableHead className="text-right">Amount</FeesTableHead>
            <FeesTableHead>Recorded by</FeesTableHead>
          </FeesTableHeader>
          <FeesTableBody>
            {rows.map((row) => (
              <FeesTableRow key={row.channel}>
                <FeesTableCell className="font-medium">{row.channel}</FeesTableCell>
                <FeesTableCell className="text-right tabular-nums">
                  {row.studentCount.toLocaleString("en-IN")}
                </FeesTableCell>
                <FeesTableCell className="text-right font-semibold tabular-nums">
                  {formatInr(row.amount)}
                </FeesTableCell>
                <FeesTableCell>{row.recordedBy}</FeesTableCell>
              </FeesTableRow>
            ))}
          </FeesTableBody>
        </FeesTable>
      )}
      <p className="border-t border-[#b8b8b8] px-3 py-2 text-sm text-[#1a1a1a]">
        Cash and cheque are staff-marked; online is gateway SUCCESS.
      </p>
    </CompactPanel>
  );
}
