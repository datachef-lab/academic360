import { useState, useCallback, useEffect } from "react";
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
import type { RegulationType } from "@repo/db";

interface ReportItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  downloadFunction: () => Promise<void>;
  requiresFilters?: boolean; // New property to indicate if this report needs filters
}

export default function ReportsPage() {
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);

  // Use existing academic year hook
  const { availableAcademicYears, loadAcademicYears } = useAcademicYear();

  // Dropdown states
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
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

  // Set default academic year when availableAcademicYears changes
  useEffect(() => {
    if (availableAcademicYears.length > 0 && !selectedAcademicYear) {
      // Set default to current academic year or first available
      const currentYear = availableAcademicYears.find((year) => year.isCurrentYear);
      const defaultYear = currentYear || availableAcademicYears[0];
      if (defaultYear) {
        setSelectedAcademicYear(defaultYear.year);
      }
    }
  }, [availableAcademicYears, selectedAcademicYear]);

  // Mock subject selection meta ID - replace with actual ID from your data
  const subjectSelectionMetaId = 1;

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
    // Update progress for subject selection report
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId: userId,
      type: "export_progress",
      message: "Exporting Subject Selection Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const result = await ExportService.exportStudentSubjectSelections(subjectSelectionMetaId);

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

    const result = await ExportService.exportCuRegistrationCorrections();

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
    if (!selectedAcademicYear || !selectedRegulationType) {
      toast.error("Please select both Academic Year and Regulation Type");
      return;
    }

    // Extract year from academic year string (e.g., "2025-2026" -> 2025)
    const yearMatch = selectedAcademicYear?.match(/^(\d{4})/);
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

  const reports: ReportItem[] = [
    {
      id: "subject-selection",
      name: "Subject Selection Report",
      description: "Export all student subject selections with details and statistics",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      downloadFunction: () => handleDownload("subject-selection", downloadSubjectSelectionReport),
      requiresFilters: false,
    },
    {
      id: "cu-registration",
      name: "CU Registration Corrections Report",
      description: "Export all CU registration correction requests and their current status",
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      downloadFunction: () => handleDownload("cu-registration", downloadCuRegistrationReport),
      requiresFilters: false,
    },
    {
      id: "cu-registration-pdfs",
      name: "CU Registration PDFs Only",
      description: "Download only generated CU registration PDF forms as ZIP file",
      icon: <FileText className="h-5 w-5 text-orange-600" />,
      downloadFunction: () => handleDownload("cu-registration-pdfs", () => downloadCuRegistrationDocuments("pdfs")),
      requiresFilters: true,
    },
    {
      id: "cu-registration-documents",
      name: "CU Registration Documents Only",
      description: "Download only uploaded documents (marksheets, certificates, etc.) as ZIP file",
      icon: <FileImage className="h-5 w-5 text-indigo-600" />,
      downloadFunction: () =>
        handleDownload("cu-registration-documents", () => downloadCuRegistrationDocuments("documents")),
      requiresFilters: true,
    },
  ];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-600 mt-2">Download various reports and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-slate-600" />
          <span className="text-sm text-slate-500">Analytics Dashboard</span>
        </div>
      </div>

      {/* Reports Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 border border-slate-200">Sr. No.</TableHead>
            <TableHead className="w-32 border border-slate-200">Domain</TableHead>
            <TableHead className="w-80 border border-slate-200">Report</TableHead>
            <TableHead className="border border-slate-200">Description</TableHead>
            <TableHead className="w-48 border border-slate-200">Filters</TableHead>
            <TableHead className="w-40 border border-slate-200">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report, index) => {
            return (
              <TableRow key={report.id} className="hover:bg-slate-50">
                <TableCell className="font-medium border border-slate-200">{index + 1}</TableCell>
                <TableCell className="border border-slate-200">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    ADMISSION
                  </Badge>
                </TableCell>
                <TableCell className="border border-slate-200">
                  <div className="flex items-center gap-3">
                    {report.icon}
                    <div>
                      <div className="font-semibold text-slate-800">{report.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 border border-slate-200">{report.description}</TableCell>
                <TableCell className="border border-slate-200">
                  {report.requiresFilters ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Academic Year</label>
                        <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAcademicYears.map((year) => (
                              <SelectItem key={year.id} value={year.year}>
                                {year.year} {year.isCurrentYear && "(Current)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Regulation</label>
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
                    <span className="text-slate-400 text-sm">No filters required</span>
                  )}
                </TableCell>
                <TableCell className="border border-slate-200">
                  <Button
                    onClick={report.downloadFunction}
                    disabled={
                      isExporting || (report.requiresFilters && (!selectedAcademicYear || !selectedRegulationType))
                    }
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm disabled:opacity-50"
                    size="sm"
                  >
                    {isExporting ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

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
