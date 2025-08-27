"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { GraduationCap, IndianRupee, Clock, Ban } from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell } from "recharts";

// Stat cards data
const statCards: (
  | {
      label: string;
      value: number;
      icon: JSX.Element;
      bg: string;
    }
  | {
      label: string;
      value: string;
      icon: JSX.Element;
      bg: string;
    }
)[] = [
  {
    label: "Total Admissions",
    value: 0,
    icon: <GraduationCap className="text-purple-600 w-7 h-7" />,
    bg: "bg-purple-100/60",
  },
  {
    label: "Total Fees Collected",
    value: "₹ 0",
    icon: <IndianRupee className="text-green-600 w-7 h-7" />,
    bg: "bg-green-100/60",
  },
  {
    label: "Pending Admissions",
    value: 0,
    icon: <Clock className="text-yellow-600 w-7 h-7" />,
    bg: "bg-yellow-100/60",
  },
  { label: "Unpaid Fees", value: "₹ 0", icon: <Ban className="text-red-600 w-7 h-7" />, bg: "bg-red-100/60" },
];

const recentActivities: {
  name: string;
  type: string;
  status: string;
  date: string;
}[] = [
//   { name: "John Doe", type: "Admission", status: "Paid", date: "2024-04-10" },
//   { name: "Jane Smith", type: "Fee Payment", status: "Unpaid", date: "2024-04-09" },
//   { name: "Alice Brown", type: "Admission", status: "Pending", date: "2024-04-08" },
];

function getAcademicYearLabel(startYear: number) {
  return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
}

// --- shadcn/ui + Recharts Chart Components ---
const barChartData: {
  month: string;
  admissions: number;
  fees: number;
}[] = [
  //   { month: 'Jul', admissions: 30, fees: 120 },
  //   { month: 'Aug', admissions: 40, fees: 150 },
  //   { month: 'Sep', admissions: 35, fees: 130 },
  //   { month: 'Oct', admissions: 50, fees: 180 },
  //   { month: 'Nov', admissions: 45, fees: 170 },
  //   { month: 'Dec', admissions: 38, fees: 140 },
  //   { month: 'Jan', admissions: 42, fees: 160 },
  //   { month: 'Feb', admissions: 36, fees: 135 },
  //   { month: 'Mar', admissions: 48, fees: 175 },
  //   { month: 'Apr', admissions: 41, fees: 155 },
  //   { month: 'May', admissions: 39, fees: 145 },
  //   { month: 'Jun', admissions: 44, fees: 165 },
];
const barChartConfig = {
  admissions: { label: "Admissions", color: "#a78bfa" },
  fees: { label: "Fees Collected (k)", color: "#34d399" },
};

const lineChartData: {
  year: number;
  admissions: number;
}[] = [
  //   { year: 2020, admissions: 320 },
  //   { year: 2021, admissions: 350 },
  //   { year: 2022, admissions: 370 },
  //   { year: 2023, admissions: 400 },
  //   { year: 2024, admissions: 420 },
];
const lineChartConfig = {
  admissions: { label: "Admissions", color: "#a78bfa" },
};

const pieChartData = [
  { name: "Paid", value: 0, color: "#34d399" },
  { name: "Partially Paid", value: 0, color: "#fbbf24" },
  { name: "Unpaid", value: 0, color: "#f87171" },
];

function BarChartSection() {
  return (
    <ChartContainer config={barChartConfig} className="min-h-[260px] w-full">
      <BarChart data={barChartData} barGap={8} barCategoryGap={16} width={500} height={260}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <Bar dataKey="admissions" fill="var(--color-admissions)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="fees" fill="var(--color-fees)" radius={[6, 6, 0, 0]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
}

function LineChartSection() {
  return (
    <ChartContainer config={lineChartConfig} className="min-h-[260px] w-full">
      <LineChart data={lineChartData} width={500} height={260}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={10} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <Line
          type="monotone"
          dataKey="admissions"
          stroke="var(--color-admissions)"
          strokeWidth={3}
          dot={{ r: 6 }}
          activeDot={{ r: 8 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  );
}

function PieChartSection() {
  return (
    <ChartContainer config={{}} className="min-h-[260px] w-full flex items-center justify-center">
      <PieChart width={260} height={260}>
        <Pie
          data={pieChartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          paddingAngle={2}
        >
          {pieChartData.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.color} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent payload={pieChartData.map((d) => ({ value: d.name, color: d.color }))} />}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  );
}

export default function HomePage() {
  const { data: academicYears = [] } = useAcademicYears();
  const [selectedYear, setSelectedYear] = useState<number | "">("");

  React.useEffect(() => {
    if (academicYears.length > 0) {
      const current = academicYears.find((y) => y.isCurrentYear);
      setSelectedYear(current?.id ?? academicYears[0].id ?? "");
    }
  }, [academicYears]);

  return (
    <div className="min-h-screen bg-muted/50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Admissions & Fees Dashboard</h1>
            <p className="text-muted-foreground text-base">Metrics and trends for the selected academic year.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-muted-foreground mr-2">Academic Year:</span>
            <Select
              value={selectedYear ? selectedYear.toString() : ""}
              onValueChange={(val) => setSelectedYear(Number(val))}
            >
              <SelectTrigger className="w-40 bg-white border border-gray-300">
                <SelectValue placeholder="Select Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) =>
                  year.id !== undefined ? (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {getAcademicYearLabel(+year.year)}
                    </SelectItem>
                  ) : null,
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <Card key={card.label} className={`shadow-none border-0 ${card.bg} flex flex-row items-center gap-4 p-5`}>
              <div className="flex items-center justify-center rounded-full w-14 h-14 bg-white shadow-sm">
                {card.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className="text-sm text-muted-foreground font-medium mt-1">{card.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <Card className="rounded-xl shadow-sm bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="block w-2 h-6 rounded bg-purple-400" />
                <h2 className="text-lg font-semibold text-gray-900">Admissions vs Fees by Month</h2>
              </div>
              <BarChartSection />
            </Card>
            <Card className="rounded-xl shadow-sm bg-white p-6 flex flex-col items-center">
              <div className="mb-4 flex items-center gap-2">
                <span className="block w-2 h-6 rounded bg-purple-400" />
                <h2 className="text-lg font-semibold text-gray-900">Fee Status Distribution</h2>
              </div>
              <PieChartSection />
            </Card>
          </div>
          <div className="flex flex-col h-full justify-between">
            <Card className="rounded-xl shadow-sm bg-white p-6 flex-1 flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-2">
                <span className="block w-2 h-6 rounded bg-purple-400" />
                <h2 className="text-lg font-semibold text-gray-900">Multi-Year Admission Trend</h2>
              </div>
              <LineChartSection />
            </Card>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Admissions / Payments</h2>
          <Card className="rounded-xl shadow-sm bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                      <TableCell>{activity.name}</TableCell>
                      <TableCell>{activity.type}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${
                              activity.status === "Paid"
                                ? "bg-green-100 text-green-700"
                                : activity.status === "Unpaid"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {activity.status}
                        </span>
                      </TableCell>
                      <TableCell>{activity.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
