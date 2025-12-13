import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  Star,
  BookOpen,
  Bell,
  PlusCircle,
  ArrowRight,
  CheckCircle,
  Boxes,
} from "lucide-react";
import {
  AdmissionsAreaChart,
  LibraryGenreBarChart,
  AttendanceLineChart,
  EventParticipationStackedBar,
} from "../components/charts-demo";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { FaRupeeSign } from "react-icons/fa";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
// import { ChartBarStacked } from './ChartBarStacked';

// Mock academic years and summary data for UI demo
// const academicYears: number[] = [];
const mockSummary = {
  admissions: { total: 0, approved: 0, rejected: 0 },
  students: { total: 0, new: 0, active: 0, suspended: 0, graduated: 0 },
  courses: { total: 0, subjects: 0 },
  batches: { total: 0, active: 0 },
  exams: {
    upcoming: 0,
    conducted: 20,
    recent: [
      { name: "", date: "" },
      // { name: 'BSC Exam', date: '' },
      // { name: 'BBA Exam', date: '' },
    ],
  },
  fees: { collected: 0, due: 0 },
  library: { books: 0, issued: 0, overdue: 0 },
  attendance: { average: 0 },
  notices: [
    // { title: "Exam schedule updated", date: "2025-03-01" },
    // { title: "Library closed on Friday", date: "2025-02-28" },
    // { title: "Admissions open for 2025", date: "2025-02-20" },
  ],
  events: [
    // { title: "Annual Sports Day", date: "2025-04-15" },
    // { title: "Cultural Fest", date: "2025-05-10" },
  ],
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className={`flex flex-row items-center gap-4 p-4 shadow-md border-l-8 ${color}`}>
      <div className="bg-white rounded-full p-2 shadow text-2xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-gray-500 text-sm font-medium">{label}</div>
      </div>
    </Card>
  );
}

