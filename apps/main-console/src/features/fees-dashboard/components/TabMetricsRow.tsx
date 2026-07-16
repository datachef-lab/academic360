import { MetricCard } from "./MetricCard";
import type { TabMetricTheme } from "./TabPanel";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import {
  ALL_METRICS,
  TAB_METRICS,
  formatMetricValue,
  type FeesDashboardTab,
  type MetricId,
} from "../data/dashboard-metrics";

type TabMetricsRowProps = {
  tab?: FeesDashboardTab;
  metricIds?: MetricId[];
  compact?: boolean;
  metricTheme?: TabMetricTheme;
};

export function TabMetricsRow({ tab, metricIds, compact, metricTheme }: TabMetricsRowProps) {
  const { metrics, dashboardLoading } = useFeesDashboard();
  const ids = metricIds ?? (tab ? TAB_METRICS[tab] : []);

  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4"
          : "grid grid-cols-2 gap-2 lg:grid-cols-4"
      }
    >
      {ids.map((id) => {
        const m = ALL_METRICS[id];
        return (
          <MetricCard
            key={id}
            id={id}
            label={m.label}
            value={dashboardLoading ? "…" : formatMetricValue(id, metrics)}
            hint={dashboardLoading ? "Loading dashboard data" : m.hint}
            progress={
              dashboardLoading
                ? undefined
                : id === "collection_rate"
                  ? metrics.collection_rate
                  : undefined
            }
            compact={compact}
            theme={metricTheme}
          />
        );
      })}
    </div>
  );
}
