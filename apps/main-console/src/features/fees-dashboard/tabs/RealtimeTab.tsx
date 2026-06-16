import { TabPanel } from "../components/TabPanel";
import { LiveStudentsTracker } from "../components/LiveStudentsTracker";
import {
  ChartCard,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ChartCard";
import { formatHourTo12h } from "../utils/chart-axis-format";
import { buildYTickLabels, maxFromKeys } from "../utils/chart-utils";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const HEATMAP = [
  { hour: "10:00", txns: 28 },
  { hour: "11:00", txns: 45 },
  { hour: "12:00", txns: 38 },
  { hour: "13:00", txns: 22 },
  { hour: "14:00", txns: 52 },
  { hour: "15:00", txns: 48 },
];

const HOURLY_CHART_CONFIG = {
  txns: { label: "Transactions", color: "#7c3aed" },
} satisfies ChartConfig;

export function RealtimeTab() {
  const yMax = maxFromKeys(HEATMAP, ["txns"]);

  return (
    <TabPanel tab="realtime">
      <LiveStudentsTracker />
      <ChartCard
        title="Hourly activity"
        config={HOURLY_CHART_CONFIG}
        xAxisTitle="Time (12-hour)"
        yAxisTitle="Transactions"
        xTickLabels={HEATMAP.map((d) => formatHourTo12h(d.hour))}
        yTickLabels={buildYTickLabels(yMax)}
      >
        <AreaChart data={HEATMAP} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
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
      </ChartCard>
    </TabPanel>
  );
}
