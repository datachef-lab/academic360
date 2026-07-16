import { TabPanel } from "../components/TabPanel";
import { PaymentStatusWidget } from "../components/widgets/PaymentStatusWidget";
import { ChartCard, ChartTooltip, type ChartConfig } from "../components/ChartCard";
import { formatHourTo12h } from "../utils/chart-axis-format";
import { buildYTickLabels, maxFromKeys } from "../utils/chart-utils";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import { DashboardEmptyState } from "../components/DashboardEmptyState";
import type { HourlyActivityRow } from "../types/dashboard-api";
import { Area, AreaChart, CartesianGrid, TooltipProps, XAxis, YAxis } from "recharts";

const HOURLY_CHART_CONFIG = {
  txns: { label: "Successful", color: "#7c3aed" },
} satisfies ChartConfig;

function HourlyActivityTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as HourlyActivityRow | undefined;
  if (!row) return null;

  const success = row.success ?? row.txns ?? 0;
  const failed = row.failed ?? 0;

  return (
    <div className="grid min-w-[9rem] gap-1.5 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-[#1a1a1a]">{formatHourTo12h(row.hour)}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-[#444]">
          <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          Success
        </span>
        <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
          {success.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-[#444]">
          <span className="h-2 w-2 rounded-full bg-[#dc2626]" />
          Failed
        </span>
        <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
          {failed.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

export function OverviewTab() {
  const { dashboard, dashboardLoading } = useFeesDashboard();
  const hourlyActivity = dashboard?.hourlyActivity ?? [];
  const hasActivityToday = hourlyActivity.some((d) => (d.success ?? d.txns) > 0 || d.failed > 0);
  const yMax = Math.max(maxFromKeys(hourlyActivity, ["txns"]), 1);

  return (
    <TabPanel tab="overview">
      <PaymentStatusWidget />
      <ChartCard
        title="Hourly activity"
        description="Today · all fee payments (not filtered) · hover for success / failed"
        config={HOURLY_CHART_CONFIG}
        xAxisTitle="Time (12-hour)"
        yAxisTitle="Successful"
        xTickLabels={hourlyActivity.map((d) => formatHourTo12h(d.hour))}
        yTickLabels={buildYTickLabels(yMax)}
        xTicksCompact={hourlyActivity.length > 12}
      >
        {(!hasActivityToday || hourlyActivity.length === 0) && !dashboardLoading ? (
          <DashboardEmptyState message="No fee payment attempts recorded today." />
        ) : (
          <AreaChart data={hourlyActivity} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis hide dataKey="hour" />
            <YAxis hide domain={[0, yMax * 1.08]} allowDecimals={false} />
            <ChartTooltip content={<HourlyActivityTooltip />} />
            <Area
              type="monotone"
              dataKey="txns"
              stroke="var(--color-txns)"
              fill="var(--color-txns)"
              fillOpacity={0.2}
            />
          </AreaChart>
        )}
      </ChartCard>
    </TabPanel>
  );
}
