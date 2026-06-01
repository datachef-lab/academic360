import { ReactNode } from "react";
import { TabMetricsRow } from "./TabMetricsRow";
import type { FeesDashboardTab } from "../data/dashboard-metrics";
import { TAB_TODAY_METRICS } from "../data/dashboard-metrics";

type TabPanelProps = {
  tab: FeesDashboardTab;
  children: ReactNode;
};

export function TabPanel({ tab, children }: TabPanelProps) {
  const todayIds = TAB_TODAY_METRICS[tab];

  return (
    <div className="space-y-3">
      <TabMetricsRow tab={tab} />
      {todayIds && todayIds.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#888]">
            Today
          </p>
          <TabMetricsRow tab={tab} metricIds={todayIds} compact />
        </div>
      )}
      {children}
    </div>
  );
}
