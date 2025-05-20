import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Trophy,
  Wallet,
  Calendar,
  Bookmark,
  Phone,
  Mail,
  MessageSquare,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function OverviewTab() {
  return (
    <div className="space-y-8 p-2 ">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-950/40 dark:to-indigo-900/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-violet-800 dark:text-violet-300 mb-1">Overall Performance</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-bold text-violet-900 dark:text-violet-200">65%</h2>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-violet-300 text-violet-800 dark:bg-violet-800 dark:text-violet-100"
                  >
                    Very Good
                  </Badge>
                </div>
              </div>
              <div className="bg-violet-300 dark:bg-violet-800/60 p-2 rounded-full shadow-sm">
                <Trophy className="h-5 w-5 text-violet-800 dark:text-violet-300" />
              </div>
            </div>
            <p className="text-xs text-violet-700 dark:text-violet-400 mt-4">Rank: 15 out of 120 students</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-950/40 dark:to-teal-900/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">Attendance Rate</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-bold text-emerald-900 dark:text-emerald-200">73%</h2>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-emerald-300 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100"
                  >
                    Good
                  </Badge>
                </div>
              </div>
              <div className="bg-emerald-300 dark:bg-emerald-800/60 p-2 rounded-full shadow-sm">
                <Calendar className="h-5 w-5 text-emerald-800 dark:text-emerald-300" />
              </div>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-4">Last Present: June 15, 2024</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-950/40 dark:to-rose-900/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-pink-800 dark:text-pink-300 mb-1">Fee Status</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-bold text-pink-900 dark:text-pink-200">75%</h2>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-pink-300 text-pink-800 dark:bg-pink-800 dark:text-pink-100"
                  >
                    Paid
                  </Badge>
                </div>
              </div>
              <div className="bg-pink-300 dark:bg-pink-800/60 p-2 rounded-full shadow-sm">
                <Wallet className="h-5 w-5 text-pink-800 dark:text-pink-300" />
              </div>
            </div>
            <p className="text-xs text-pink-700 dark:text-pink-400 mt-4">Due Date: July 30, 2024</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-950/40 dark:to-orange-900/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Year Status</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-200">2025</h2>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-amber-300 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                  >
                    Graduating
                  </Badge>
                </div>
              </div>
              <div className="bg-amber-300 dark:bg-amber-800/60 p-2 rounded-full shadow-sm">
                <Bookmark className="h-5 w-5 text-amber-800 dark:text-amber-300" />
              </div>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-4">Last Passed Year: 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Semester Summary Table */}
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between bg-gradient-to-r from-fuchsia-100 to-purple-200 dark:from-fuchsia-950/40 dark:to-purple-900/30">
              <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-200">
                Semester Summary
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs flex items-center gap-1 text-purple-700 hover:text-purple-800 hover:bg-purple-100/60 dark:text-purple-300 dark:hover:bg-purple-900/30"
              >
                View Details <ChevronRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 bg-white/80 dark:bg-gray-950/80">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-purple-50 dark:bg-purple-950/30">
                      <th className="text-left font-medium p-2 text-purple-800 dark:text-purple-300">Semester</th>
                      <th className="text-left font-medium p-2 text-purple-800 dark:text-purple-300">GPA</th>
                      <th className="text-left font-medium p-2 text-purple-800 dark:text-purple-300">Credits</th>
                      <th className="text-left font-medium p-2 text-purple-800 dark:text-purple-300">Status</th>
                      <th className="text-left font-medium p-2 text-purple-800 dark:text-purple-300">Backlogs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-purple-100 dark:border-purple-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 8</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"
                          >
                            Current
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">3.8/4.0</td>
                      <td className="p-2">24/24</td>
                      <td className="p-2">
                        <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200 hover:bg-emerald-300/70 shadow-sm">
                          In Progress
                        </Badge>
                      </td>
                      <td className="p-2">0</td>
                    </tr>
                    <tr className="border-b border-purple-100 dark:border-purple-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 7</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Completed
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">3.5/4.0</td>
                      <td className="p-2">22/24</td>
                      <td className="p-2">
                        <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200 hover:bg-emerald-300/70 shadow-sm">
                          Completed
                        </Badge>
                      </td>
                      <td className="p-2">0</td>
                    </tr>
                    <tr className="border-b border-purple-100 dark:border-purple-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 6</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                          >
                            Reappearing
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">2.8/4.0</td>
                      <td className="p-2">18/24</td>
                      <td className="p-2">
                        <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-800/60 dark:text-amber-200 hover:bg-amber-300/70 shadow-sm">
                          Reappearing
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <span>2</span>
                          <button className="text-xs underline text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-purple-100 dark:border-purple-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 5</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-red-200 text-red-700 dark:border-red-800 dark:text-red-300"
                          >
                            Backlog
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">2.5/4.0</td>
                      <td className="p-2">16/24</td>
                      <td className="p-2">
                        <Badge className="bg-red-200 text-red-800 dark:bg-red-800/60 dark:text-red-200 hover:bg-red-300/70 shadow-sm">
                          Backlog
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <span>3</span>
                          <button className="text-xs underline text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-purple-100 dark:border-purple-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 4</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Completed
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">3.2/4.0</td>
                      <td className="p-2">20/24</td>
                      <td className="p-2">
                        <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200 hover:bg-emerald-300/70 shadow-sm">
                          Completed
                        </Badge>
                      </td>
                      <td className="p-2">0</td>
                    </tr>
                    <tr className="border-b border-purple-100 dark:border-purple-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 3</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Completed
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">3.4/4.0</td>
                      <td className="p-2">21/24</td>
                      <td className="p-2">
                        <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200 hover:bg-emerald-300/70 shadow-sm">
                          Completed
                        </Badge>
                      </td>
                      <td className="p-2">0</td>
                    </tr>
                    <tr className="border-b border-purple-100 dark:border-purple-900/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 2</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Completed
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">3.6/4.0</td>
                      <td className="p-2">23/24</td>
                      <td className="p-2">
                        <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200 hover:bg-emerald-300/70 shadow-sm">
                          Completed
                        </Badge>
                      </td>
                      <td className="p-2">0</td>
                    </tr>
                    <tr className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Semester 1</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Completed
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-purple-900 dark:text-purple-200">3.7/4.0</td>
                      <td className="p-2">24/24</td>
                      <td className="p-2">
                        <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200 hover:bg-emerald-300/70 shadow-sm">
                          Completed
                        </Badge>
                      </td>
                      <td className="p-2">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Backlogs Summary */}
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-md p-3 mt-4 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-800/40 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                  <h4 className="text-sm font-medium text-orange-900 dark:text-orange-200">Backlog Summary</h4>
                </div>
                <div className="text-xs text-orange-800 dark:text-orange-300 space-y-1">
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                      <span className="font-medium">MATH201: Advanced Calculus</span> - Required to retake next semester
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                      <span className="font-medium">PHYS101: Mechanics</span> - Submit assignments by August 5, 2024
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                      <span className="font-medium">COMP202: Data Structures</span> - Pending supplementary exam
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Custom Attendance Design */}
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between bg-gradient-to-r from-sky-100 to-blue-200 dark:from-sky-950/40 dark:to-blue-900/30">
              <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                Monthly Attendance
              </CardTitle>
              <Badge
                variant="outline"
                className="font-normal border-blue-300 text-blue-800 dark:border-blue-700 dark:text-blue-300"
              >
                Semester 2024
              </Badge>
            </CardHeader>
            <CardContent className="p-6 bg-white/80 dark:bg-gray-950/80">
              <div className="space-y-6">
                {/* Monthly Attendance Bars */}
                <div className="grid grid-cols-6 gap-2">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => {
                    const percentages = [85, 76, 92, 68, 45, 73];
                    const colorClasses = [
                      "bg-gradient-to-t from-emerald-500 to-emerald-400",
                      "bg-gradient-to-t from-blue-500 to-blue-400",
                      "bg-gradient-to-t from-violet-500 to-violet-400",
                      "bg-gradient-to-t from-yellow-500 to-yellow-400",
                      "bg-gradient-to-t from-red-500 to-red-400",
                      "bg-gradient-to-t from-teal-500 to-teal-400",
                    ];

                    return (
                      <div key={month} className="flex flex-col items-center">
                        <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-md mb-2 shadow-inner">
                          <div
                            className={`absolute bottom-0 w-full rounded-md shadow-sm ${colorClasses[index]}`}
                            style={{ height: `${percentages[index]}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-blue-900 dark:text-blue-200">{month}</span>
                        <span className="text-xs text-blue-700 dark:text-blue-400">{percentages[index]}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 bg-blue-50 p-3 rounded-md dark:bg-blue-950/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-blue-800 dark:text-blue-300">Present (140 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs text-blue-800 dark:text-blue-300">Absent (18 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-blue-800 dark:text-blue-300">Late (7 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-800 dark:text-blue-300">On Leave (5 days)</span>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border-t border-blue-100 dark:border-blue-900/30 pt-4">
                  <h4 className="text-sm font-medium mb-3 text-blue-900 dark:text-blue-200">Recent Activity</h4>
                  <div className="space-y-2">
                    {[
                      { date: "Jun 18", status: "present", class: "Physics Lab" },
                      { date: "Jun 17", status: "present", class: "Mathematics" },
                      { date: "Jun 16", status: "late", class: "Computer Science" },
                      { date: "Jun 15", status: "absent", class: "Chemistry" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1 border-b border-dashed border-blue-100 dark:border-blue-900/30 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {item.status === "present" && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          {item.status === "absent" && (
                            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          )}
                          {item.status === "late" && (
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className="text-blue-800 dark:text-blue-300">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-800 dark:text-blue-300">{item.class}</span>
                          <Badge
                            variant="outline"
                            className={`
                            text-xs capitalize shadow-sm
                            ${item.status === "present" ? "text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-300" : ""}
                            ${item.status === "absent" ? "text-red-700 bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-800/40 dark:text-red-300" : ""}
                            ${item.status === "late" ? "text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-300" : ""}
                          `}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Enhanced Fee Details Card */}
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Fee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-3">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Fee</span>
                  <span className="text-sm font-bold">₹8,00,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount Paid</span>
                  <span className="text-sm font-bold text-emerald-600">₹6,00,000</span>
                </div>

                {/* Balance Due with Prominent Styling */}
                <div className="bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/30 p-3 rounded-md">
                  <div className="flex items-center justify-between text-red-800 dark:text-red-300">
                    <span className="text-sm font-semibold">Balance Due</span>
                    <span className="text-sm font-bold">₹2,00,000</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Due by July 30, 2024</p>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Installments</span>
                    <span className="font-semibold">5 of 8</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-muted-foreground mb-1">Last Payment</span>
                    <span className="font-semibold">Jan 23, 2025</span>
                  </div>
                </div>

                {/* Upcoming Installments Section */}
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-3 border-b pb-2">Upcoming Installments</h3>

                  <div className="space-y-3">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Installment #6</p>
                          <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">Due: July 30, 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-900 dark:text-amber-300">₹50,000</p>
                          <Badge className="mt-1 bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0">
                            Upcoming
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Installment #7</p>
                          <p className="text-xs text-blue-800 dark:text-blue-400 mt-0.5">Due: Oct 15, 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-300">₹75,000</p>
                          <Badge className="mt-1 bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0">
                            Scheduled
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Installment #8</p>
                          <p className="text-xs text-blue-800 dark:text-blue-400 mt-0.5">Due: Dec 30, 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-300">₹75,000</p>
                          <Badge className="mt-1 bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0">
                            Scheduled
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    >
                      Send Reminder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                    >
                      Payment History
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="shadow-sm border bg-gradient-to-br from-white to-cyan-50 dark:from-background dark:to-cyan-950/10">
            <div className="p-6 pb-0 flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-200 hover:border-cyan-300 dark:border-cyan-800 dark:hover:border-cyan-700"
              >
                Edit
              </Button>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2.5 rounded-full">
                    <User className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Full Name</span>
                    <span className="text-sm font-medium">John Doe</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2.5 rounded-full">
                    <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">john.doe@example.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2.5 rounded-full">
                    <Phone className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <span className="text-sm font-medium">+91 98765 43210</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2.5 rounded-full">
                    <MessageSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">WhatsApp</span>
                    <span className="text-sm font-medium">+91 98765 43210</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
