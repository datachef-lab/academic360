import { TabPanel } from "../components/TabPanel";
import {
  ChartCard,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ChartCard";
import { SemesterBreakdownPanel } from "../components/SemesterBreakdownPanel";
import { PaymentChannelsPanel } from "../components/PaymentChannelsPanel";
import { PromotionFeeWidget } from "../components/widgets/PromotionFeeWidget";
import { CollectionMixWidget } from "../components/widgets/CollectionMixWidget";
import { COLLECTION_TREND } from "../data/mock-data";
import { formatMonthYearTickShort } from "../utils/chart-axis-format";
import { buildYTickLabels, maxFromKeys } from "../utils/chart-utils";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const COLLECTION_CHART_CONFIG = {
  collected: { label: "Collected", color: "#7c3aed" },
  pending: { label: "Outstanding", color: "#a78bfa" },
} satisfies ChartConfig;

export function CollectionsTab() {
  const yMax = maxFromKeys(COLLECTION_TREND, ["collected", "pending"]);

  return (
    <TabPanel tab="collections">
      <div className="grid gap-3 lg:grid-cols-2">
        <SemesterBreakdownPanel variant="collections" />
        <CollectionMixWidget />
      </div>
      <ChartCard
        title="Collection trend"
        description="Monthly · ₹ Lakh"
        config={COLLECTION_CHART_CONFIG}
        xAxisTitle="Month · year"
        yAxisTitle="Amount (₹ Lakh)"
        xTickLabels={COLLECTION_TREND.map((d) => formatMonthYearTickShort(d.monthLabel))}
        xTicksCompact
        yTickLabels={buildYTickLabels(yMax)}
      >
        <LineChart data={COLLECTION_TREND} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis hide dataKey="monthLabel" />
          <YAxis hide domain={[0, yMax * 1.08]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => String(label)}
                formatter={(value, name) => [`₹${value} L`, String(name)]}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="collected"
            stroke="var(--color-collected)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="pending"
            stroke="var(--color-pending)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartCard>
      <PaymentChannelsPanel />
      <PromotionFeeWidget />
    </TabPanel>
  );
}
