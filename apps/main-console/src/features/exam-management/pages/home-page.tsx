import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Calendar,
  Users,
  Building2,
  DoorOpen,
  FileText,
  Clock,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Star,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { StatCard } from "./statcard";

// Dummy data for the dashboard
const examSummaryData = {
  totalExams: 24,
  upcomingExams: 8,
  completedExams: 16,
  totalStudents: 1245,
  totalRooms: 45,
  totalFloors: 5,
  averageStudentsPerExam: 52,
  examsThisMonth: 12,
};

// Exams scheduled over time (last 6 months)
const examsOverTimeData = [
  { month: "Jan", scheduled: 3, completed: 2 },
  { month: "Feb", scheduled: 4, completed: 3 },
  { month: "Mar", scheduled: 5, completed: 4 },
  { month: "Apr", scheduled: 6, completed: 5 },
  { month: "May", scheduled: 4, completed: 2 },
  { month: "Jun", scheduled: 2, completed: 0 },
];

const examsOverTimeConfig = {
  scheduled: { label: "Scheduled", color: "hsl(var(--chart-1))" },
  completed: { label: "Completed", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// Students assigned per exam
const studentsPerExamData = [
  { exam: "Mid-Term Exam", students: 145, date: "2024-06-15" },
  { exam: "Final Exam", students: 320, date: "2024-06-20" },
  { exam: "Quiz 1", students: 89, date: "2024-06-10" },
  { exam: "Assignment", students: 156, date: "2024-06-12" },
  { exam: "Practical", students: 67, date: "2024-06-18" },
  { exam: "Viva", students: 234, date: "2024-06-22" },
];

// Floor distribution
const floorDistributionData = [
  { floor: "Ground Floor", exams: 8, capacity: 450, usageCount: 45 },
  { floor: "1st Floor", exams: 6, capacity: 380, usageCount: 32 },
  { floor: "2nd Floor", exams: 5, capacity: 320, usageCount: 28 },
  { floor: "3rd Floor", exams: 4, capacity: 280, usageCount: 18 },
  { floor: "4th Floor", exams: 1, capacity: 150, usageCount: 5 },
];

// Find most used floor
const mostUsedFloor = floorDistributionData.reduce((prev, current) =>
  prev.usageCount > current.usageCount ? prev : current,
);

const floorConfig = {
  exams: { label: "Exams", color: "hsl(var(--chart-1))" },
  capacity: { label: "Capacity", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// Room type distribution
const roomTypeData = [
  { name: "Lecture Hall", value: 12, color: "#8884d8" },
  { name: "Lab", value: 8, color: "#82ca9d" },
  { name: "Seminar Room", value: 15, color: "#ffc658" },
  { name: "Conference Room", value: 5, color: "#ff7300" },
  { name: "Auditorium", value: 5, color: "#00ff00" },
];

// Exam type distribution
const examTypeData = [
  { type: "Mid-Term", count: 8, students: 420 },
  { type: "Final", count: 6, students: 680 },
  { type: "Quiz", count: 5, students: 245 },
  { type: "Practical", count: 3, students: 156 },
  { type: "Viva", count: 2, students: 98 },
];

const examTypeConfig = {
  count: { label: "Exams", color: "hsl(var(--chart-1))" },
  students: { label: "Students", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// Upcoming exams timeline
interface UpcomingExam {
  date: string;
  startTime: string;
  endTime: string;
  semester: number;
  name: string;
  students: number;
  rooms: number;
}
const today = new Date().toISOString().substring(0, 10);

const upcomingExamsData: UpcomingExam[] = [
  // 🔴 RECENT (Past - 4)
  {
    date: "2026-01-02",
    startTime: "09:00",
    endTime: "11:00",
    semester: 1,
    name: "Financial Accounting",
    students: 180,
    rooms: 4,
  },
  {
    date: "2026-01-03",
    startTime: "11:00",
    endTime: "13:00",
    semester: 2,
    name: "Business Organisation & Management",
    students: 165,
    rooms: 3,
  },
  {
    date: "2026-01-04",
    startTime: "14:00",
    endTime: "16:00",
    semester: 3,
    name: "Corporate Accounting",
    students: 210,
    rooms: 5,
  },
  {
    date: "2026-01-05",
    startTime: "10:00",
    endTime: "12:00",
    semester: 4,
    name: "Cost & Management Accounting",
    students: 190,
    rooms: 4,
  },

  // 🟡 TODAY (5)

  {
    date: today,
    startTime: "14:00",
    endTime: "16:00",
    semester: 2,
    name: "Business Mathematics",
    students: 185,
    rooms: 4,
  },
  {
    date: today,
    startTime: "16:30",
    endTime: "18:30",
    semester: 1,
    name: "Business Economics",
    students: 170,
    rooms: 3,
  },
  {
    date: today,
    startTime: "10:00",
    endTime: "12:00",
    semester: 3,
    name: "Company Law",
    students: 155,
    rooms: 3,
  },

  // 🟢 UPCOMING (Future - 3)
  {
    date: "2026-01-10",
    startTime: "09:30",
    endTime: "11:30",
    semester: 4,
    name: "Indirect Tax (GST)",
    students: 168,
    rooms: 3,
  },
  {
    date: "2026-01-12",
    startTime: "13:00",
    endTime: "15:00",
    semester: 5,
    name: "Banking & Insurance",
    students: 172,
    rooms: 4,
  },
  {
    date: "2026-01-15",
    startTime: "11:00",
    endTime: "13:00",
    semester: 6,
    name: "Financial Management",
    students: 160,
    rooms: 3,
  },
];

// const upcomingExamsData = [
//   { date: "2024-06-10", name: "Mathematics Mid-Term", students: 145, rooms: 3 },
//   { date: "2024-06-12", name: "Physics Quiz", students: 89, rooms: 2 },
//   { date: "2024-06-15", name: "Chemistry Final", students: 320, rooms: 5 },
//   { date: "2024-06-18", name: "Biology Practical", students: 67, rooms: 1 },
//   { date: "2024-06-20", name: "Computer Science Final", students: 234, rooms: 4 },
// ];

// Room utilization with usage frequency
const roomUtilizationData = [
  { room: "LH-101", capacity: 60, assigned: 58, utilization: 97, usageCount: 42, floor: "Ground Floor" },
  { room: "LH-102", capacity: 60, assigned: 45, utilization: 75, usageCount: 38, floor: "Ground Floor" },
  { room: "LAB-A", capacity: 40, assigned: 38, utilization: 95, usageCount: 35, floor: "1st Floor" },
  { room: "LAB-B", capacity: 40, assigned: 32, utilization: 80, usageCount: 28, floor: "1st Floor" },
  { room: "SR-201", capacity: 30, assigned: 28, utilization: 93, usageCount: 32, floor: "2nd Floor" },
  { room: "SR-202", capacity: 30, assigned: 25, utilization: 83, usageCount: 25, floor: "2nd Floor" },
  { room: "LH-201", capacity: 60, assigned: 55, utilization: 92, usageCount: 40, floor: "1st Floor" },
  { room: "AUD-301", capacity: 150, assigned: 145, utilization: 97, usageCount: 45, floor: "Ground Floor" },
];

// Find most used rooms (top 3)
const mostUsedRooms = [...roomUtilizationData].sort((a, b) => b.usageCount - a.usageCount).slice(0, 3);

const roomUtilizationConfig = {
  capacity: { label: "Capacity", color: "hsl(var(--chart-1))" },
  assigned: { label: "Assigned", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// Stat Card Component
// function StatCard({
//   icon,
//   title,
//   value,
//   description,
//   trend,
//   color,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   value: string | number;
//   description?: string;
//   trend?: { value: number; isPositive: boolean };
//   color?: string;
// }) {
//   return (
//     <Card className="relative overflow-hidden">
//       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//         <CardTitle className="text-sm font-medium">{title}</CardTitle>
//         <div className={`${color || "text-muted-foreground"}`}>{icon}</div>
//       </CardHeader>
//       <CardContent>
//         <div className="text-2xl font-bold">{value}</div>
//         {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
//         {trend && (
//           <div className={`flex items-center text-xs mt-2 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
//             <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && "rotate-180"}`} />
//             {Math.abs(trend.value)}% from last month
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

export default function HomePage() {
  const [examTab, setExamTab] = useState<"upcoming" | "today" | "recent">("today");

  const getFilteredExams = () => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    return upcomingExamsData.filter((exam) => {
      const examStart = new Date(`${exam.date}T${exam.startTime}`);
      const examEnd = new Date(`${exam.date}T${exam.endTime}`);

      if (examTab === "today") {
        return exam.date === todayStr;
      }

      if (examTab === "recent") {
        return examEnd < now;
      }

      // upcoming
      return examStart > now;
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Management Dashboard</h1>
          <p className="text-muted-foreground">Overview of exam schedules, students, and resources</p>
        </div>
      </div> */}

      {/* Summary Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          title="Total Exams"
          value={examSummaryData.totalExams}
          description="All scheduled exams"
          variant="blue"
        />

        {/* <StatCard
    icon={<Clock className="h-4 w-4" />}
    title="Upcoming Exams"
    value={examSummaryData.upcomingExams}
    description="Scheduled this month"
    variant="orange"
  /> */}

        <StatCard
          icon={<Users className="h-4 w-4" />}
          title="Total Students"
          value={examSummaryData.totalStudents.toLocaleString()}
          description={`Avg ${examSummaryData.averageStudentsPerExam} per exam`}
          variant="green"
        />

        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          title="Completed Exams"
          value={examSummaryData.completedExams}
          description="Successfully conducted"
          variant="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          title="Total Floors"
          value={examSummaryData.totalFloors}
          description="Active exam floors"
          variant="teal"
        />

        <StatCard
          icon={<DoorOpen className="h-4 w-4" />}
          title="Total Rooms"
          value={examSummaryData.totalRooms}
          description="Available exam rooms"
          variant="pink"
        />

        <StatCard
          icon={<FileText className="h-4 w-4" />}
          title="Exams This Month"
          value={examSummaryData.examsThisMonth}
          description="June 2024"
          variant="red"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Exams
              </CardTitle>
              <CardDescription>View today, upcoming and recent exams</CardDescription>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-full">
              {[
                { key: "upcoming", label: "Upcoming" },
                { key: "today", label: "Today" },
                { key: "recent", label: "Recent" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setExamTab(tab.key as "upcoming" | "today" | "recent")}
                  className={`px-4 py-1.5 text-sm rounded-full transition font-medium ${
                    examTab === tab.key ? "bg-white shadow text-indigo-700" : "text-muted-foreground hover:bg-white/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto ">
            <table className="w-full border border-gray-200">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="text-left p-3 font-medium text-sm">Date</th>
                  <th className="text-left p-3 font-medium text-sm">Time</th>
                  <th className="text-left p-3 font-medium text-sm">Exam Name</th>
                  <th className="text-center p-3 font-medium text-sm">Semester</th>
                  <th className="text-center p-3 font-medium text-sm">Students</th>
                  <th className="text-center p-3 font-medium text-sm">Rooms</th>
                  <th className="text-center p-3 font-medium text-sm">Status</th>
                </tr>
              </thead>

              <tbody>
                {getFilteredExams().length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-sm text-muted-foreground">
                      No exams found for this category
                    </td>
                  </tr>
                )}

                {getFilteredExams()
                  .sort((a, b) => {
                    const dateTimeA = new Date(`${a.date}T${a.startTime}`);
                    const dateTimeB = new Date(`${b.date}T${b.startTime}`);
                    return dateTimeA.getTime() - dateTimeB.getTime();
                  })
                  .map((exam, index) => {
                    const formattedDate = new Date(exam.date).toLocaleDateString("en-GB"); // dd/mm/yyyy
                    const timeRange = `${exam.startTime} - ${exam.endTime}`;

                    const semesterColors: Record<number, string> = {
                      1: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      2: "bg-pink-50 text-pink-700 border-pink-200",
                      3: "bg-yellow-50 text-yellow-700 border-yellow-200",
                      4: "bg-teal-50 text-teal-700 border-teal-200",
                      5: "bg-cyan-50 text-cyan-700 border-cyan-200",
                      6: "bg-rose-50 text-rose-700 border-rose-200",
                    };

                    const now = new Date();
                    const examStart = new Date(`${exam.date}T${exam.startTime}`);
                    const examEnd = new Date(`${exam.date}T${exam.endTime}`);

                    let status = "Upcoming";
                    let statusClass = "bg-blue-50 text-blue-700 border-blue-200";

                    if (now >= examStart && now <= examEnd) {
                      status = "Ongoing";
                      statusClass = "bg-green-50 text-green-700 border-green-200";
                    } else if (now > examEnd) {
                      status = "Completed";
                      statusClass = "bg-gray-50 text-gray-700 border-gray-200";
                    }

                    return (
                      <tr key={index} className="border-b ">
                        {/* Date */}
                        <td className="p-3 text-sm font-medium">{formattedDate}</td>

                        {/* Time */}
                        <td className="p-3 text-sm">{timeRange}</td>

                        {/* Exam Name */}
                        <td className="p-3 text-sm font-medium">{exam.name}</td>

                        {/* Semester */}
                        <td className="p-3 text-sm text-center">
                          <Badge
                            variant="outline"
                            className={semesterColors[exam.semester] || "bg-gray-50 text-gray-700 border-gray-200"}
                          >
                            Semester {exam.semester}
                          </Badge>
                        </td>

                        {/* Students */}
                        <td className="p-3 text-sm text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {exam.students}
                          </Badge>
                        </td>

                        {/* Rooms */}
                        <td className="p-3 text-sm text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {exam.rooms}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={statusClass}>
                            {status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Main Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Exams Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Exams Scheduled Over Time</CardTitle>
            <CardDescription>Monthly breakdown of scheduled vs completed exams</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={examsOverTimeConfig} className="h-[300px] w-full">
              <AreaChart data={examsOverTimeData}>
                <defs>
                  <linearGradient id="fillScheduled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="scheduled"
                  type="monotone"
                  fill="url(#fillScheduled)"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                />
                <Area
                  dataKey="completed"
                  type="monotone"
                  fill="url(#fillCompleted)"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Students Per Exam */}
        <Card>
          <CardHeader>
            <CardTitle>Students Assigned Per Exam</CardTitle>
            <CardDescription>Number of students for each scheduled exam</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ students: { label: "Students", color: "hsl(var(--chart-1))" } }}
              className="h-[300px] w-full"
            >
              <BarChart data={studentsPerExamData} layout="vertical">
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="exam" type="category" width={120} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="students" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Floor Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Floor Distribution</span>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-300 flex items-center gap-1"
              >
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Most Used: {mostUsedFloor.floor}
              </Badge>
            </CardTitle>
            <CardDescription>Exams and capacity by floor</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={floorConfig} className="h-[300px] w-full">
              <BarChart data={floorDistributionData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="floor" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="exams" radius={[4, 4, 0, 0]}>
                  {floorDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-exams-${index}`}
                      fill={entry.floor === mostUsedFloor.floor ? "#fbbf24" : "hsl(var(--chart-1))"}
                    />
                  ))}
                </Bar>
                <Bar dataKey="capacity" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Most Used Floor:</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  {mostUsedFloor.floor} ({mostUsedFloor.usageCount} times)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Room Type Distribution</CardTitle>
            <CardDescription>Distribution of exam rooms by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Rooms", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px] w-full"
            >
              <PieChart>
                <Pie
                  data={roomTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Exam Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Type Distribution</CardTitle>
            <CardDescription>Breakdown by exam type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={examTypeConfig} className="h-[300px] w-full">
              <BarChart data={examTypeData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="type" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="students" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Room Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Room Utilization</span>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-300 flex items-center gap-1"
              >
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Top Used: {mostUsedRooms[0]?.room}
              </Badge>
            </CardTitle>
            <CardDescription>Capacity vs assigned students</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={roomUtilizationConfig} className="h-[300px] w-full">
              <BarChart data={roomUtilizationData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="room" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number | string, name: string, props: { payload?: { usageCount?: number } }) => {
                    if (name === "assigned" && props.payload?.usageCount !== undefined) {
                      return [`${value} (Used ${props.payload.usageCount} times)`, "Assigned"];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
                  {roomUtilizationData.map((entry, index) => (
                    <Cell
                      key={`cell-capacity-${index}`}
                      fill={mostUsedRooms.some((r) => r.room === entry.room) ? "#fbbf24" : "hsl(var(--chart-1))"}
                    />
                  ))}
                </Bar>
                <Bar dataKey="assigned" radius={[4, 4, 0, 0]}>
                  {roomUtilizationData.map((entry, index) => (
                    <Cell
                      key={`cell-assigned-${index}`}
                      fill={mostUsedRooms.some((r) => r.room === entry.room) ? "#f59e0b" : "hsl(var(--chart-2))"}
                    />
                  ))}
                </Bar>
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Most Used Rooms:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mostUsedRooms.map((room, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`${index === 0 ? "bg-yellow-50 text-yellow-700 border-yellow-300" : "bg-orange-50 text-orange-700 border-orange-300"} flex items-center gap-1`}
                    >
                      {index === 0 && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                      {room.room} ({room.usageCount} times)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams Table */}
      {/* Scheduled Exams Table */}

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Exam Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {examTypeData.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{type.type}</span>
                  <Badge variant="outline">{type.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Floor Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {floorDistributionData
                .sort((a, b) => b.usageCount - a.usageCount)
                .map((floor, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      floor.floor === mostUsedFloor.floor ? "bg-yellow-50 border border-yellow-200" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {floor.floor === mostUsedFloor.floor && (
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                      <span className={`text-sm ${floor.floor === mostUsedFloor.floor ? "font-semibold" : ""}`}>
                        {floor.floor}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {floor.floor === mostUsedFloor.floor && (
                        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                          Most Used
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {floor.exams} exams
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-muted">
                        {floor.capacity} seats
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {floor.usageCount}x
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Top Exams by Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentsPerExamData
                .sort((a, b) => b.students - a.students)
                .slice(0, 5)
                .map((exam, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1">{exam.exam}</span>
                    <Badge variant="outline" className="ml-2">
                      {exam.students}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Used Rooms Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Most Frequently Used Rooms
            </CardTitle>
            <CardDescription>Rooms with highest usage frequency for exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mostUsedRooms.map((room, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0
                      ? "bg-yellow-50 border-yellow-300"
                      : index === 1
                        ? "bg-orange-50 border-orange-300"
                        : "bg-blue-50 border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                      <span className={`font-semibold ${index === 0 ? "text-yellow-900" : ""}`}>{room.room}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        index === 0
                          ? "bg-yellow-100 text-yellow-800 border-yellow-400"
                          : index === 1
                            ? "bg-orange-100 text-orange-800 border-orange-400"
                            : "bg-blue-100 text-blue-800 border-blue-400"
                      }
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usage Count:</span>
                      <span className="font-medium">{room.usageCount} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Floor:</span>
                      <span className="font-medium">{room.floor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilization:</span>
                      <span className="font-medium">{room.utilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{room.capacity} seats</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
