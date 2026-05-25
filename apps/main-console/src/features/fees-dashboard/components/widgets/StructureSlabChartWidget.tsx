import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { VisualCard } from "../VisualCard";
import { ChartCard, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../ChartCard";
import { useFeesDashboard } from "../../context/FeesDashboardContext";
import { getStructureSlabAmounts } from "../../utils/structure-display";
import { buildYTickLabels, maxFromKeys } from "../../utils/chart-utils";

const SLAB_CHART_CONFIG = {
  amount: { label: "Amount (₹ Lakh)", color: "#7c3aed" },
} satisfies ChartConfig;

export function StructureSlabChartWidget() {
  const { structures } = useFeesDashboard();

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of structures) {
      for (const slab of getStructureSlabAmounts(s)) {
        totals.set(slab.slabLabel, (totals.get(slab.slabLabel) ?? 0) + slab.amount);
      }
    }
    return [...totals.entries()]
      .map(([slab, amountLakh]) => ({
        slab,
        amount: Math.round(amountLakh / 100_000),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [structures]);

  const yMax = maxFromKeys(chartData, ["amount"]);

  if (chartData.length === 0) {
    return (
      <VisualCard title="Structure totals by fee slab">
        <p className="py-8 text-center text-sm text-[#1a1a1a]">No structure data</p>
      </VisualCard>
    );
  }

  return (
    <ChartCard
      title="Structure totals by fee slab"
      description="Per slab component sum"
      config={SLAB_CHART_CONFIG}
      xAxisTitle="Fee slab"
      yAxisTitle="Amount (₹ Lakh)"
      xTickLabels={chartData.map((d) => d.slab)}
      yTickLabels={buildYTickLabels(yMax)}
      xTicksCompact={chartData.length > 5}
    >
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis hide dataKey="slab" />
        <YAxis hide domain={[0, yMax * 1.08]} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [`₹${value} L`, "Slab total"]}
              labelFormatter={(label) => String(label)}
            />
          }
        />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}
