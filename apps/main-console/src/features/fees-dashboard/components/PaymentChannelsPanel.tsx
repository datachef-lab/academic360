import { PAYMENT_CHANNEL_STATS } from "../data/mock-data";
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

export function PaymentChannelsPanel() {
  return (
    <CompactPanel title="Payment channel · student entries" noPadding>
      <FeesTable>
        <FeesTableHeader>
          <FeesTableHead>Channel</FeesTableHead>
          <FeesTableHead className="text-right">Students</FeesTableHead>
          <FeesTableHead className="text-right">Amount</FeesTableHead>
          <FeesTableHead>Recorded by</FeesTableHead>
        </FeesTableHeader>
        <FeesTableBody>
          {PAYMENT_CHANNEL_STATS.map((row) => (
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
      <p className="border-t border-[#b8b8b8] px-3 py-2 text-sm text-[#1a1a1a]">
        Cash and cheque are staff-marked; online is gateway SUCCESS.
      </p>
    </CompactPanel>
  );
}
