import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Users, Clock, BarChart3, FileImage } from "lucide-react";
import { toast } from "sonner";
import { ExportService } from "@/services/exportService";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useSocket } from "@/hooks/useSocket";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { ProgressUpdate } from "@/types/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { getRegulationTypes } from "@/services/course-design.api";
import type { RegulationType } from "@repo/db/index";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

interface ReportItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  downloadFunction: () => Promise<void>;
  requiresAcademicYear?: boolean;
  requiresRegulation?: boolean;
}

export default function ReportsPage() {
  useRestrictTempUsers();
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);

  // Use existing academic year hook
  const { availableAcademicYears, loadAcademicYears } = useAcademicYear();

  // Dropdown states
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  const [selectedRegulationType, setSelectedRegulationType] = useState<string>("");

  // Authenticated user id for scoping socket room
  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();

  // Memoize the progress update handler to prevent re-renders
  const handleProgressUpdate = useCallback((data: ProgressUpdate) => {
    console.log("Progress update received:", data);
    setCurrentProgressUpdate(data);

    // Handle completion status from socket updates
    if (data.status === "completed") {
      console.log("Export completed via socket update");
      setIsExporting(false);
      // The modal will auto-close due to the completed status in ExportProgressDialog
    } else if (data.status === "error") {
      console.log("Export failed via socket update");
      setIsExporting(false);
    }
  }, []);

  // Initialize WebSocket connection
  useSocket({
    userId,
    onProgressUpdate: handleProgressUpdate,
  });

  // Fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Load academic years using existing hook
        if (availableAcademicYears.length === 0) {
          loadAcademicYears();
        }

        // Fetch regulation types using existing course-design API service
        const regulationTypesData = await getRegulationTypes();
        setRegulationTypes(Array.isArray(regulationTypesData) ? regulationTypesData : []);

        // Set default to first active regulation type
        const activeRegulation = regulationTypesData.find((type: RegulationType) => type.isActive);
        if (activeRegulation) {
          setSelectedRegulationType(activeRegulation.shortName || activeRegulation.name);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown data");
      }
    };

    fetchDropdownData();
  }, [availableAcademicYears.length, loadAcademicYears]);

  const selectedAcademicYear = useMemo(
    () => availableAcademicYears.find((year) => year.isCurrentYear) || availableAcademicYears[0] || null,
    [availableAcademicYears],
  );
  const selectedAcademicYearId = selectedAcademicYear?.id?.toString() || "";

  const handleDownload = async (reportId: string, downloadFunction: () => Promise<void>) => {
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

      await downloadFunction();
    } catch (error) {
      console.error(`Download failed for ${reportId}:`, error);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "Export failed due to an error",
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date(),
      });
      setIsExporting(false);
      toast.error(`Failed to download ${reportId}`);
    }
  };

  const downloadSubjectSelectionReport = async () => {
    if (!selectedAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }

    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId: userId,
      type: "export_progress",
      message: "Exporting Subject Selection Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const result = await ExportService.exportStudentSubjectsInventory(Number(selectedAcademicYearId));

    if (result.success && result.data) {
      // Trigger download
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);

      // Update progress to completed state
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "Subject Selection Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });

      toast.success("Subject Selection Report downloaded successfully!");
    } else {
      throw new Error(result.message || "Export failed");
    }
  };

  const downloadCuRegistrationReport = async () => {
    if (!selectedAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }

    // Update progress for CU registration report
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId: userId,
      type: "export_progress",
      message: "Exporting CU Registration Corrections Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const academicYearIdNumber = Number(selectedAcademicYearId);
    const result = await ExportService.exportCuRegistrationCorrections(academicYearIdNumber);

    if (result.success && result.data) {
      // Trigger download
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);

      // Update progress to completed state
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "CU Registration Corrections Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });

      toast.success("CU Registration Corrections Report downloaded successfully!");
    } else {
      throw new Error(result.message || "Export failed");
    }
  };

  const downloadCuRegistrationDocuments = async (downloadType: "combined" | "pdfs" | "documents") => {
    // Validate selections
    if (!selectedAcademicYearId || !selectedRegulationType) {
      toast.error("Please select both Academic Year and Regulation Type");
      return;
    }

    // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    const yearMatch = selectedAcademicYear?.year?.match(/^(\d{4})/);
    const year = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    // Generate a unique session ID for socket progress tracking
    const sessionId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update progress for CU registration documents download (Socket.IO will handle live updates)
    setCurrentProgressUpdate({
      id: sessionId,
      userId: userId,
      type: "download_progress", // Changed back to download_progress for Socket.IO
      message: `Starting CU Registration ${downloadType} documents download...`,
      progress: 0,
      status: "started",
      createdAt: new Date(),
    });

    const result = await ExportService.downloadCuRegistrationDocuments(
      year,
      selectedRegulationType || "CCF", // Fallback to CCF if not selected
      downloadType,
      sessionId, // Pass session ID for Socket.IO tracking
    );

    if (result.success && result.data) {
      // Trigger download
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);

      // Update progress to completed state (this might be overridden by socket updates, but good fallback)
      setCurrentProgressUpdate({
        id: sessionId,
        userId: userId,
        type: "download_progress",
        message: `CU Registration ${downloadType} documents downloaded successfully!`,
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });

      toast.success(`CU Registration ${downloadType} documents downloaded successfully!`);
    } else {
      throw new Error(result.message || "Download failed");
    }
  };

  const downloadStudentDetailedReport = async () => {
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId: userId,
      type: "export_progress",
      message: "Exporting Student Detailed Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const academicYearIdNumber = Number(selectedAcademicYearId);
    const result = await ExportService.exportStudentDetailedReport(academicYearIdNumber);

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "Student Detailed Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });
      toast.success("Student Detailed Report downloaded successfully!");
    } else {
      throw new Error(result.message || "Export failed");
    }
  };

  const downloadStudentAcademicSubjectsReport = async () => {
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId: userId,
      type: "export_progress",
      message: "Exporting Student Academic Subjects Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const academicYearIdNumber = Number(selectedAcademicYearId);
    const result = await ExportService.exportStudentAcademicSubjectsReport(academicYearIdNumber);

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "Student Academic Subjects Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });
      toast.success("Student Academic Subjects Report downloaded successfully!");
    } else {
      throw new Error(result.message || "Export failed");
    }
  };

  const downloadStudentUniversitySubjectsReport = async () => {
    if (!selectedAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }

    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId,
      type: "export_progress",
      message: "Exporting Student University Subjects Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const result = await ExportService.exportStudentSubjectsInventory(Number(selectedAcademicYearId));

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        message: "Student University Subjects Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });
      toast.success("Student University Subjects Report downloaded successfully!");
    } else {
      throw new Error(result.message || "Export failed");
    }
  };

  const downloadStudentImagesReport = async () => {
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId: userId,
      type: "export_progress",
      message: "Exporting Student Images Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const academicYearIdNumber = Number(selectedAcademicYearId);
    const result = await ExportService.downloadStudentImages(academicYearIdNumber);

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "Student Images Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });
      toast.success("Student Images Report downloaded successfully!");
    } else {
      throw new Error(result.message || "Export failed");
    }
  };

  const reports: ReportItem[] = [
    {
      id: "student-detailed-report",
      name: "Student Detailed Report",
      description: "Download student personal, program, and address information",
      icon: <Users className="h-5 w-5 text-green-600" />,
      downloadFunction: () => handleDownload("student-detailed-report", downloadStudentDetailedReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "student-images",
      name: "Student Avatar Images",
      description: "Download student avatar images as ZIP file",
      icon: <Users className="h-5 w-5 text-green-600" />,
      downloadFunction: () => handleDownload("student-images", downloadStudentImagesReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "student-academic-subjects-report",
      name: "Student's 12th Subjects Report",
      description: "Download students' XII subjects, marks, and related data",
      icon: <FileText className="h-5 w-5 text-teal-600" />,
      downloadFunction: () => handleDownload("student-academic-subjects-report", downloadStudentAcademicSubjectsReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "subject-selection",
      name: "Subject Selection Report",
      description: "Export all student subject selections with details and statistics",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      downloadFunction: () => handleDownload("subject-selection", downloadSubjectSelectionReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "student-university-subjects-report",
      name: "Student University Subjects Report",
      description: "Download university subject inventory per student for selected academic year",
      icon: <Users className="h-5 w-5 text-cyan-600" />,
      downloadFunction: () =>
        handleDownload("student-university-subjects-report", downloadStudentUniversitySubjectsReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "cu-registration",
      name: "CU Registration Corrections Report",
      description: "Export all CU registration correction requests and their current status",
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      downloadFunction: () => handleDownload("cu-registration", downloadCuRegistrationReport),
      requiresAcademicYear: false,
      requiresRegulation: false,
    },
    {
      id: "cu-registration-pdfs",
      name: "CU Registration PDFs Only",
      description: "Download only generated CU registration PDF forms as ZIP file",
      icon: <FileText className="h-5 w-5 text-orange-600" />,
      downloadFunction: () => handleDownload("cu-registration-pdfs", () => downloadCuRegistrationDocuments("pdfs")),
      requiresAcademicYear: true,
      requiresRegulation: true,
    },
    {
      id: "cu-registration-documents",
      name: "CU Registration Documents Only",
      description: "Download only uploaded documents (marksheets, certificates, etc.) as ZIP file",
      icon: <FileImage className="h-5 w-5 text-indigo-600" />,
      downloadFunction: () =>
        handleDownload("cu-registration-documents", () => downloadCuRegistrationDocuments("documents")),
      requiresAcademicYear: true,
      requiresRegulation: true,
    },
  ];

  return (
    <div className="p-3 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">Download various reports and analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
          <span className="text-xs sm:text-sm text-slate-500">Analytics Dashboard</span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 sm:w-20 border border-slate-200 text-xs sm:text-sm">Sr. No.</TableHead>
              <TableHead className="w-32 sm:w-40 border border-slate-200 text-xs sm:text-sm">Domain</TableHead>
              <TableHead className="w-64 sm:w-80 border border-slate-200 text-xs sm:text-sm">Report</TableHead>
              <TableHead className="min-w-[200px] sm:min-w-[300px] border border-slate-200 text-xs sm:text-sm">
                Description
              </TableHead>
              <TableHead className="w-40 sm:w-48 border border-slate-200 text-xs sm:text-sm">Filters</TableHead>
              <TableHead className="w-32 sm:w-40 border border-slate-200 text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report, index) => {
              return (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium border border-slate-200 text-xs sm:text-sm py-3 sm:py-4 px-2 sm:px-4">
                    {index + 1}
                  </TableCell>
                  <TableCell className="border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      POST_ADMISSION
                    </Badge>
                  </TableCell>
                  <TableCell className="border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-shrink-0">{report.icon}</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{report.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">
                    {report.description}
                  </TableCell>
                  <TableCell className="border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                    {report.requiresRegulation ? (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Select value={selectedRegulationType} onValueChange={setSelectedRegulationType}>
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {regulationTypes.map((type) => (
                                <SelectItem key={type.id} value={type.shortName || type.name}>
                                  {type.shortName || type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                    <Button
                      onClick={report.downloadFunction}
                      disabled={
                        isExporting ||
                        (report.requiresAcademicYear && !selectedAcademicYearId) ||
                        (report.requiresRegulation && !selectedRegulationType)
                      }
                      className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm disabled:opacity-50 w-full sm:w-auto flex-shrink-0"
                      size="sm"
                    >
                      {isExporting ? (
                        <>
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Downloading...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">DL</span>
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Export Progress Dialog */}
      <ExportProgressDialog
        isOpen={exportProgressOpen}
        onClose={() => {
          setExportProgressOpen(false);
          setIsExporting(false);
          setCurrentProgressUpdate(null);
        }}
        progressUpdate={currentProgressUpdate}
      />
    </div>
  );
}
