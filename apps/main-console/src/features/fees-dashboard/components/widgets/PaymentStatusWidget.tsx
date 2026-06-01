import { CompactPanel } from "../CompactPanel";
import { formatInr } from "../../data/dashboard-metrics";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "../FeesTable";

const ROWS = [
  { status: "SUCCESS", count: 8412, amount: 298_400_000, pct: 94.2 },
  { status: "PENDING", count: 84, amount: 2_100_000, pct: 0.9 },
  { status: "FAILED", count: 127, amount: 4_800_000, pct: 1.4 },
  { status: "REFUNDED", count: 23, amount: 1_200_000, pct: 0.3 },
];

export function PaymentStatusWidget() {
  return (
    <CompactPanel title="Payment status" noPadding>
      <FeesTable>
        <FeesTableHeader>
          <FeesTableHead>Status</FeesTableHead>
          <FeesTableHead className="text-right">Count</FeesTableHead>
          <FeesTableHead className="text-right">Amount</FeesTableHead>
          <FeesTableHead className="text-right">Share</FeesTableHead>
        </FeesTableHeader>
        <FeesTableBody>
          {ROWS.map((r) => (
            <FeesTableRow key={r.status}>
              <FeesTableCell className="font-medium">{r.status}</FeesTableCell>
              <FeesTableCell className="text-right">
                {r.count.toLocaleString("en-IN")}
              </FeesTableCell>
              <FeesTableCell className="text-right font-semibold">
                {formatInr(r.amount)}
              </FeesTableCell>
              <FeesTableCell className="text-right">{r.pct}%</FeesTableCell>
            </FeesTableRow>
          ))}
        </FeesTableBody>
      </FeesTable>
      <p className="border-t border-[#b8b8b8] px-3 py-2 text-sm text-[#1a1a1a]">
        Source: payments · context FEE
      </p>
    </CompactPanel>
  );
}
