import { useMemo } from "react";
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
import { formatMonthYearTickShort } from "../utils/chart-axis-format";
import { buildYTickLabels, maxFromKeys } from "../utils/chart-utils";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import { DashboardEmptyState } from "../components/DashboardEmptyState";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const COLLECTION_CHART_CONFIG = {
  collected: { label: "Collected", color: "#7c3aed" },
  pending: { label: "Outstanding", color: "#a78bfa" },
} satisfies ChartConfig;

export function CollectionsTab() {
  const { dashboard, dashboardLoading } = useFeesDashboard();
  const collectionTrend = dashboard?.collectionTrend ?? [];
  const yMax = Math.max(maxFromKeys(collectionTrend, ["collected", "pending"]), 1);

  const xTickLabels = useMemo(
    () => collectionTrend.map((d) => formatMonthYearTickShort(d.monthLabel)),
    [collectionTrend],
  );

  return (
    <TabPanel tab="collections">
      <div className="grid gap-3 lg:grid-cols-2">
        <SemesterBreakdownPanel variant="collections" semesterNumeralOnly />
        <CollectionMixWidget />
      </div>
      <ChartCard
        title="Collection trend"
        description="Monthly · ₹ Lakh"
        config={COLLECTION_CHART_CONFIG}
        xAxisTitle="Month · year"
        yAxisTitle="Amount (₹ Lakh)"
        xTickLabels={xTickLabels}
        xTicksCompact
        yTickLabels={buildYTickLabels(yMax)}
      >
        {collectionTrend.length === 0 && !dashboardLoading ? (
          <DashboardEmptyState message="No monthly collection history in the last 12 months." />
        ) : (
          <LineChart data={collectionTrend} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
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
        )}
      </ChartCard>
      <PaymentChannelsPanel />
      <PromotionFeeWidget />
    </TabPanel>
  );
}
