import { TabPanel } from "../components/TabPanel";
import { SemesterBreakdownPanel } from "../components/SemesterBreakdownPanel";
import { PaymentChannelsPanel } from "../components/PaymentChannelsPanel";
import { ReceiptChannelWidget } from "../components/widgets/ReceiptChannelWidget";

export function ReceiptsTab() {
  return (
    <TabPanel tab="receipts">
      <div className="grid gap-3 lg:grid-cols-2">
        <SemesterBreakdownPanel variant="receipts" />
        <ReceiptChannelWidget />
      </div>
      <PaymentChannelsPanel />
    </TabPanel>
  );
}
