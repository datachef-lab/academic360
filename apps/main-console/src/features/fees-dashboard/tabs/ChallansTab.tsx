import { TabPanel } from "../components/TabPanel";
import { SemesterBreakdownPanel } from "../components/SemesterBreakdownPanel";
import { PaymentChannelsPanel } from "../components/PaymentChannelsPanel";
import { ReceiptChannelWidget } from "../components/widgets/ReceiptChannelWidget";
import {
  ChartCard,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ChartCard";
import { buildYTickLabels, maxFromKeys } from "../utils/chart-utils";
import { useFeesDashboard } from "../context/FeesDashboardContext";
import { DashboardEmptyState } from "../components/DashboardEmptyState";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const CHALLAN_CHART_CONFIG = {
  generated: { label: "Generated", color: "#10b981" },
  pending: { label: "Not generated", color: "#f43f5e" },
} satisfies ChartConfig;

export function ChallansTab() {
  const { dashboard, dashboardLoading } = useFeesDashboard();
  const chartData = dashboard?.challansByProgram ?? [];
  const yMax = Math.max(maxFromKeys(chartData, ["generated", "pending"]), 1);

  return (
    <TabPanel tab="challans">
      <div className="grid gap-3 lg:grid-cols-2">
        <SemesterBreakdownPanel variant="challans" semesterNumeralOnly />
        <SemesterBreakdownPanel variant="receipts" semesterNumeralOnly />
      </div>
      <ChartCard
        title="Challans by program"
        description="Student count"
        config={CHALLAN_CHART_CONFIG}
        xAxisTitle="Program"
        yAxisTitle="Student count"
        xTickLabels={chartData.map((d) => d.program)}
        yTickLabels={buildYTickLabels(yMax)}
      >
        {chartData.length === 0 && !dashboardLoading ? (
          <DashboardEmptyState message="No challan data by program." />
        ) : (
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis hide dataKey="program" />
            <YAxis hide domain={[0, yMax * 1.08]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as {
                      programCourse?: string;
                      program?: string;
                    };
                    return row?.programCourse ?? row?.program ?? "";
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="generated"
              stackId="a"
              fill="var(--color-generated)"
              radius={[0, 0, 0, 0]}
            />
            <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ChartCard>
      <div className="grid gap-3 lg:grid-cols-2">
        <ReceiptChannelWidget />
        <PaymentChannelsPanel />
      </div>
    </TabPanel>
  );
}
