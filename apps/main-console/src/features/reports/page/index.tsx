import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  Users,
  Clock,
  ChevronDown,
  Filter,
  FileImage,
  Upload,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useSocket } from "@/hooks/useSocket";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { ProgressUpdate } from "@/types/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import {
  getRegulationTypes,
  getAffiliations,
  getProgramCourses,
} from "@/services/course-design.api";
import type { RegulationType, Affiliation, ProgramCourse } from "@repo/db/index";
import { getAllClasses } from "@/services/classes.service";
import type { Class } from "@/types/academics/class";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MultiSelectDropdown from "@/components/ui/MultiSelect";
import { ExportService, type ReportExportQueryFilters } from "@/services/exportService";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ReportItem {
  id: string;
  /** Single domain (default). Ignored when `domains` is non-empty. */
  domain?: string;
  /** Multiple domain tags for one row (e.g. fees + admission). */
  domains?: string[];
  name: string;
  description: string;
  icon: ReactNode;
  downloadFunction: () => Promise<void>;
  requiresAcademicYear?: boolean;
  requiresRegulation?: boolean;
  actionType?: "download" | "upload";
  uploadOperation?: string;
  /** Excel includes a Semester (class) column */
  includesSemesterInExport?: boolean;
  /** When true, row uses Export filters dialog (academic year + optional narrowers). */
  usesToolbarExportFilters?: boolean;
}

function getReportDomains(report: ReportItem): string[] {
  if (report.domains && report.domains.length > 0) return report.domains;
  return [report.domain ?? "POST_ADMISSION"];
}

