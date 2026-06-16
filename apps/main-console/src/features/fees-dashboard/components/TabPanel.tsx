import { ReactNode } from "react";
import { TabMetricsRow } from "./TabMetricsRow";
import type { FeesDashboardTab } from "../data/dashboard-metrics";
import { TAB_TODAY_METRICS } from "../data/dashboard-metrics";
import { useFeesDashboard } from "../context/FeesDashboardContext";

export type TabMetricTheme = "default" | "challans";

type TabPanelProps = {
  tab: FeesDashboardTab;
  children: ReactNode;
  /** Optional KPI card palette override for this tab. */
  metricTheme?: TabMetricTheme;
};

export function TabPanel({ tab, children, metricTheme = "default" }: TabPanelProps) {
  const todayIds = TAB_TODAY_METRICS[tab];
  const { dashboardError } = useFeesDashboard();

  return (
    <div className="space-y-3">
      {dashboardError && (
        <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]">
          {dashboardError}
        </p>
      )}
      <TabMetricsRow tab={tab} metricTheme={metricTheme} />
      {todayIds && todayIds.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#888]">
            Today
          </p>
          <TabMetricsRow tab={tab} metricIds={todayIds} compact metricTheme={metricTheme} />
        </div>
      )}
      {children}
    </div>
  );
}
