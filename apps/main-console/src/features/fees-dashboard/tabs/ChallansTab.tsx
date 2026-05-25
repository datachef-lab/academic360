import { TabPanel } from "../components/TabPanel";
import { SemesterBreakdownPanel } from "../components/SemesterBreakdownPanel";
import { formatInr } from "../data/dashboard-metrics";
import {
  ChartCard,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ChartCard";
import { CompactPanel } from "../components/CompactPanel";
import { buildYTickLabels, maxFromKeys } from "../utils/chart-utils";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "../components/FeesTable";

const ROWS = [
  { id: "CH-8821", student: "Arjun Patel", program: "BCA", amount: 41800, status: "Generated" },
  {
    id: "CH-8819",
    student: "Rahul Verma",
    program: "BBA (H)",
    amount: 92000,
    status: "Not generated",
  },
];

const CHART = [
  { program: "B.Com (H)", programCourse: "B.Com (H) · Commerce", generated: 2100, pending: 42 },
  { program: "BBA (H)", programCourse: "BBA (H) · Management", generated: 1850, pending: 68 },
  { program: "BCA", programCourse: "BCA · Computer Applications", generated: 1420, pending: 55 },
];

const CHALLAN_CHART_CONFIG = {
  generated: { label: "Generated", color: "#10b981" },
  pending: { label: "Not generated", color: "#f43f5e" },
} satisfies ChartConfig;

export function ChallansTab() {
  const yMax = maxFromKeys(CHART, ["generated", "pending"]);

  return (
    <TabPanel tab="challans">
      <SemesterBreakdownPanel variant="challans" />
      <ChartCard
        title="Challans by program"
        description="Student count"
        config={CHALLAN_CHART_CONFIG}
        xAxisTitle="Program"
        yAxisTitle="Student count"
        xTickLabels={CHART.map((d) => d.program)}
        yTickLabels={buildYTickLabels(yMax)}
      >
        <BarChart data={CHART} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis hide dataKey="program" />
          <YAxis hide domain={[0, yMax * 1.08]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { programCourse?: string; program?: string };
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
      </ChartCard>
      <CompactPanel title="Challan monitor" noPadding>
        <FeesTable>
          <FeesTableHeader>
            <FeesTableHead>ID</FeesTableHead>
            <FeesTableHead>Student</FeesTableHead>
            <FeesTableHead>Program</FeesTableHead>
            <FeesTableHead className="text-right">Amount</FeesTableHead>
            <FeesTableHead>Status</FeesTableHead>
          </FeesTableHeader>
          <FeesTableBody>
            {ROWS.map((r) => (
              <FeesTableRow key={r.id}>
                <FeesTableCell className="font-mono">{r.id}</FeesTableCell>
                <FeesTableCell>{r.student}</FeesTableCell>
                <FeesTableCell>{r.program}</FeesTableCell>
                <FeesTableCell className="text-right font-semibold">
                  {formatInr(r.amount)}
                </FeesTableCell>
                <FeesTableCell>
                  <Badge
                    className={
                      r.status.includes("Not")
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }
                  >
                    {r.status}
                  </Badge>
                </FeesTableCell>
              </FeesTableRow>
            ))}
          </FeesTableBody>
        </FeesTable>
      </CompactPanel>
    </TabPanel>
  );
}
