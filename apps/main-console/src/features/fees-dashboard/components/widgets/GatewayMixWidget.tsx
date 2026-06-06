import { useMemo } from "react";
import { VisualCard } from "../VisualCard";
import { ChartDonut } from "../ChartDonut";
import { useFeesDashboard } from "../../context/FeesDashboardContext";
import { DashboardEmptyState } from "../DashboardEmptyState";
import { donutColor } from "../../utils/dashboard-display";

export function GatewayMixWidget() {
  const { dashboard, dashboardLoading } = useFeesDashboard();

  const data = useMemo(() => {
    const mix = dashboard?.gatewayMix ?? [];
    const total = mix.reduce((s, r) => s + r.count, 0);
    return mix.map((row, i) => ({
      name: row.name,
      value: total > 0 ? Math.round((row.count / total) * 100) : 0,
      color: donutColor(i),
    }));
  }, [dashboard?.gatewayMix]);

  if (data.length === 0 && !dashboardLoading) {
    return (
      <VisualCard title="Gateway share">
        <DashboardEmptyState message="No online gateway payments found." />
      </VisualCard>
    );
  }

  return (
    <VisualCard title="Gateway share">
      <ChartDonut
        data={data}
        centerLabel={<span className="text-xs font-semibold text-[#1a1a1a]">Online %</span>}
        footer={
          <ul className="mt-2 space-y-1 border-t border-[#b8b8b8] pt-2 text-xs text-[#1a1a1a]">
            {data.map((d) => (
              <li key={d.name} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong>{d.value}%</strong>
              </li>
            ))}
          </ul>
        }
      />
    </VisualCard>
  );
}
