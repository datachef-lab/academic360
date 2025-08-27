"use client";

// import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart, Line, LineChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// 1. Area Chart: Admissions Over Time
const admissionsData: {
  date: string;
  ug: number;
  pg: number;
}[] = [
  //   { date: "2024-01", ug: 120, pg: 40 },
  //   { date: "2024-02", ug: 180, pg: 60 },
  //   { date: "2024-03", ug: 200, pg: 80 },
  //   { date: "2024-04", ug: 250, pg: 100 },
  //   { date: "2024-05", ug: 300, pg: 120 },
  //   { date: "2024-06", ug: 350, pg: 140 },
];
const admissionsConfig = {
  ug: { label: "UG Admissions", color: "var(--chart-1)" },
  pg: { label: "PG Admissions", color: "var(--chart-2)" },
} satisfies ChartConfig;
export function AdmissionsAreaChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admissions Over Time</CardTitle>
        <CardDescription>UG vs PG admissions (Jan-Jun 2024)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={admissionsConfig} className="h-[250px] w-full">
          <AreaChart data={admissionsData}>
            <defs>
              <linearGradient id="fillUG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillPG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="ug" type="monotone" fill="url(#fillUG)" stroke="var(--chart-1)" />
            <Area dataKey="pg" type="monotone" fill="url(#fillPG)" stroke="var(--chart-2)" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// 2. Bar Chart: Library Book Issues by Genre
const genreData: {
  genre: string;
  count: number;
}[] = [
  //   { genre: "Fiction", count: 320 },
  //   { genre: "Non-Fiction", count: 210 },
  //   { genre: "Science", count: 180 },
  //   { genre: "History", count: 140 },
  //   { genre: "Comics", count: 90 },
];
const genreConfig = {
  count: { label: "Books Issued", color: "var(--chart-1)" },
} satisfies ChartConfig;
export function LibraryGenreBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Library Book Issues</CardTitle>
        <CardDescription>By Genre (2024)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={genreConfig} className="h-[250px] w-full">
          <BarChart data={genreData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="genre" tickLine={false} axisLine={false} />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--chart-1)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// 3. Line Chart: Student Attendance Trend
const attendanceData: {
  week: string;
  present: number;
  absent: number;
}[] = [
  //   { week: "W1", present: 95, absent: 5 },
  //   { week: "W2", present: 92, absent: 8 },
  //   { week: "W3", present: 97, absent: 3 },
  //   { week: "W4", present: 93, absent: 7 },
  //   { week: "W5", present: 96, absent: 4 },
  //   { week: "W6", present: 94, absent: 6 },
];
const attendanceConfig = {
  present: { label: "Present (%)", color: "var(--chart-1)" },
  absent: { label: "Absent (%)", color: "var(--chart-2)" },
} satisfies ChartConfig;
export function AttendanceLineChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trend</CardTitle>
        <CardDescription>Weekly Attendance (Last 6 Weeks)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={attendanceConfig} className="h-[250px] w-full">
          <LineChart data={attendanceData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="present" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            <Line dataKey="absent" type="monotone" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// 4. Stacked Bar Chart: Event Participation
const eventData: {
  event: string;
  students: number;
  staff: number;
}[] = [
  //   { event: "Sports", students: 120, staff: 15 },
  //   { event: "Cultural", students: 90, staff: 10 },
  //   { event: "Tech Fest", students: 110, staff: 12 },
  //   { event: "Seminar", students: 80, staff: 8 },
];
const eventConfig = {
  students: { label: "Students", color: "var(--chart-1)" },
  staff: { label: "Staff", color: "var(--chart-2)" },
} satisfies ChartConfig;
export function EventParticipationStackedBar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Participation</CardTitle>
        <CardDescription>Students vs Staff (2024)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={eventConfig} className="h-[250px] w-full">
          <BarChart data={eventData}>
            <XAxis dataKey="event" tickLine={false} axisLine={false} />
            <Bar dataKey="students" stackId="a" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="staff" stackId="a" fill="var(--chart-2)" radius={[0, 0, 4, 4]} />
            <ChartTooltip content={<ChartTooltipContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Demo page export (optional)
export default function ChartsDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AdmissionsAreaChart />
      <LibraryGenreBarChart />
      <AttendanceLineChart />
      <EventParticipationStackedBar />
    </div>
  );
}