function QuickActions({ actions }: { actions: { label: string; icon: React.ReactNode; onClick?: () => void }[] }) {
  return (
    <Card className="p-4">
      <CardTitle className="mb-2 text-base font-semibold flex items-center gap-2">
        <PlusCircle className="w-4 h-4" /> Quick Actions
      </CardTitle>
      <div className="flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <button
            key={i}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm transition"
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function RecentActivity({
  items,
  icon,
  title,
}: {
  items: { title: string; date?: string }[];
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Card className="p-4">
      <CardTitle className="mb-2 text-base font-semibold flex items-center gap-2">
        {icon} {title}
      </CardTitle>
      <ul className="text-gray-700 list-disc pl-5 text-sm">
        {items.map((n, i) => (
          <li key={i}>
            {n.title} {n.date && <span className="text-xs text-gray-400">({n.date})</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Dashboard() {
  useRestrictTempUsers();
  const [tab, setTab] = useState("overview");
  //   const [year, setYear] = useState(academicYears[0]);
  // In real app, fetch summary data for selected year
  const summary = mockSummary;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-0 border-none overflow-scroll">
      <div className="max-w-7xl mx-auto px-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full border-none">
          {/* Sticky Header Row: Tabs and Academic Year Selector */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-none sticky top-0 z-30 bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-3 shadow"
            style={{ minHeight: 64 }}
          >
            <div className="w-full sm:w-auto overflow-x-auto sm:overflow-x-visible -mx-4 sm:mx-0 px-4 sm:px-0">
              <TabsList className="flex gap-4 sm:gap-8 bg-transparent shadow-none border-none p-0 min-w-max">
                <TabButton value="overview" label="Overview" tab={tab} />
                <TabButton value="academics" label="Academics" tab={tab} />
                <TabButton value="admissions" label="Admissions" tab={tab} />
                <TabButton value="fees" label="Fees" tab={tab} />
                <TabButton value="library" label="Library" tab={tab} />
                <TabButton value="events" label="Events" tab={tab} />
              </TabsList>
            </div>
            {/* <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-gray-700 font-medium text-sm sm:text-base whitespace-nowrap">Academic Year:</span>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-32 sm:w-36">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}-{y + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
          </div>
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-stretch">
              {/* Left Column */}
              <div className="flex flex-col gap-6 h-full">
                {/* Quick Stats */}
                <Card className="rounded-2xl shadow-lg p-0 h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" /> Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <StatBox
                        color="bg-blue-600"
                        icon={<Users className="w-7 h-7 text-white" />}
                        value="0"
                        label="Total Students"
                      />
                      <StatBox
                        color="bg-orange-500"
                        icon={<BookOpen className="w-7 h-7 text-white" />}
                        value="0"
                        label="Courses & Subjects Design"
                      />
                      <StatBox
                        color="bg-green-600"
                        icon={<Boxes className="w-7 h-7 text-white" />}
                        value="0"
                        label="Active Batches"
                      />
                      <StatBox
                        color="bg-pink-500"
                        icon={<CheckCircle className="w-7 h-7 text-white" />}
                        value="0"
                        label="Avg Attendance"
                      />
                      <StatBox
                        color="bg-purple-600"
                        icon={<FileText className="w-7 h-7 text-white" />}
                        value="0"
                        label="Exams Conducted"
                      />
                      <StatBox
                        color="bg-yellow-500"
                        icon={<FaRupeeSign className="w-7 h-7 text-white" />}
                        value="0"
                        label="Fees Collected"
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* Live Student Summary */}
                <Card className="rounded-2xl shadow-lg flex flex-col p-0 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" /> Live Student Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col md:flex-row items-center gap-4 pt-0">
                    <div className="flex-1 flex flex-col gap-2 justify-center">
                      <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
                        0 <span className="font-normal text-gray-700 text-base">Active</span>
                      </div>
                      <div className="flex items-center gap-2 text-lg text-yellow-600">
                        0 <span className="font-normal text-gray-700 text-sm">Suspended</span>
                      </div>
                      <div className="flex items-center gap-2 text-lg text-gray-500">
                        0 <span className="font-normal text-gray-700 text-sm">Inactive</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      {/* Donut Chart */}
                      <StudentDonutChart />
                    </div>
                  </CardContent>
                </Card>
                {/* Attendance Snapshot */}
                <Card className="rounded-2xl shadow-lg p-0 h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500" /> Attendance Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <AttendanceYearBarChart />
                  </CardContent>
                </Card>
              </div>
              {/* Right Column */}
              <div className="flex flex-col gap-6 h-full">
                {/* Notice Board */}
                <Card className="rounded-2xl shadow-lg p-0 h-[50vh] flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-500" /> Notice Board
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-2 items-center justify-center pt-0 overflow-y-auto">
                    {/* <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3">
                      <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="w-3 h-3 bg-red-400 rounded-full" />
                      </span>
                      <div>
                        <div className="font-semibold text-gray-900">Circular 01</div>
                        <div className="text-xs text-gray-600">Holiday declared on 01 Nov 2023</div>
                        <div className="text-xs text-gray-400">2 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3">
                      <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="w-3 h-3 bg-green-400 rounded-full" />
                      </span>
                      <div>
                        <div className="font-semibold text-gray-900">Circular 02</div>
                        <div className="text-xs text-gray-600">New Academic Calendar Announced</div>
                        <div className="text-xs text-gray-400">3 days ago</div>
                      </div>
                    </div> */}

                    <p>No Content!</p>
                  </CardContent>
                </Card>
                {/* Recent Activities */}
                <Card className="rounded-2xl shadow-lg p-0 h-[50vh] flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" /> Recent Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col items-center justify-center pt-0 overflow-y-auto">
                    {/* <ul className="text-gray-800 text-sm flex flex-col gap-2">
                      <li>
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 align-middle" />
                        Course 01 updated <span className="text-xs text-gray-400 ml-2">2 d</span>
                        <div className="text-xs text-gray-400 ml-6">on 24 Oct 2025</div>
                      </li>
                      <li>
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 align-middle" />
                        Exam 01 conducted <span className="text-xs text-gray-400 ml-2">6 d</span>
                        <div className="text-xs text-gray-400 ml-6">for Batch 02 on 31 Oct 26</div>
                      </li>
                      <li>
                        <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2 align-middle" />
                        Subject 02 curriculum updated <span className="text-xs text-gray-400 ml-2">9 d</span>
                        <div className="text-xs text-gray-400 ml-6">for Batch 01</div>
                      </li>
                      <li>
                        <span className="inline-block w-2 h-2 bg-pink-500 rounded-full mr-2 align-middle" />
                        Admission 03 completed <span className="text-xs text-gray-400 ml-2">18 d</span>
                        <div className="text-xs text-gray-400 ml-6">on 13 Oct 2023</div>
                      </li>
                    </ul> */}
                    <p>No Content!</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          {/* Academics Tab */}
          <TabsContent value="academics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard
                icon={<Users className="text-blue-600" />}
                label="Courses"
                value={summary.courses.total}
                color="border-blue-500"
              />
              <StatCard
                icon={<BookOpen className="text-purple-600" />}
                label="Subjects"
                value={summary.courses.subjects}
                color="border-purple-500"
              />
              <StatCard
                icon={<Calendar className="text-orange-600" />}
                label="Batches"
                value={summary.batches.total}
                color="border-orange-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <LibraryGenreBarChart />
              <Card className="p-4 flex flex-col justify-between">
                <CardTitle className="mb-2 text-base font-semibold flex items-center gap-2">
                  <Calendar /> Recent Exams
                </CardTitle>
                <ul className="text-gray-700 list-disc pl-5 text-sm">
                  {summary.exams.recent.map((e, i) => (
                    <li key={i}>
                      {e.name} <span className="text-xs text-gray-400">({e.date})</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AttendanceLineChart />
              <QuickActions
                actions={[
                  { label: "Add Course", icon: <Users size={16} /> },
                  { label: "Add Subject", icon: <BookOpen size={16} /> },
                  { label: "Create Batch", icon: <Calendar size={16} /> },
                ]}
              />
            </div>
          </TabsContent>
          {/* Admissions Tab */}
          <TabsContent value="admissions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard
                icon={<FileText className="text-green-600" />}
                label="Total Applications"
                value={summary.admissions.total}
                color="border-green-500"
              />
              <StatCard
                icon={<Star className="text-blue-600" />}
                label="Approved"
                value={summary.admissions.approved}
                color="border-blue-500"
              />
              <StatCard
                icon={<Star className="text-red-600" />}
                label="Rejected"
                value={summary.admissions.rejected}
                color="border-red-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <AdmissionsAreaChart />
              <EventParticipationStackedBar />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RecentActivity
                items={
                  [
                    // { title: "John Doe - BSc" }, { title: "Jane Smith - BA" }
                  ]
                }
                icon={<FileText />}
                title="Recent Applications"
              />
              <QuickActions
                actions={[
                  { label: "New Application", icon: <FileText size={16} /> },
                  { label: "Approve", icon: <Star size={16} /> },
                  { label: "Reject", icon: <Star size={16} /> },
                ]}
              />
            </div>
          </TabsContent>
          {/* Fees Tab */}
          <TabsContent value="fees">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <StatCard
                icon={<DollarSign className="text-yellow-600" />}
                label="Total Collected"
                value={`₹${summary.fees.collected.toLocaleString()}`}
                color="border-yellow-500"
              />
              <StatCard
                icon={<DollarSign className="text-red-600" />}
                label="Total Due"
                value={`₹${summary.fees.due.toLocaleString()}`}
                color="border-red-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <EventParticipationStackedBar />
              <RecentActivity
                items={
                  [
                    // { title: "₹10,000 - John Doe" }, { title: "₹8,000 - Jane Smith" }
                  ]
                }
                icon={<DollarSign />}
                title="Recent Payments"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActions
                actions={[
                  { label: "Collect Fees", icon: <DollarSign size={16} /> },
                  { label: "Send Reminder", icon: <Bell size={16} /> },
                ]}
              />
            </div>
          </TabsContent>
          {/* Library Tab */}
          <TabsContent value="library">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <StatCard
                icon={<BookOpen className="text-purple-600" />}
                label="Books"
                value={summary.library.books}
                color="border-purple-500"
              />
              <StatCard
                icon={<BookOpen className="text-green-600" />}
                label="Issued"
                value={summary.library.issued}
                color="border-green-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <LibraryGenreBarChart />
              <RecentActivity
                items={
                  [
                    //   { title: 'Issued: "Modern Physics" to John Doe' },
                    //   { title: 'Returned: "Calculus" by Jane Smith' },
                  ]
                }
                icon={<BookOpen />}
                title="Recent Activity"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActions
                actions={[
                  { label: "Add Book", icon: <BookOpen size={16} /> },
                  { label: "Issue Book", icon: <ArrowRight size={16} /> },
                ]}
              />
            </div>
          </TabsContent>
          {/* Events Tab */}
          <TabsContent value="events">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <StatCard
                icon={<Calendar className="text-blue-600" />}
                label="Upcoming"
                value={summary.exams.upcoming}
                color="border-blue-500"
              />
              <StatCard
                icon={<Calendar className="text-green-600" />}
                label="Past"
                value={summary.exams.conducted}
                color="border-green-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <EventParticipationStackedBar />
              <RecentActivity
                items={
                  // summary.events
                  []
                }
                icon={<Calendar />}
                title="Upcoming Events"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RecentActivity
                items={
                  [
                    // { title: "Cultural Fest (2025-03-10)" }
                  ]
                }
                icon={<Calendar />}
                title="Recent Events"
              />
              <QuickActions
                actions={[
                  { label: "Add Event", icon: <Calendar size={16} /> },
                  { label: "Send Notification", icon: <Bell size={16} /> },
                ]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TabButton({ value, label, tab }: { value: string; label: string; tab: string }) {
  return (
    <TabsTrigger
      value={value}
      className={`
        px-2 pb-2 text-base font-medium border-b-2 transition
        ${tab === value ? "text-primary border-primary" : "text-gray-700 border-transparent hover:text-primary"}
      `}
      style={{ background: "none", borderRadius: 0 }}
    >
      {label}
    </TabsTrigger>
  );
}

const donutData = [
  { name: "Active", value: 0, color: "#22c55e" },
  { name: "Suspended", value: 0, color: "#facc15" },
  { name: "Inactive", value: 0, color: "#a3a3a3" },
];
function StudentDonutChart() {
  return (
    <ResponsiveContainer width={140} height={140}>
      <PieChart>
        <Pie
          data={donutData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={65}
          fill="#8884d8"
          paddingAngle={2}
          startAngle={90}
          endAngle={-270}
        >
          {donutData.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.color} />
          ))}
        </Pie>
        {/* Center label */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="28"
          fontWeight="bold"
          fill="#22c55e"
        >
          0
        </text>
        <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#888">
          Active
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

function StatBox({
  color,
  icon,
  value,
  label,
}: {
  color: string;
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      className={`rounded-xl p-4 flex flex-col items-center justify-center shadow ${color}`}
      style={{ minWidth: 90 }}
    >
      <div className="mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/80 text-center leading-tight font-semibold">{label}</div>
    </div>
  );
}

// AttendanceYearBarChart: Attendance by year, each bar a different color
const attendanceYearData = [
  { year: "", attendance: 0 },
  //   { year: "2022", attendance: 85 },
  //   { year: "2023", attendance: 88 },
  //   { year: "2024", attendance: 90 },
  //   { year: "2025", attendance: 87 },
];
const attendanceBarColors = ["#3b82f6", "#22c55e", "#f59e42", "#a855f7", "#facc15"];
function AttendanceYearBarChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={attendanceYearData}>
        <XAxis dataKey="year" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="attendance">
          {attendanceYearData.map((_, idx) => (
            <Cell key={`cell-${idx}`} fill={attendanceBarColors[idx % attendanceBarColors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
