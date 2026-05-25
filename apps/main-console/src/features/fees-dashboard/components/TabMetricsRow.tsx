import { MetricCard } from "./MetricCard";
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
};

const TRENDS: Partial<Record<string, number>> = {
  fee_receivable: 3.2,
  fee_collected: 8.4,
  collection_rate: 2.1,
};

export function TabMetricsRow({ tab, metricIds, compact }: TabMetricsRowProps) {
  const { metrics } = useFeesDashboard();
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
            value={formatMetricValue(id, metrics)}
            hint={m.hint}
            trend={TRENDS[id]}
            progress={id === "collection_rate" ? metrics.collection_rate : undefined}
            compact={compact}
          />
        );
      })}
    </div>
  );
}
