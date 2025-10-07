import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Download,
  BookOpen,
  Upload,
  Edit3,
  Send,
  Filter,
  Settings,
  Search,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useAuth } from "@/features/auth/providers/auth-provider";
import ProcessControlDialog from "../components/ProcessControlDialog";
import { CuRegistrationSearch } from "../components/CuRegistrationSearch";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { useSocket } from "@/hooks/useSocket";
import { ExportService } from "@/services/exportService";

export default function CuRegistrationHomePage() {
  const [processControlOpen, setProcessControlOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<{
    id: string;
    userId: string;
    type: "export_progress";
    message: string;
    progress: number;
    status: "started" | "in_progress" | "completed" | "error";
    fileName?: string;
    downloadUrl?: string;
    error?: string;
    createdAt: Date;
    meta?: Record<string, unknown>;
  } | null>(null);

  // Debug: Log component re-renders
  console.log("CuRegistrationHomePage rendered", { isExporting, exportProgressOpen });

  // Authenticated user id for scoping socket room
  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();

  // Memoize the progress update handler to prevent re-renders
  const handleProgressUpdate = useCallback(
    (data: {
      id: string;
      userId: string;
      type: "export_progress";
      message: string;
      progress: number;
      status: "started" | "in_progress" | "completed" | "error";
      fileName?: string;
      downloadUrl?: string;
      error?: string;
      createdAt: Date;
      meta?: Record<string, unknown>;
    }) => {
      console.log("Progress update received:", data);
      setCurrentProgressUpdate(data);

      // We rely on the HTTP response to trigger download; socket just updates UI
    },
    [],
  );

  // Initialize WebSocket connection
  const { isConnected } = useSocket({
    userId,
    onProgressUpdate: handleProgressUpdate,
  });

  // Mock data - replace with actual data from API
  const overallStats = {
    totalStudents: 3537,
    subjectSelectionCompleted: 3400,
    cuRegistrationSubmitted: 3200,
    cuRegistrationApproved: 3100,
    pendingCorrections: 100,
    rejectedApplications: 25,
    correctionRequests: 150,
  };

  const subjectSelectionStats = {
    completed: 1200,
    pending: 300,
    completionRate: 80,
  };

  const cuRegistrationStats = {
    submitted: 850,
    approved: 750,
    pendingReview: 75,
    correctionsRequired: 100,
    rejected: 25,
    approvalRate: 88.2,
  };

  // Program and shift based stats
  const programStats = [
    {
      program: "B.A. English (H)",
      shift: "Day",
      totalStudents: 316,
      subjectSelectionCompleted: 300,
      cuRegistrationSubmitted: 280,
      cuRegistrationApproved: 270,
      correctionRequests: 10,
    },
    {
      program: "B.A. History (H)",
      shift: "Day",
      totalStudents: 250,
      subjectSelectionCompleted: 240,
      cuRegistrationSubmitted: 220,
      cuRegistrationApproved: 210,
      correctionRequests: 10,
    },
    {
      program: "B.A. Journalism and Mass Comm (H)",
      shift: "Day",
      totalStudents: 180,
      subjectSelectionCompleted: 170,
      cuRegistrationSubmitted: 160,
      cuRegistrationApproved: 155,
      correctionRequests: 5,
    },
    {
      program: "B.A. Political Science (H)",
      shift: "Day",
      totalStudents: 200,
      subjectSelectionCompleted: 190,
      cuRegistrationSubmitted: 180,
      cuRegistrationApproved: 175,
      correctionRequests: 5,
    },
    {
      program: "B.A. Sociology (H)",
      shift: "Day",
      totalStudents: 245,
      subjectSelectionCompleted: 235,
      cuRegistrationSubmitted: 225,
      cuRegistrationApproved: 220,
      correctionRequests: 5,
    },
    {
      program: "B.COM (G)",
      shift: "Morning",
      totalStudents: 35,
      subjectSelectionCompleted: 35,
      cuRegistrationSubmitted: 30,
      cuRegistrationApproved: 28,
      correctionRequests: 2,
    },
    {
      program: "B.COM (H)",
      shift: "Afternoon",
      totalStudents: 161,
      subjectSelectionCompleted: 155,
      cuRegistrationSubmitted: 145,
      cuRegistrationApproved: 140,
      correctionRequests: 5,
    },
    {
      program: "B.COM (H)",
      shift: "Evening",
      totalStudents: 364,
      subjectSelectionCompleted: 350,
      cuRegistrationSubmitted: 330,
      cuRegistrationApproved: 320,
      correctionRequests: 10,
    },
    {
      program: "B.COM (H)",
      shift: "Morning",
      totalStudents: 1786,
      subjectSelectionCompleted: 1700,
      cuRegistrationSubmitted: 1600,
      cuRegistrationApproved: 1550,
      correctionRequests: 50,
    },
    {
      program: "B.Sc. Chemistry (H)",
      shift: "Day",
      totalStudents: 120,
      subjectSelectionCompleted: 115,
      cuRegistrationSubmitted: 110,
      cuRegistrationApproved: 105,
      correctionRequests: 5,
    },
    {
      program: "B.Sc. Computer Science (H)",
      shift: "Day",
      totalStudents: 200,
      subjectSelectionCompleted: 190,
      cuRegistrationSubmitted: 180,
      cuRegistrationApproved: 175,
      correctionRequests: 5,
    },
    {
      program: "B.Sc. Economics (H)",
      shift: "Day",
      totalStudents: 150,
      subjectSelectionCompleted: 145,
      cuRegistrationSubmitted: 140,
      cuRegistrationApproved: 135,
      correctionRequests: 5,
    },
    {
      program: "B.Sc. Mathematics (H)",
      shift: "Day",
      totalStudents: 180,
      subjectSelectionCompleted: 175,
      cuRegistrationSubmitted: 170,
      cuRegistrationApproved: 165,
      correctionRequests: 5,
    },
    {
      program: "B.Sc. Physics (H)",
      shift: "Day",
      totalStudents: 160,
      subjectSelectionCompleted: 155,
      cuRegistrationSubmitted: 150,
      cuRegistrationApproved: 145,
      correctionRequests: 5,
    },
    {
      program: "BBA (H)",
      shift: "Day",
      totalStudents: 388,
      subjectSelectionCompleted: 380,
      cuRegistrationSubmitted: 370,
      cuRegistrationApproved: 365,
      correctionRequests: 5,
    },
    {
      program: "M.A. English",
      shift: "Evening",
      totalStudents: 50,
      subjectSelectionCompleted: 48,
      cuRegistrationSubmitted: 45,
      cuRegistrationApproved: 43,
      correctionRequests: 2,
    },
    {
      program: "M.Com",
      shift: "Evening",
      totalStudents: 30,
      subjectSelectionCompleted: 28,
      cuRegistrationSubmitted: 25,
      cuRegistrationApproved: 23,
      correctionRequests: 2,
    },
  ];

  const handleProcessUpdate = (updates: unknown[]) => {
    console.log("Process updates:", updates);
    // TODO: Implement API call to update processes
  };

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      setExportProgressOpen(true);

      // Set initial progress
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "Starting export process...",
        progress: 0,
        status: "started",
        createdAt: new Date(),
      });

      // Mock subject selection meta ID - replace with actual ID from your data
      const subjectSelectionMetaId = 1;

      // Start the export process
      const result = await ExportService.exportStudentSubjectSelections(subjectSelectionMetaId);

      if (result.success && result.data) {
        // Immediately trigger download based on HTTP response
        ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
        console.log("Export completed and download triggered");
      } else {
        console.error("Export failed:", result.message);
        setIsExporting(false);
        setExportProgressOpen(false);
      }
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      setExportProgressOpen(false);
    }
  };

  const handleDownloadFile = (fileName: string) => {
    // This will be called when the progress dialog receives a completion event
    // For now, we'll trigger a new download request
    const subjectSelectionMetaId = 1;
    ExportService.exportStudentSubjectSelections(subjectSelectionMetaId)
      .then((result) => {
        if (result.success && result.data) {
          // Use the fileName from the progress dialog if available, otherwise use the one from result
          const downloadFileName = fileName || result.data.fileName;
          ExportService.downloadFile(result.data.downloadUrl, downloadFileName);
        }
      })
      .catch((error) => {
        console.error("Download error:", error);
      });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">CU Registration Overview</h1>
          <p className="text-slate-600 mt-2">Summary of Subject Selection and CU Registration processes</p>
          {/* Debug info */}
          <div className="mt-2 text-xs text-slate-500">
            WebSocket: {isConnected ? "✅ Connected" : "❌ Disconnected"} | User ID: {userId} | Exporting:{" "}
            {isExporting ? "Yes" : "No"}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setSearchDialogOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-sm"
          >
            <Search className="h-4 w-4" />
            Search Students
          </Button>
          <Button
            onClick={() => setProcessControlOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
          >
            <Settings className="h-4 w-4" />
            Process Controls
          </Button>
          <Button
            onClick={handleExportReport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Report"}
            {!isConnected && (
              <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">No WebSocket</span>
            )}
          </Button>
        </div>
      </div>

      {/* Overall Process Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Process Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subject Selection Phase */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Phase 1: Subject Selection</h3>
                  <p className="text-sm text-slate-600">Students select subjects post merit list rounds</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm font-bold text-blue-600">{subjectSelectionStats.completionRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${subjectSelectionStats.completionRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Completed:</span>
                    <span className="font-semibold text-green-600">{subjectSelectionStats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pending:</span>
                    <span className="font-semibold text-yellow-600">{subjectSelectionStats.pending}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 transform -translate-x-1/2"></div>

            {/* CU Registration Phase */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Phase 2: CU Registration</h3>
                  <p className="text-sm text-slate-600">Final confirmation and document submission</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Approval Rate</span>
                  <span className="text-sm font-bold text-purple-600">{cuRegistrationStats.approvalRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cuRegistrationStats.approvalRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Approved:</span>
                    <span className="font-semibold text-green-600">{cuRegistrationStats.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Submitted:</span>
                    <span className="font-semibold text-blue-600">{cuRegistrationStats.submitted}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{overallStats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-slate-500">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subject Selection</CardTitle>
            <BookOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallStats.subjectSelectionCompleted}</div>
            <p className="text-xs text-slate-500">Completed selection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CU Registration</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{overallStats.cuRegistrationSubmitted}</div>
            <p className="text-xs text-slate-500">Submitted applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.cuRegistrationApproved}</div>
            <p className="text-xs text-slate-500">Final approvals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correction Requests</CardTitle>
            <Edit3 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overallStats.correctionRequests}</div>
            <p className="text-xs text-slate-500">Pending corrections</p>
          </CardContent>
        </Card>
      </div>

      {/* Program and Shift Based Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Statistics by Program & Shift
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Course
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Afternoon
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Day
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Evening
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Morning
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Subject Selection
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    CU Registration
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Approved
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Correction Requests
                  </th>
                  <th className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Grand Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {programStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-800">{stat.program}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-600">
                      {stat.shift === "Afternoon" ? stat.totalStudents : "-"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-600">
                      {stat.shift === "Day" ? stat.totalStudents : "-"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-600">
                      {stat.shift === "Evening" ? stat.totalStudents : "-"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-600">
                      {stat.shift === "Morning" ? stat.totalStudents : "-"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-blue-600 font-semibold">
                      {stat.subjectSelectionCompleted}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-purple-600 font-semibold">
                      {stat.cuRegistrationSubmitted}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-green-600 font-semibold">
                      {stat.cuRegistrationApproved}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-orange-600 font-semibold">
                      {stat.correctionRequests}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-800 font-bold">
                      {stat.totalStudents}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">Grand Total</td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.filter((s) => s.shift === "Afternoon").reduce((sum, s) => sum + s.totalStudents, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.filter((s) => s.shift === "Day").reduce((sum, s) => sum + s.totalStudents, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.filter((s) => s.shift === "Evening").reduce((sum, s) => sum + s.totalStudents, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.filter((s) => s.shift === "Morning").reduce((sum, s) => sum + s.totalStudents, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.reduce((sum, s) => sum + s.subjectSelectionCompleted, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.reduce((sum, s) => sum + s.cuRegistrationSubmitted, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.reduce((sum, s) => sum + s.cuRegistrationApproved, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.reduce((sum, s) => sum + s.correctionRequests, 0)}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {programStats.reduce((sum, s) => sum + s.totalStudents, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Edit3 className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Corrections Required</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">{overallStats.pendingCorrections}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Pending Review</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">{cuRegistrationStats.pendingReview}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Rejected Applications</span>
                </div>
                <Badge className="bg-red-100 text-red-800">{overallStats.rejectedApplications}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Ready for Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {overallStats.subjectSelectionCompleted - overallStats.cuRegistrationSubmitted}
                </div>
                <p className="text-sm text-gray-600">Students ready for CU Registration</p>
                <p className="text-xs text-gray-500 mt-1">
                  Completed subject selection but haven't submitted CU registration
                </p>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm">
                <Upload className="h-4 w-4 mr-2" />
                Send Registration Reminders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm">
              <BookOpen className="h-6 w-6" />
              <span>Subject Selection</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-sm">
              <FileText className="h-6 w-6" />
              <span>CU Registration</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-sm">
              <Edit3 className="h-6 w-6" />
              <span>Review Corrections</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm">
              <BarChart3 className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Process Control Dialog */}
      <ProcessControlDialog
        open={processControlOpen}
        onOpenChange={setProcessControlOpen}
        onProcessUpdate={handleProcessUpdate}
      />

      {/* CU Registration Search */}
      <CuRegistrationSearch
        isOpen={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onOpenProcessControls={() => setProcessControlOpen(true)}
      />

      {/* Export Progress Dialog */}
      <ExportProgressDialog
        isOpen={exportProgressOpen}
        onClose={() => {
          setExportProgressOpen(false);
          setIsExporting(false);
          setCurrentProgressUpdate(null);
        }}
        onDownload={handleDownloadFile}
        progressUpdate={currentProgressUpdate}
      />
    </div>
  );
}
