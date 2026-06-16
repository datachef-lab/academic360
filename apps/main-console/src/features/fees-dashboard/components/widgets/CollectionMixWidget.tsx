import { useMemo } from "react";
import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";
import { formatInr } from "../../data/dashboard-metrics";
import { useFeesDashboard } from "../../context/FeesDashboardContext";
import { DashboardEmptyState } from "../DashboardEmptyState";

export function CollectionMixWidget() {
  const { metrics, dashboardLoading } = useFeesDashboard();

  const collected = metrics.fee_collected;
  const pending = metrics.fee_pending;
  const hasData = collected > 0 || pending > 0;

  const data = useMemo(
    () => [
      { name: "Collected", value: collected, color: "#7c3aed" },
      { name: "Pending", value: pending, color: "#a78bfa" },
    ],
    [collected, pending],
  );

  if (!hasData && !dashboardLoading) {
    return (
      <VisualCard title="Receivable mix">
        <DashboardEmptyState message="No receivable data for the selected filters." />
      </VisualCard>
    );
  }

  return (
    <VisualCard title="Receivable mix">
      <ChartDonut
        data={data}
        centerLabel={
          <>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#1a1a1a]">
              Collection
            </span>
            <span className="text-lg font-bold text-[#1a1a1a]">{metrics.collection_rate}%</span>
          </>
        }
        tooltipFormatter={(v) => formatInr(v)}
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {data.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong className="tabular-nums">{formatInr(d.value)}</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
