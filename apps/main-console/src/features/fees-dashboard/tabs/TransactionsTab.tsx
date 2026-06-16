import { TabPanel } from "../components/TabPanel";
import { SemesterBreakdownPanel } from "../components/SemesterBreakdownPanel";
import { PaymentChannelsPanel } from "../components/PaymentChannelsPanel";
import { TransactionMixWidget } from "../components/widgets/TransactionMixWidget";
import { GatewayMixWidget } from "../components/widgets/GatewayMixWidget";

export function TransactionsTab() {
  return (
    <TabPanel tab="transactions">
      <div className="grid gap-3 lg:grid-cols-2">
        <SemesterBreakdownPanel variant="transactions" semesterNumeralOnly />
        <TransactionMixWidget />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <GatewayMixWidget />
        <PaymentChannelsPanel />
      </div>
    </TabPanel>
  );
}