/** Display domain keys (e.g. `ADMISSION_PHASE`) as sentence case in the UI. */
function domainToSentenceCase(domain: string): string {
  const s = domain.replace(/_/g, " ").trim().toLowerCase();
  if (!s.length) return domain;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDomainBadgeLabel(domain: string): string {
  const label = domainToSentenceCase(domain);
  return domain === "FEES" ? `₹ ${label}` : label;
}

function domainBadgeClassName(domain: string): string {
  switch (domain) {
    case "POST_CU_REGISTRATION":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "ADMISSION_PHASE":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "PRE_CU_REGISTRATION":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "SUBJECT_SELECTION_PHASE":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "STUDENT_PROFILE_PHASE":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "XII_ACADEMICS_PHASE":
      return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    case "FEES":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "ENROLMENT":
      return "bg-violet-50 text-violet-800 border-violet-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
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
  const [cuRollRegValidationMessage, setCuRollRegValidationMessage] = useState("");
  const [cuRollRegMissingHeaders, setCuRollRegMissingHeaders] = useState<string[]>([]);

  const cuRollRegFileInputRef = useRef<HTMLInputElement | null>(null);
  const importStudentsFileInputRef = useRef<HTMLInputElement | null>(null);

  // Use existing academic year hook
  const { availableAcademicYears, loadAcademicYears, currentAcademicYear } = useAcademicYear();

  // Dropdown states
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  /** Empty = show all reports (no domain filter). */
  const [domainFilter, setDomainFilter] = useState<string[]>([]);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  /** Academic year id used for all exports (toolbar). */
  const [exportAcademicYearId, setExportAcademicYearId] = useState("");
  const [filterRegulationIds, setFilterRegulationIds] = useState<number[]>([]);
  const [filterAffiliationIds, setFilterAffiliationIds] = useState<number[]>([]);
  const [filterProgramCourseIds, setFilterProgramCourseIds] = useState<number[]>([]);
  const [filterClassIds, setFilterClassIds] = useState<number[]>([]);

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
        const regulationList = Array.isArray(regulationTypesData) ? regulationTypesData : [];
        setRegulationTypes(regulationList);
        const activeRegulation = regulationList.find((type: RegulationType) => type.isActive);
        if (activeRegulation?.id != null) {
          setFilterRegulationIds((prev) =>
            prev.length > 0 ? prev : [activeRegulation.id as number],
          );
        }

        const [affData, pcData] = await Promise.all([getAffiliations(), getProgramCourses()]);
        setAffiliations(Array.isArray(affData) ? affData : []);
        setProgramCourses(Array.isArray(pcData) ? pcData : []);
        const cls = await getAllClasses();
        setClassesList(Array.isArray(cls) ? cls : []);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown data");
      }
    };

    fetchDropdownData();
  }, [availableAcademicYears.length, loadAcademicYears]);

  const selectedAcademicYear = useMemo(
    () =>
      availableAcademicYears.find((year) => year.isCurrentYear) ||
      availableAcademicYears[0] ||
      null,
    [availableAcademicYears],
  );
  const selectedAcademicYearId = selectedAcademicYear?.id?.toString() || "";
  const effectiveAcademicYearId = exportAcademicYearId.trim() || selectedAcademicYearId;

  const academicYearForToolbarExport = useMemo(
    () =>
      availableAcademicYears.find((y) => String(y.id) === effectiveAcademicYearId) ||
      selectedAcademicYear,
    [availableAcademicYears, effectiveAcademicYearId, selectedAcademicYear],
  );

  const buildReportFilters = useCallback((): ReportExportQueryFilters => {
    const ay = Number(effectiveAcademicYearId);
    return {
      academicYearId: Number.isFinite(ay) ? ay : undefined,
      regulationTypeIds: filterRegulationIds.length ? filterRegulationIds : undefined,
      affiliationIds: filterAffiliationIds.length ? filterAffiliationIds : undefined,
      programCourseIds: filterProgramCourseIds.length ? filterProgramCourseIds : undefined,
      classIds: filterClassIds.length ? filterClassIds : undefined,
    };
  }, [
    effectiveAcademicYearId,
    filterRegulationIds,
    filterAffiliationIds,
    filterProgramCourseIds,
    filterClassIds,
  ]);

  const cuZipRegulationShortName = useMemo(() => {
    if (filterRegulationIds.length !== 1) return "";
    const rt = regulationTypes.find((r) => r.id === filterRegulationIds[0]);
    return (rt?.shortName || rt?.name || "").trim();
  }, [filterRegulationIds, regulationTypes]);

  useEffect(() => {
    if (exportAcademicYearId.trim()) return;
    const sliceId = currentAcademicYear?.id;
    if (sliceId != null) {
      setExportAcademicYearId(String(sliceId));
      return;
    }
    if (selectedAcademicYearId) {
      setExportAcademicYearId(selectedAcademicYearId);
    }
  }, [currentAcademicYear?.id, selectedAcademicYearId, exportAcademicYearId]);

  const handleDownload = async (
    reportId: string,
    downloadFunction: () => Promise<void>,
    socketOperation?: string | null,
  ) => {
    try {
      setIsExporting(true);
      setExportProgressOpen(true);
      setCurrentOperation(socketOperation ?? null);

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
      toast.error(
        error instanceof Error && error.message ? error.message : `Failed to download ${reportId}`,
      );
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
    const regCandidates = [
      "cu registration number",
      "cu reg number",
      "cu registration no",
      "cu reg no",
      "cu reg no.",
    ];

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

      if (!uid && !roll && !reg) continue;

      if (!uid) return { ok: false, message: `Row ${r + 1}: UID is required.` };
      if (!roll) return { ok: false, message: `Row ${r + 1}: CU Roll Number is required.` };
      if (!reg) return { ok: false, message: `Row ${r + 1}: CU Registration Number is required.` };

      const normUid = uid.toLowerCase();
      if (seen.has(normUid)) {
        return {
          ok: false,
          message: `Duplicate UID found: "${uid}" (row ${r + 1}). Please remove duplicates.`,
        };
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

    const uidHeaderCandidates = [
      "uid",
      "student uid",
      "student_uid",
      "codenumber",
      "code",
      "code number",
    ];
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

  const handleExcelFileSelected = async (reportId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const downloadStudentDetailedReport = async () => {
    if (!effectiveAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId,
      type: "export_progress",
      message: "Exporting Student Detailed Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const result = await ExportService.exportStudentDetailedReport(Number(effectiveAcademicYearId));

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
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
    if (!effectiveAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId,
      type: "export_progress",
      message: "Exporting Student Academic Subjects Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const result = await ExportService.exportStudentAcademicSubjectsReport(
      Number(effectiveAcademicYearId),
    );

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
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

  const downloadStudentImagesReport = async () => {
    if (!effectiveAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId,
      type: "export_progress",
      message: "Exporting Student Images Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });

    const result = await ExportService.downloadStudentImages(Number(effectiveAcademicYearId));

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
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

  const downloadCuRegistrationDocuments = async (
    downloadType: "combined" | "pdfs" | "documents",
  ) => {
    if (!effectiveAcademicYearId) {
      toast.error("Please select an academic year in Export filters");
      return;
    }
    if (filterRegulationIds.length !== 1 || !cuZipRegulationShortName) {
      toast.error(
        "CU Registration ZIP downloads need exactly one regulation selected in Export filters.",
      );
      return;
    }

    const yearMatch = academicYearForToolbarExport?.year?.match(/^(\d{4})/);
    const year = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    const sessionId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setCurrentProgressUpdate({
      id: sessionId,
      userId,
      type: "download_progress",
      message: `Starting CU Registration ${downloadType} documents download...`,
      progress: 0,
      status: "started",
      createdAt: new Date(),
    });

    const result = await ExportService.downloadCuRegistrationDocuments(
      year,
      cuZipRegulationShortName,
      downloadType,
      sessionId,
    );

    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: sessionId,
        userId,
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

  const downloadSubjectSelectionReport = async () => {
    if (!effectiveAcademicYearId) {
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

    const ayNum = Number(effectiveAcademicYearId);
    const metaId = await ExportService.getFirstSubjectSelectionMetaIdForAcademicYear(ayNum);
    if (metaId == null) {
      throw new Error(
        "No subject selection configuration found for this academic year. Cannot export.",
      );
    }

    const result = await ExportService.exportStudentSubjectSelections(metaId, buildReportFilters());

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
    if (!effectiveAcademicYearId) {
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

    const academicYearIdNumber = Number(effectiveAcademicYearId);
    const f = buildReportFilters();
    const result = await ExportService.exportCuRegistrationCorrections(academicYearIdNumber, {
      programCourseIds: f.programCourseIds,
      affiliationIds: f.affiliationIds,
      regulationTypeIds: f.regulationTypeIds,
      classIds: f.classIds,
    });

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

  const downloadEnrolmentMasterReport = async () => {
    if (!effectiveAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }
    setCurrentProgressUpdate({
      id: `export_${Date.now()}`,
      userId,
      type: "export_progress",
      message: "Exporting Enrolment Master Report...",
      progress: 25,
      status: "in_progress",
      createdAt: new Date(),
    });
    const f = buildReportFilters();
    const result = await ExportService.exportEnrolmentMasterReport(
      Number(effectiveAcademicYearId),
      {
        programCourseIds: f.programCourseIds,
        affiliationIds: f.affiliationIds,
        regulationTypeIds: f.regulationTypeIds,
        classIds: f.classIds,
      },
    );
    if (result.success && result.data) {
      ExportService.downloadFile(result.data.downloadUrl, result.data.fileName);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        message: "Enrolment Master Report downloaded successfully!",
        progress: 100,
        status: "completed",
        fileName: result.data?.fileName,
        downloadUrl: result.data?.downloadUrl,
        createdAt: new Date(),
      });
      toast.success("Enrolment Master Report downloaded successfully!");
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

    const f = buildReportFilters();
    const result = await ExportService.exportPromotionStudentsReport({
      academicYearId: f.academicYearId,
      programCourseIds: f.programCourseIds,
      affiliationIds: f.affiliationIds,
      regulationTypeIds: f.regulationTypeIds,
      classIds: f.classIds,
    });

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
    if (!effectiveAcademicYearId) {
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

    const f = buildReportFilters();
    const result = await ExportService.exportStudentSubjectsInventory(
      Number(effectiveAcademicYearId),
      {
        programCourseIds: f.programCourseIds,
        affiliationIds: f.affiliationIds,
        regulationTypeIds: f.regulationTypeIds,
        classIds: f.classIds,
      },
    );

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
      actionType: "upload",
      uploadOperation: "student_import_legacy_students",
    },
    {
      id: "student-detailed-report",
      domain: "POST_ADMISSION",
      name: "Student Detailed Report",
      description: "Download student personal, program, and address information",
      icon: <Users className="h-5 w-5 text-green-600" />,
      downloadFunction: () =>
        handleDownload("student-detailed-report", downloadStudentDetailedReport),
      requiresAcademicYear: true,
    },
    {
      id: "student-images",
      domain: "STUDENT_PROFILE_PHASE",
      name: "Student Avatar Images",
      description: "Download student avatar images as ZIP file",
      icon: <Users className="h-5 w-5 text-green-600" />,
      downloadFunction: () => handleDownload("student-images", downloadStudentImagesReport),
      requiresAcademicYear: true,
    },
    {
      id: "student-academic-subjects-report",
      domain: "XII_ACADEMICS_PHASE",
      name: "Student's 12th Subjects Report",
      description: "Download students' XII subjects, marks, and related data",
      icon: <FileText className="h-5 w-5 text-teal-600" />,
      downloadFunction: () =>
        handleDownload("student-academic-subjects-report", downloadStudentAcademicSubjectsReport),
      requiresAcademicYear: true,
    },
    {
      id: "subject-selection",
      domain: "ENROLMENT",
      name: "Subject Selection Report",
      description: "Export all student subject selections with details and statistics",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      downloadFunction: () => handleDownload("subject-selection", downloadSubjectSelectionReport),
      requiresAcademicYear: true,
      includesSemesterInExport: true,
      usesToolbarExportFilters: true,
    },
    {
      id: "student-university-subjects-report",
      domain: "ENROLMENT",
      name: "Student University Subjects Report",
      description: "Download university subject inventory per student for selected academic year",
      icon: <Users className="h-5 w-5 text-cyan-600" />,
      downloadFunction: () =>
        handleDownload(
          "student-university-subjects-report",
          downloadStudentUniversitySubjectsReport,
        ),
      requiresAcademicYear: true,
      includesSemesterInExport: true,
      usesToolbarExportFilters: true,
    },
    {
      id: "enrolment-master-report",
      domain: "ENROLMENT",
      name: "Enrolment Master Report",
      description:
        "Student profile, CU numbers, papers from subject-paper mapping, and contact fields",
      icon: <FileText className="h-5 w-5 text-violet-600" />,
      downloadFunction: () =>
        handleDownload("enrolment-master-report", downloadEnrolmentMasterReport),
      requiresAcademicYear: true,
      includesSemesterInExport: true,
      usesToolbarExportFilters: true,
    },
    {
      id: "cu-registration",
      domain: "PRE_CU_REGISTRATION",
      name: "CU Registration Corrections Report",
      description: "Export all CU registration correction requests and their current status",
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      downloadFunction: () => handleDownload("cu-registration", downloadCuRegistrationReport),
      requiresAcademicYear: true,
      includesSemesterInExport: true,
      usesToolbarExportFilters: true,
    },
    {
      id: "cu-registration-pdfs",
      domain: "PRE_CU_REGISTRATION",
      name: "CU Registration PDFs Only",
      description: "Download only generated CU registration PDF forms as ZIP file",
      icon: <FileText className="h-5 w-5 text-orange-600" />,
      downloadFunction: () =>
        handleDownload("cu-registration-pdfs", () => downloadCuRegistrationDocuments("pdfs")),
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
        handleDownload("cu-registration-documents", () =>
          downloadCuRegistrationDocuments("documents"),
        ),
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
      actionType: "upload",
      uploadOperation: "student_cu_roll_reg_update",
    },
    {
      id: "exam-form-submission-report",
      domain: "EXAM_FORM_SUBMISSION_PHASE",
      name: "Exam Form Submitted Report",
      description: "Export list of students who have submitted exam form with their details.",
      icon: <FileText className="h-5 w-5 text-emerald-700" />,
      downloadFunction: () =>
        handleDownload("exam-form-submission-report", downloadPromotionStudentsReport),
      requiresAcademicYear: false,
      includesSemesterInExport: true,
      usesToolbarExportFilters: true,
    },
  ];

  const allReportDomains = Array.from(new Set(reports.flatMap((r) => getReportDomains(r)))).sort(
    (a, b) => a.localeCompare(b),
  );

  const reportCountByDomain = reports.reduce<Record<string, number>>((acc, r) => {
    for (const d of getReportDomains(r)) {
      acc[d] = (acc[d] ?? 0) + 1;
    }
    return acc;
  }, {});

  const filteredReports =
    domainFilter.length === 0
      ? reports
      : reports.filter((r) => getReportDomains(r).some((d) => domainFilter.includes(d)));

  const toggleDomainFilter = (domain: string) => {
    setDomainFilter((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain],
    );
  };

  const activeExportFilterCount =
    filterRegulationIds.length +
    filterAffiliationIds.length +
    filterProgramCourseIds.length +
    filterClassIds.length;

  const semesterClasses = useMemo(
    () =>
      [...classesList]
        .filter((c) => c.type === "SEMESTER" && c.disabled !== true)
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    [classesList],
  );

  const regulationFilterOptions = useMemo(
    () =>
      regulationTypes
        .filter((rt) => rt.id != null)
        .map((rt) => ({
          label: rt.shortName || rt.name,
          value: String(rt.id),
        })),
    [regulationTypes],
  );

  const affiliationFilterOptions = useMemo(
    () =>
      affiliations
        .filter((a) => a.id != null)
        .map((a) => ({ label: a.name ?? `Affiliation ${a.id}`, value: String(a.id) })),
    [affiliations],
  );

  const programCourseFilterOptions = useMemo(() => {
    let list = programCourses.filter((pc) => pc.id != null);

    if (filterAffiliationIds.length > 0) {
      const aff = new Set(filterAffiliationIds);
      list = list.filter((pc) => pc.affiliationId != null && aff.has(pc.affiliationId));
    }
    if (filterRegulationIds.length > 0) {
      const reg = new Set(filterRegulationIds);
      list = list.filter((pc) => pc.regulationTypeId != null && reg.has(pc.regulationTypeId));
    }

    return [...list]
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((pc) => ({
        label: pc.name || pc.shortName || String(pc.id),
        value: String(pc.id),
      }));
  }, [programCourses, filterAffiliationIds, filterRegulationIds]);

  useEffect(() => {
    const allowed = new Set(
      programCourseFilterOptions.map((o) => Number(o.value)).filter((n) => Number.isFinite(n)),
    );
    setFilterProgramCourseIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [programCourseFilterOptions]);

  const semesterClassFilterOptions = useMemo(
    () =>
      semesterClasses
        .filter((c) => c.id != null)
        .map((c) => ({ label: c.name, value: String(c.id) })),
    [semesterClasses],
  );

  const parseIdStrings = (values: string[]) =>
    values.map((v) => Number(v)).filter((n) => Number.isFinite(n));

  const cuZipRegulationReady =
    filterRegulationIds.length === 1 && Boolean(cuZipRegulationShortName);

  return (
    <div className="p-3 sm:p-6">
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

      <div className="mb-4 sm:mb-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Download various reports and analytics
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-end">
          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Domain</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-[260px] justify-between font-normal text-left"
                >
                  <span className="truncate">
                    {domainFilter.length === 0
                      ? "All domains"
                      : domainFilter.length === 1
                        ? formatDomainBadgeLabel(domainFilter[0]!)
                        : `${domainFilter.length} domains selected`}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-72 max-h-[min(70vh,360px)] overflow-y-auto"
                align="start"
              >
                <DropdownMenuLabel className="font-normal text-xs text-slate-500">
                  Show reports that match any selected domain. Leave empty for all.
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={domainFilter.length === 0}
                  onCheckedChange={(checked) => {
                    if (checked) setDomainFilter([]);
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  ({reports.length}) All domains
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {allReportDomains.map((d) => (
                  <DropdownMenuCheckboxItem
                    key={d}
                    checked={domainFilter.includes(d)}
                    onCheckedChange={() => toggleDomainFilter(d)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    ({reportCountByDomain[d] ?? 0}) {formatDomainBadgeLabel(d)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto gap-2">
                <Filter className="h-4 w-4 shrink-0" />
                <span>Export filters</span>
                {activeExportFilterCount > 0 ? (
                  <Badge variant="secondary" className="rounded-full px-2 font-normal">
                    {activeExportFilterCount}
                  </Badge>
                ) : null}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Export filters</DialogTitle>
                <DialogDescription className="text-left text-slate-600">
                  Optional narrowers for supported downloads (Enrolment exports, CU corrections,
                  exam form). For CU Registration PDFs / Documents ZIP, pick exactly one regulation
                  here.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Academic year</Label>
                  <Select value={exportAcademicYearId} onValueChange={setExportAcademicYearId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAcademicYears.map((y) => (
                        <SelectItem key={y.id} value={String(y.id)}>
                          {y.year}
                          {currentAcademicYear?.id === y.id ? " (current)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Regulation</Label>
                  <MultiSelectDropdown
                    placeholder="All regulations"
                    options={regulationFilterOptions}
                    selectedOptions={filterRegulationIds.map(String)}
                    onChange={(s) => setFilterRegulationIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Affiliation</Label>
                  <MultiSelectDropdown
                    placeholder="All affiliations"
                    options={affiliationFilterOptions}
                    selectedOptions={filterAffiliationIds.map(String)}
                    onChange={(s) => setFilterAffiliationIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Program course</Label>
                  <p className="text-[11px] text-slate-500">
                    List follows affiliation and regulation above (leave those empty for all
                    courses).
                  </p>
                  <MultiSelectDropdown
                    placeholder="All program courses"
                    options={programCourseFilterOptions}
                    selectedOptions={filterProgramCourseIds.map(String)}
                    onChange={(s) => setFilterProgramCourseIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Semester (class)</Label>
                  <MultiSelectDropdown
                    placeholder="All semesters"
                    options={semesterClassFilterOptions}
                    selectedOptions={filterClassIds.map(String)}
                    onChange={(s) => setFilterClassIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFilterRegulationIds([]);
                    setFilterAffiliationIds([]);
                    setFilterProgramCourseIds([]);
                    setFilterClassIds([]);
                  }}
                >
                  Clear narrowers
                </Button>
                <Button type="button" onClick={() => setFilterDialogOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reports Table — scroll body; header stays visible */}
      <Table
        className="w-full min-w-[720px] border-separate border-spacing-0"
        containerClassName="w-full max-h-[min(72vh,calc(100vh-10rem))] overflow-auto rounded-md border border-slate-200 shadow-sm"
      >
        <TableHeader className="sticky top-0 z-20 bg-slate-100 shadow-[inset_0_-1px_0_0_rgb(226_232_240)]">
          <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
            <TableHead className="w-[5%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Sr. No.
            </TableHead>
            <TableHead className="w-[18%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Domain
            </TableHead>
            <TableHead className="w-[18%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Report
            </TableHead>
            <TableHead className="w-[28%] sm:w-72 lg:w-[380px] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Description
            </TableHead>
            <TableHead className="w-[18%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.map((report, index) => {
            return (
              <TableRow key={report.id} className="hover:bg-slate-50">
                <TableCell className="w-[5%] font-medium border border-slate-200 text-xs sm:text-sm py-3 sm:py-4 px-2 sm:px-4">
                  {index + 1}
                </TableCell>
                <TableCell className="w-[18%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    {getReportDomains(report).map((domain) => (
                      <Badge
                        key={domain}
                        variant="outline"
                        title={formatDomainBadgeLabel(domain)}
                        className={cn("text-xs max-w-full", domainBadgeClassName(domain))}
                      >
                        {formatDomainBadgeLabel(domain)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="w-[18%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-shrink-0">{report.icon}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 text-xs sm:text-sm ">
                        {report.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[28%] text-slate-600 border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm whitespace-normal break-words">
                  {report.description}
                </TableCell>
                <TableCell className="w-[18%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                  <Button
                    onClick={report.downloadFunction}
                    disabled={
                      isExporting ||
                      (report.requiresAcademicYear && !effectiveAcademicYearId) ||
                      (report.requiresRegulation && !cuZipRegulationReady)
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
                    ) : report.actionType === "upload" ? (
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

      <AlertDialog
        open={cuRollRegValidationDialogOpen}
        onOpenChange={setCuRollRegValidationDialogOpen}
      >
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
                    <li
                      key={h}
                      className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-slate-50"
                    >
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
              The uploaded Excel contains UIDs that already exist in the system. Please remove these
              UIDs from the Excel and re-upload.
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
