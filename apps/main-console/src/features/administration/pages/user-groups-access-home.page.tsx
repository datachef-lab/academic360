import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ShieldCheck, UserCog, CalendarCheck, Activity } from "lucide-react";

const statCards = [
  {
    title: "Total Users",
    value: "1,284",
    description: "Including staff, visiting faculty, and contractors",
    trend: "+24 this week",
    icon: Users,
    accent: "from-rose-50 to-white border-rose-100",
    iconColor: "text-rose-600",
    trendColor: "text-rose-600",
  },
  {
    title: "Active Staff",
    value: "946",
    description: "Checked-in today",
    trend: "92% attendance",
    icon: CalendarCheck,
    accent: "from-emerald-50 to-white border-emerald-100",
    iconColor: "text-emerald-600",
    trendColor: "text-emerald-600",
  },
  {
    title: "User Groups",
    value: "38",
    description: "Operational & governance groups",
    trend: "4 pending approvals",
    icon: UserCog,
    accent: "from-sky-50 to-white border-sky-100",
    iconColor: "text-sky-600",
    trendColor: "text-sky-600",
  },
  {
    title: "Critical Roles Filled",
    value: "87%",
    description: "Role coverage across departments",
    trend: "3 gaps detected",
    icon: ShieldCheck,
    accent: "from-purple-50 to-white border-purple-100",
    iconColor: "text-purple-600",
    trendColor: "text-orange-600",
  },
];

const directoryStats = [
  { label: "Departments", value: 24, delta: "+2 since July", badge: "bg-indigo-100 text-indigo-700" },
  { label: "Sub-Departments", value: 61, delta: "+6 new", badge: "bg-fuchsia-100 text-fuchsia-700" },
  { label: "Designations", value: 142, delta: "11 mapped to roles", badge: "bg-cyan-100 text-cyan-700" },
  { label: "Roles & Permissions", value: 54, delta: "5 pending review", badge: "bg-amber-100 text-amber-700" },
];

const groupBreakdown = [
  { name: "Academic Operations", type: "Academic", members: 214, active: 206, updated: "2h ago" },
  { name: "Finance & Accounts", type: "Administrative", members: 68, active: 65, updated: "Yesterday" },
  { name: "Exam Controllers", type: "Academic", members: 42, active: 39, updated: "4h ago" },
  { name: "Campus Infrastructure", type: "Support", members: 56, active: 52, updated: "Today" },
  { name: "Admission Committee", type: "Governance", members: 33, active: 31, updated: "3d ago" },
];

const attendanceSegments = [
  { label: "Academic Staff", percent: 91 },
  { label: "Administrative Staff", percent: 88 },
  { label: "Support Staff", percent: 79 },
];

const pendingRequests = [
  { name: "Mira Bose", request: "Add to Finance & Accounts", time: "5 min ago", priority: "High" },
  { name: "Arnab Dutta", request: "Role update: Exam Supervisor", time: "30 min ago", priority: "Medium" },
  { name: "New Library Volunteer Batch", request: "Create group & assign mentors", time: "1 hr ago", priority: "Low" },
];

const activityFeed = [
  {
    event: "User Group Updated",
    actor: "Priya Ghosh",
    detail: "Added 3 members to Academic Operations",
    time: "12 min ago",
  },
  {
    event: "Role Approved",
    actor: "Ravi Sen",
    detail: "Finance Reviewer role assigned to K. Banerjee",
    time: "45 min ago",
  },
  {
    event: "Attendance Alert",
    actor: "System",
    detail: "Support staff attendance dipped below 80%",
    time: "2 hrs ago",
  },
  { event: "New Group Created", actor: "Arunima Paul", detail: "Industry Connect Taskforce", time: "Yesterday" },
];

const attendanceDates = [
  { label: "Today (Thu, 20 Nov)", value: "2025-11-20" },
  { label: "Yesterday", value: "2025-11-19" },
  { label: "Last Monday", value: "2025-11-17" },
];

const attendanceByGroup: Record<string, Array<{ group: string; present: number; absent: number; total: number }>> = {
  "2025-11-20": [
    { group: "Academic Operations", present: 198, absent: 12, total: 210 },
    { group: "Finance & Accounts", present: 61, absent: 7, total: 68 },
    { group: "Exam Controllers", present: 39, absent: 3, total: 42 },
    { group: "Campus Infrastructure", present: 50, absent: 6, total: 56 },
  ],
  "2025-11-19": [
    { group: "Academic Operations", present: 194, absent: 16, total: 210 },
    { group: "Finance & Accounts", present: 64, absent: 4, total: 68 },
    { group: "Exam Controllers", present: 40, absent: 2, total: 42 },
    { group: "Campus Infrastructure", present: 48, absent: 8, total: 56 },
  ],
  "2025-11-17": [
    { group: "Academic Operations", present: 187, absent: 23, total: 210 },
    { group: "Finance & Accounts", present: 62, absent: 6, total: 68 },
    { group: "Exam Controllers", present: 38, absent: 4, total: 42 },
    { group: "Campus Infrastructure", present: 46, absent: 10, total: 56 },
  ],
};

