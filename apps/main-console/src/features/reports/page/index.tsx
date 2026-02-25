import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Users, Clock, BarChart3, FileImage, Upload, AlertTriangle, Copy } from "lucide-react";
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
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ReportItem {
  id: string;
  domain?: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  downloadFunction: () => Promise<void>;
  requiresAcademicYear?: boolean;
  requiresRegulation?: boolean;
  actionType?: "download" | "upload";
  uploadOperation?: string;
}

export default function ReportsPage() {
  useRestrictTempUsers();
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [existingUidsDialogOpen, setExistingUidsDialogOpen] = useState(false);
  const [existingUids, setExistingUids] = useState<string[]>([]);
  const [cuRollRegValidationDialogOpen, setCuRollRegValidationDialogOpen] = useState(false);
  const [cuRollRegValidationMessage, setCuRollRegValidationMessage] = useState<string>("");
  const [cuRollRegMissingHeaders, setCuRollRegMissingHeaders] = useState<string[]>([]);

  const cuRollRegFileInputRef = useRef<HTMLInputElement | null>(null);
  const importStudentsFileInputRef = useRef<HTMLInputElement | null>(null);

  // Use existing academic year hook
  const { availableAcademicYears, loadAcademicYears } = useAcademicYear();

  // Dropdown states
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  const [selectedRegulationType, setSelectedRegulationType] = useState<string>("");

  // Authenticated user id for scoping socket room
  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();

  // Memoize the progress update handler to prevent re-renders
  const handleProgressUpdate = useCallback(
    (data: ProgressUpdate) => {
      console.log("Progress update received:", data);
      if (currentOperation && data?.meta?.operation && data.meta.operation !== currentOperation) {
        return;
      }
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
    },
    [currentOperation],
  );

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
      setCurrentOperation(null);

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

  const startUploadProgress = (operation: string, message: string) => {
    setIsExporting(true);
    setExportProgressOpen(true);
    setCurrentOperation(operation);
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId,
      type: "export_progress",
      message,
      progress: 0,
      status: "started",
      createdAt: new Date(),
      meta: { operation },
    });
  };

  const completeUploadProgress = (operation: string, message: string, success: boolean) => {
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId,
      type: "export_progress",
      message,
      progress: 100,
      status: success ? "completed" : "error",
      createdAt: new Date(),
      meta: { operation },
    });
    setIsExporting(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (e) {
      console.error("Failed to copy:", e);
      toast.error("Failed to copy");
    }
  };

  const normalizeHeaderKey = (key: unknown): string =>
    String(key ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, " ");

  const cleanUidForImport = (uid: unknown): string =>
    String(uid ?? "")
      .trim()
      .replace(/[^A-Za-z0-9]/g, "");

  const readExcelAsMatrix = async (file: File): Promise<string[][]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];
  };

  const validateCuRollRegExcel = async (file: File) => {
    const matrix = await readExcelAsMatrix(file);
    if (!matrix || matrix.length < 2) {
      return { ok: false, message: "Excel file has no data rows." as const };
    }

    const headerRow = matrix[0] || [];
    const headers = headerRow.map(normalizeHeaderKey);

    const uidCandidates = ["uid"];
    const rollCandidates = ["cu roll number", "cu roll no", "cu roll no.", "cu roll"];
    const regCandidates = ["cu registration number", "cu reg number", "cu registration no", "cu reg no", "cu reg no."];

    const findIndex = (cands: string[]) => headers.findIndex((h) => cands.includes(h));

    const uidIdx = findIndex(uidCandidates);
    const rollIdx = findIndex(rollCandidates);
    const regIdx = findIndex(regCandidates);

    const missing: string[] = [];
    if (uidIdx === -1) missing.push("UID");
    if (rollIdx === -1) missing.push("CU Roll Number");
    if (regIdx === -1) missing.push("CU Registration Number");
    if (missing.length) {
      return {
        ok: false,
        message:
          "Your Excel file is missing required columns in the header row (row 1). Please add the missing columns and try again.",
        missingHeaders: missing,
      };
    }

    const seen = new Set<string>();
    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r] || [];
      const uid = String(row[uidIdx] ?? "").trim();
      const roll = String(row[rollIdx] ?? "").trim();
      const reg = String(row[regIdx] ?? "").trim();

      if (!uid && !roll && !reg) continue; // skip empty row

      if (!uid) return { ok: false, message: `Row ${r + 1}: UID is required.` };
      if (!roll) return { ok: false, message: `Row ${r + 1}: CU Roll Number is required.` };
      if (!reg) return { ok: false, message: `Row ${r + 1}: CU Registration Number is required.` };

      const normUid = uid.toLowerCase();
      if (seen.has(normUid)) {
        return { ok: false, message: `Duplicate UID found: "${uid}" (row ${r + 1}). Please remove duplicates.` };
      }
      seen.add(normUid);
    }

    return { ok: true as const };
  };

  const extractImportUidsFromExcel = async (file: File) => {
    const matrix = await readExcelAsMatrix(file);
    if (!matrix || matrix.length < 2) {
      return { ok: false, message: "Excel file has no data rows.", uids: [] as string[] };
    }

    const headerRow = matrix[0] || [];
    const headers = headerRow.map(normalizeHeaderKey);

    const uidHeaderCandidates = ["uid", "student uid", "student_uid", "codenumber", "code", "code number"];
    const uidIdx = headers.findIndex((h) => uidHeaderCandidates.includes(h));
    if (uidIdx === -1) {
      return {
        ok: false,
        message: "UID column not found. Expected headers: UID / Student UID / CodeNumber",
        uids: [],
      };
    }

    const uids: string[] = [];
    const seen = new Set<string>();
    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r] || [];
      const rawUid = row[uidIdx];
      const cleaned = cleanUidForImport(rawUid);
      const displayUid = String(rawUid ?? "").trim();

      const isRowEmpty = row.every((cell: unknown) => String(cell ?? "").trim() === "");
      if (isRowEmpty) continue;

      if (!cleaned) return { ok: false, message: `Row ${r + 1}: UID is required.`, uids: [] };

      const norm = cleaned.toLowerCase();
      if (seen.has(norm)) {
        return {
          ok: false,
          message: `Duplicate UID found: "${displayUid}" (row ${r + 1}). Please remove duplicates.`,
          uids: [],
        };
      }
      seen.add(norm);
      uids.push(cleaned);
    }

    if (uids.length === 0) {
      return { ok: false, message: "No UID values found in the Excel file.", uids: [] };
    }

    return { ok: true as const, uids };
  };

  const uploadCuRollRegExcel = async (file: File) => {
    const operation = "student_cu_roll_reg_update";
    startUploadProgress(operation, "Uploading Excel for CU Roll/Registration update…");

    const result = await ExportService.updateStudentCuRollAndRegistration(file);
    if (!result.success) {
      completeUploadProgress(operation, result.message || "Upload failed", false);
      toast.error(result.message || "Upload failed");
      return;
    }

    // Socket will continue sending progress updates; keep UI open.
    setCurrentProgressUpdate((prev) => ({
      ...(prev || {
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        createdAt: new Date(),
      }),
      message: "Upload received. Processing…",
      progress: Math.max(prev?.progress ?? 0, 5),
      status: "in_progress",
      meta: { operation },
    }));
    toast.success("File uploaded. Processing started.");
  };

  const uploadImportStudentsExcel = async (file: File) => {
    const operation = "student_import_legacy_students";
    startUploadProgress(operation, "Uploading Excel to import students…");

    const result = await ExportService.importStudentsFromExcel(file);
    if (!result.success) {
      completeUploadProgress(operation, result.message || "Upload failed", false);
      toast.error(result.message || "Upload failed");
      return;
    }

    completeUploadProgress(operation, "Student import completed.", true);
    toast.success("Student import completed.");
  };

  const handleExcelFileSelected = async (reportId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // allow selecting the same file again
    e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    try {
      if (reportId === "cu-roll-reg-update") {
        const validation = await validateCuRollRegExcel(file);
        if (!validation.ok) {
          if ("missingHeaders" in validation && Array.isArray(validation.missingHeaders)) {
            setCuRollRegMissingHeaders(validation.missingHeaders);
            setCuRollRegValidationMessage(validation.message);
            setCuRollRegValidationDialogOpen(true);
          } else {
            toast.error(validation.message);
          }
          return;
        }
        await uploadCuRollRegExcel(file);
      } else if (reportId === "import-students-excel") {
        const extracted = await extractImportUidsFromExcel(file);
        if (!extracted.ok) {
          toast.error(extracted.message);
          return;
        }

        const check = await ExportService.checkExistingStudentUids(extracted.uids);
        if (!check.success) {
          toast.error(check.message || "Failed to pre-check existing students. Please try again.");
          return;
        }
        const found = check.data?.existingUids || [];

        if (found.length > 0) {
          setExistingUids(found);
          setExistingUidsDialogOpen(true);
          return;
        }

        await uploadImportStudentsExcel(file);
      }
    } catch (err) {
      console.error("Excel upload failed:", err);
      setIsExporting(false);
      toast.error("Upload failed");
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

    const result = await ExportService.exportStudentSubjectSelections(1);

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

  const downloadPromotionStudentsReport = async () => {
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId: userId,
      type: "export_progress",
      message: "Exporting Promotion Students Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    // Optional: pass filters (sessionId, classId) here in the future
    const result = await ExportService.exportPromotionStudentsReport();

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId: userId,
        type: "export_progress",
        message: "Promotion Students Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });
      toast.success("Promotion Students Report downloaded successfully!");
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
      id: "import-students-excel",
      domain: "ADMISSION_PHASE",
      name: "Import/Add Students (Excel)",
      description: "Upload Excel to import/add students (legacy importer expects a UID column)",
      icon: <Users className="h-5 w-5 text-emerald-600" />,
      downloadFunction: async () => {
        importStudentsFileInputRef.current?.click();
      },
      requiresAcademicYear: false,
      requiresRegulation: false,
      actionType: "upload",
      uploadOperation: "student_import_legacy_students",
    },
    {
      id: "student-detailed-report",
      domain: "POST_ADMISSION",
      name: "Student Detailed Report",
      description: "Download student personal, program, and address information",
      icon: <Users className="h-5 w-5 text-green-600" />,
      downloadFunction: () => handleDownload("student-detailed-report", downloadStudentDetailedReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "student-images",
      domain: "STUDENT_PROFILE_PHASE",
      name: "Student Avatar Images",
      description: "Download student avatar images as ZIP file",
      icon: <Users className="h-5 w-5 text-green-600" />,
      downloadFunction: () => handleDownload("student-images", downloadStudentImagesReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "student-academic-subjects-report",
      domain: "XII_ACADEMICS_PHASE",
      name: "Student's 12th Subjects Report",
      description: "Download students' XII subjects, marks, and related data",
      icon: <FileText className="h-5 w-5 text-teal-600" />,
      downloadFunction: () => handleDownload("student-academic-subjects-report", downloadStudentAcademicSubjectsReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },

    {
      id: "subject-selection",
      domain: "SUBJECT_SELECTION_PHASE",
      name: "Subject Selection Report",
      description: "Export all student subject selections with details and statistics",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      downloadFunction: () => handleDownload("subject-selection", downloadSubjectSelectionReport),
      requiresAcademicYear: true,
      requiresRegulation: false,
    },
    {
      id: "student-university-subjects-report",
      domain: "SUBJECT_SELECTION_PHASE",
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
      domain: "PRE_CU_REGISTRATION",
      name: "CU Registration Corrections Report",
      description: "Export all CU registration correction requests and their current status",
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      downloadFunction: () => handleDownload("cu-registration", downloadCuRegistrationReport),
      requiresAcademicYear: false,
      requiresRegulation: false,
    },
    {
      id: "cu-registration-pdfs",
      domain: "PRE_CU_REGISTRATION",
      name: "CU Registration PDFs Only",
      description: "Download only generated CU registration PDF forms as ZIP file",
      icon: <FileText className="h-5 w-5 text-orange-600" />,
      downloadFunction: () => handleDownload("cu-registration-pdfs", () => downloadCuRegistrationDocuments("pdfs")),
      requiresAcademicYear: true,
      requiresRegulation: true,
    },
    {
      id: "cu-registration-documents",
      domain: "PRE_CU_REGISTRATION",
      name: "CU Registration Documents Only",
      description: "Download only uploaded documents (marksheets, certificates, etc.) as ZIP file",
      icon: <FileImage className="h-5 w-5 text-indigo-600" />,
      downloadFunction: () =>
        handleDownload("cu-registration-documents", () => downloadCuRegistrationDocuments("documents")),
      requiresAcademicYear: true,
      requiresRegulation: true,
    },
    {
      id: "cu-roll-reg-update",
      domain: "POST_CU_REGISTRATION",
      name: "Update CU Roll & Registration (Excel)",
      description: "Upload Excel with headers: UID, CU Roll Number, CU Registration Number",
      icon: <FileText className="h-5 w-5 text-emerald-600" />,
      downloadFunction: async () => {
        cuRollRegFileInputRef.current?.click();
      },
      requiresAcademicYear: false,
      requiresRegulation: false,
      actionType: "upload",
      uploadOperation: "student_cu_roll_reg_update",
    },
    {
      id: "exam-form-submission-report",
      domain: "EXAM_FORM_SUBMISSION_PHASE",
      name: "Exam Form Submitted Report",
      description: "Export list of students who have submitted exam form with their details.",
      icon: <FileText className="h-5 w-5 text-emerald-700" />,
      downloadFunction: () => handleDownload("exam-form-submission-report", downloadPromotionStudentsReport),
      requiresAcademicYear: false,
      requiresRegulation: false,
    },
  ];

  return (
    <div className="p-3 sm:p-6">
      {/* Hidden file inputs for Excel uploads */}
      <input
        ref={cuRollRegFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => handleExcelFileSelected("cu-roll-reg-update", e)}
      />
      <input
        ref={importStudentsFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => handleExcelFileSelected("import-students-excel", e)}
      />

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
      <div className="w-full overflow-x-auto">
        <Table className="w-full min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[6%] border border-slate-200 text-xs sm:text-sm">Sr. No.</TableHead>
              <TableHead className="w-[23%] border border-slate-200 text-xs sm:text-sm">Domain</TableHead>
              <TableHead className="w-[23%] border border-slate-200 text-xs sm:text-sm">Report</TableHead>
              <TableHead className="w-[23%] sm:w-80 lg:w-[360px] border border-slate-200 text-xs sm:text-sm">
                Description
              </TableHead>
              <TableHead className="w-[14%] border border-slate-200 text-xs sm:text-sm">Filters</TableHead>
              <TableHead className="w-[14%] border border-slate-200 text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report, index) => {
              return (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell className="w-[6%] font-medium border border-slate-200 text-xs sm:text-sm py-3 sm:py-4 px-2 sm:px-4">
                    {index + 1}
                  </TableCell>
                  <TableCell className="w-[23%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 min-w-0">
                    <Badge
                      variant="outline"
                      title={report.domain || "POST_ADMISSION"}
                      className={`text-xs max-w-full  ${
                        (report.domain || "POST_ADMISSION") === "POST_CU_REGISTRATION"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : (report.domain || "POST_ADMISSION") === "ADMISSION_PHASE"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : (report.domain || "POST_ADMISSION") === "PRE_CU_REGISTRATION"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : (report.domain || "POST_ADMISSION") === "SUBJECT_SELECTION_PHASE"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : (report.domain || "POST_ADMISSION") === "STUDENT_PROFILE_PHASE"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : (report.domain || "POST_ADMISSION") === "XII_ACADEMICS_PHASE"
                                    ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {report.domain || "POST_ADMISSION"}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[23%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-shrink-0">{report.icon}</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm ">{report.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[23%] text-slate-600 border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm whitespace-normal break-words">
                    {report.description}
                  </TableCell>
                  <TableCell className="w-[14%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
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
                  <TableCell className="w-[14%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
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
                          {report.actionType === "upload" ? (
                            <>
                              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Upload</span>
                              <span className="sm:hidden">Upload</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Download</span>
                              <span className="sm:hidden">Download</span>
                            </>
                          )}
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

      {/* CU Roll/Reg Validation Dialog (missing headers) */}
      <AlertDialog open={cuRollRegValidationDialogOpen} onOpenChange={setCuRollRegValidationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-700" />
              </span>
              Missing required columns
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700">
              {cuRollRegValidationMessage || "Your Excel file is missing required columns."}
              <span className="block mt-2 text-slate-600">
                Header matching is case-insensitive and ignores extra spaces.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold text-slate-700">Expected headers</div>
            <div className="flex flex-wrap gap-2">
              {["UID", "CU Roll Number", "CU Registration Number"].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => copyToClipboard(h)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  title="Click to copy"
                >
                  <span className="font-mono">{h}</span>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          {cuRollRegMissingHeaders.length > 0 ? (
            <div className="rounded border border-red-200 bg-red-50/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-red-800">Missing headers</div>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100" variant="secondary">
                  {cuRollRegMissingHeaders.length}
                </Badge>
              </div>
              <div className="max-h-44 overflow-y-auto rounded border border-red-100 bg-white p-2">
                <ul className="space-y-1 text-xs text-slate-700">
                  {cuRollRegMissingHeaders.map((h) => (
                    <li key={h} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-slate-50">
                      <span className="font-mono">{h}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => copyToClipboard(h)}
                        title="Copy header"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Existing UID Warning Dialog (Import/Add Students) */}
      <AlertDialog open={existingUidsDialogOpen} onOpenChange={setExistingUidsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-700" />
              </span>
              Some student UIDs already exist
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700">
              The uploaded Excel contains UIDs that already exist in the system. Please remove these UIDs from the Excel
              and re-upload.
              <span className="block mt-2 font-medium text-red-700">
                Updating/resetting existing student details from this import is not allowed.
              </span>
              <span className="block mt-1 text-slate-600">
                For further details, contact the administrator of the system.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded border border-red-200 bg-red-50/40 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-red-800">Existing UIDs</div>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100" variant="secondary">
                {existingUids.length}
              </Badge>
            </div>
            <div className="max-h-56 overflow-y-auto rounded border border-red-100 bg-white p-2">
              <ul className="space-y-1 text-xs text-slate-700">
                {existingUids.map((uid) => (
                  <li key={uid} className="font-mono">
                    {uid}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
