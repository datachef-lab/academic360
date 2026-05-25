import { TabPanel } from "../components/TabPanel";
import { formatInr } from "../data/dashboard-metrics";
import { SemesterBreakdownPanel } from "../components/SemesterBreakdownPanel";
import { PaymentChannelsPanel } from "../components/PaymentChannelsPanel";
import { CompactPanel } from "../components/CompactPanel";
import { TransactionMixWidget } from "../components/widgets/TransactionMixWidget";
import { GatewayMixWidget } from "../components/widgets/GatewayMixWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "../components/FeesTable";

const TXNS = [
  {
    id: "TXN98421",
    student: "Ananya Sharma",
    amount: 48500,
    gateway: "Razorpay",
    status: "SUCCESS",
  },
  { id: "TXN98420", student: "Rahul Verma", amount: 92000, gateway: "Paytm", status: "SUCCESS" },
  { id: "TXN98419", student: "Priya Nair", amount: 35200, gateway: "Cashfree", status: "PENDING" },
  { id: "TXN98418", student: "Arjun Patel", amount: 41800, gateway: "Razorpay", status: "FAILED" },
];

export function TransactionsTab() {
  return (
    <TabPanel tab="transactions">
      <div className="grid gap-3 lg:grid-cols-2">
        <SemesterBreakdownPanel variant="transactions" />
        <TransactionMixWidget />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <GatewayMixWidget />
        <PaymentChannelsPanel />
      </div>
      <CompactPanel
        title="Recent transactions"
        noPadding
        headerRight={<Badge className="h-5 bg-[#7c3aed] text-[10px] text-white">Live</Badge>}
      >
        <FeesTable>
          <FeesTableHeader>
            <FeesTableHead>Txn</FeesTableHead>
            <FeesTableHead>Student</FeesTableHead>
            <FeesTableHead className="text-right">Amount</FeesTableHead>
            <FeesTableHead>Gateway</FeesTableHead>
            <FeesTableHead>Status</FeesTableHead>
            <FeesTableHead>Action</FeesTableHead>
          </FeesTableHeader>
          <FeesTableBody>
            {TXNS.map((t) => (
              <FeesTableRow key={t.id}>
                <FeesTableCell className="font-mono text-xs">{t.id}</FeesTableCell>
                <FeesTableCell className="text-xs">{t.student}</FeesTableCell>
                <FeesTableCell className="text-right text-xs font-semibold tabular-nums">
                  {formatInr(t.amount)}
                </FeesTableCell>
                <FeesTableCell className="text-xs">{t.gateway}</FeesTableCell>
                <FeesTableCell>
                  <Badge
                    className={
                      t.status === "SUCCESS"
                        ? "h-5 bg-violet-100 text-[10px] text-violet-800"
                        : t.status === "FAILED"
                          ? "h-5 bg-slate-100 text-[10px] text-slate-700"
                          : "h-5 bg-amber-100 text-[10px] text-amber-800"
                    }
                  >
                    {t.status}
                  </Badge>
                </FeesTableCell>
                <FeesTableCell>
                  {t.status === "FAILED" && (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]">
                      Retry
                    </Button>
                  )}
                </FeesTableCell>
              </FeesTableRow>
            ))}
          </FeesTableBody>
        </FeesTable>
      </CompactPanel>
    </TabPanel>
  );
}
