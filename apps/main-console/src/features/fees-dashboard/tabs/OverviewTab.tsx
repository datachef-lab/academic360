import { TabPanel } from "../components/TabPanel";
import { LiveStudentsTracker } from "../components/LiveStudentsTracker";
import { MappingTypeWidget } from "../components/widgets/MappingTypeWidget";
import { PaymentStatusWidget } from "../components/widgets/PaymentStatusWidget";

export function OverviewTab() {
  return (
    <TabPanel tab="overview">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
        <div className="min-w-0">
          <LiveStudentsTracker />
        </div>
        <div className="min-w-0">
          <MappingTypeWidget />
        </div>
      </div>
      <PaymentStatusWidget />
    </TabPanel>
  );
}
