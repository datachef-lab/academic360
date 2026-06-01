import { ReactNode } from "react";
import { TabMetricsRow } from "./TabMetricsRow";
import type { FeesDashboardTab } from "../data/dashboard-metrics";
import { TAB_TODAY_METRICS } from "../data/dashboard-metrics";
import { useFeesDashboard } from "../context/FeesDashboardContext";

type TabPanelProps = {
  tab: FeesDashboardTab;
  children: ReactNode;
};

export function TabPanel({ tab, children }: TabPanelProps) {
  const todayIds = TAB_TODAY_METRICS[tab];
  const { dashboardError } = useFeesDashboard();

  return (
    <div className="space-y-3">
      {dashboardError && (
        <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]">
          {dashboardError}
        </p>
      )}
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
