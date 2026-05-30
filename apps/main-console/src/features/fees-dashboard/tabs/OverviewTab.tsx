import { TabPanel } from "../components/TabPanel";
import { PaymentStatusWidget } from "../components/widgets/PaymentStatusWidget";
import {
  ChartCard,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ChartCard";
import { formatHourTo12h } from "../utils/chart-axis-format";
import { buildYTickLabels, maxFromKeys } from "../utils/chart-utils";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import { DashboardEmptyState } from "../components/DashboardEmptyState";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const HOURLY_CHART_CONFIG = {
  txns: { label: "Transactions", color: "#7c3aed" },
} satisfies ChartConfig;

export function OverviewTab() {
  const { dashboard, dashboardLoading } = useFeesDashboard();
  const hourlyActivity = dashboard?.hourlyActivity ?? [];
  const hasActivityToday = hourlyActivity.some((d) => d.txns > 0);
  const yMax = Math.max(maxFromKeys(hourlyActivity, ["txns"]), 1);

  return (
    <TabPanel tab="overview">
      <PaymentStatusWidget />
      <ChartCard
        title="Hourly activity"
        description="Today · successful fee payments"
        config={HOURLY_CHART_CONFIG}
        xAxisTitle="Time (12-hour)"
        yAxisTitle="Transactions"
        xTickLabels={hourlyActivity.map((d) => formatHourTo12h(d.hour))}
        yTickLabels={buildYTickLabels(yMax)}
        xTicksCompact={hourlyActivity.length > 12}
      >
        {(!hasActivityToday || hourlyActivity.length === 0) && !dashboardLoading ? (
          <DashboardEmptyState message="No fee payments recorded today." />
        ) : (
          <AreaChart data={hourlyActivity} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis hide dataKey="hour" />
            <YAxis hide domain={[0, yMax * 1.08]} allowDecimals={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const hour = (payload?.[0]?.payload as { hour?: string })?.hour;
                    return hour ? formatHourTo12h(hour) : "";
                  }}
                />
              }
            />
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