const departmentAttendance = [
  { department: "Science & Research", present: 162, total: 180, color: "text-indigo-600" },
  { department: "Commerce & Finance", present: 134, total: 150, color: "text-emerald-600" },
  { department: "Humanities", present: 118, total: 140, color: "text-rose-600" },
  { department: "Administration", present: 92, total: 105, color: "text-sky-600" },
];

export default function UserGroupsAccessHomePage() {
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(attendanceDates[0]?.value ?? "");
  const attendanceRows = attendanceByGroup[selectedAttendanceDate] ?? [];

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Groups & Accesses Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor staffing coverage, user groups, and access requests at a glance.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`bg-gradient-to-br ${stat.accent} border shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                {stat.title}
              </CardTitle>
              <Badge variant="outline" className="text-xs text-slate-600 border-white/60 bg-white/60">
                MIS
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className={`text-xs font-medium mt-2 ${stat.trendColor}`}>{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Directory Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {directoryStats.map((item) => (
          <Card key={item.label} className="border-dashed border-2">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <div className="text-2xl font-bold text-slate-800">{item.value}</div>
                </div>
                <Badge className={item.badge}>{item.delta}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Group Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Group Composition</CardTitle>
            <CardDescription>Members and activity across major user groups.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2">Group</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Members</th>
                  <th className="py-2">Active</th>
                  <th className="py-2">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {groupBreakdown.map((group) => (
                  <tr key={group.name} className="border-b last:border-0">
                    <td className="py-3 font-medium">{group.name}</td>
                    <td className="py-3">
                      <Badge variant="secondary">{group.type}</Badge>
                    </td>
                    <td className="py-3">{group.members}</td>
                    <td className="py-3">
                      <span className="font-semibold text-emerald-600">{group.active}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">{group.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Attendance Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Snapshot</CardTitle>
            <CardDescription>Today's staff check-in compliance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceSegments.map((segment) => (
              <div key={segment.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{segment.label}</span>
                  <span>{segment.percent}%</span>
                </div>
                <Progress value={segment.percent} className="bg-purple-100 [&>div]:bg-purple-500" />
              </div>
            ))}
            <div className="rounded-md bg-purple-50 border border-purple-100 px-3 py-2 text-xs text-purple-700">
              Attendance dips below 80% trigger alerts to department heads automatically.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance by Group */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Attendance by User Group</CardTitle>
            <CardDescription>Snapshot of presence for the selected date.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Select Date:</span>
            <Select value={selectedAttendanceDate} onValueChange={setSelectedAttendanceDate}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Choose date" />
              </SelectTrigger>
              <SelectContent>
                {attendanceDates.map((date) => (
                  <SelectItem key={date.value} value={date.value}>
                    {date.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Group</th>
                <th className="py-2">Present</th>
                <th className="py-2">Absent</th>
                <th className="py-2">Total</th>
                <th className="py-2">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((row) => {
                const percent = Math.round((row.present / row.total) * 100);
                return (
                  <tr key={`${row.group}-${row.total}`} className="border-b last:border-0">
                    <td className="py-3 font-medium">{row.group}</td>
                    <td className="py-3 text-emerald-600 font-semibold">{row.present}</td>
                    <td className="py-3 text-rose-500 font-semibold">{row.absent}</td>
                    <td className="py-3">{row.total}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={percent} className="w-32 bg-slate-100 [&>div]:bg-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Access updates awaiting approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {pendingRequests.map((request) => (
                <div
                  key={request.name}
                  className="border rounded-md px-3 py-2 bg-white flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">{request.name}</p>
                    <p className="text-xs text-muted-foreground">{request.request}</p>
                    <p className="text-xs text-muted-foreground mt-1">{request.time}</p>
                  </div>
                  <Badge
                    variant={
                      request.priority === "High"
                        ? "destructive"
                        : request.priority === "Medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {request.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live feed of group and access updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.map((item) => (
                <div key={`${item.event}-${item.time}`} className="flex items-start gap-3">
                  <div className="mt-1">
                    <Activity className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.event}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actor} · {item.detail}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Departmental Attendance Pulse</CardTitle>
          <CardDescription>Shows presence vs sanctioned strength for top departments.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {departmentAttendance.map((dept) => {
            const percent = Math.round((dept.present / dept.total) * 100);
            return (
              <div key={dept.department} className="p-3 rounded-lg border bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-800">{dept.department}</p>
                  <span className={`text-xs font-semibold ${dept.color}`}>{percent}%</span>
                </div>
                <Progress value={percent} className="h-2 bg-slate-100 [&>div]:bg-slate-500" />
                <p className="text-xs text-muted-foreground mt-2">
                  {dept.present} present • {dept.total - dept.present} absent • {dept.total} total
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
