import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
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
import { Download, FileText, Clock, Filter, ClipboardCheck } from "lucide-react";
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
import DialogMultiSelect from "@/components/ui/DialogMultiSelect";
import { ExportService, type ReportExportQueryFilters } from "@/services/exportService";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { cn } from "@/lib/utils";

interface ReportItem {
  id: string;
  domain: string;
  name: string;
  description: string;
  icon: ReactNode;
  downloadFunction: () => Promise<void>;
  requiresAcademicYear?: boolean;
}

/** Declaration context values mirror `declaration_master_context` in the DB. */
const DECLARATION_CONTEXTS = ["ADMISSION", "EXAM", "FEES", "LIBRARY", "OTHER"] as const;
/** Sentinel for the "all contexts" option (Select cannot hold an empty value). */
const ALL_CONTEXTS = "ALL";

/** Display domain keys (e.g. `CAREER_PROGRESSION`) as sentence case in the UI. */
function domainToSentenceCase(domain: string): string {
  const s = domain.replace(/_/g, " ").trim().toLowerCase();
  if (!s.length) return domain;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDomainBadgeLabel(domain: string): string {
  return domainToSentenceCase(domain);
}

function domainBadgeClassName(domain: string): string {
  switch (domain) {
    case "CAREER_PROGRESSION":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "DECLARATION":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

export default function DocumentIssuanceReportsPage() {
  useRestrictTempUsers();
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);
  // Correlates socket progress to the in-flight background report job. A ref so
  // the socket handler always sees the latest id without re-subscribing.
  const activeJobIdRef = useRef<string | null>(null);

  // Use existing academic year hook
  const { availableAcademicYears, loadAcademicYears, currentAcademicYear } = useAcademicYear();

  // Dropdown states
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  /** Academic year id used for all exports (toolbar). */
  const [exportAcademicYearId, setExportAcademicYearId] = useState("");
  const [filterRegulationIds, setFilterRegulationIds] = useState<number[]>([]);
  const [filterAffiliationIds, setFilterAffiliationIds] = useState<number[]>([]);
  const [filterProgramCourseIds, setFilterProgramCourseIds] = useState<number[]>([]);
  const [filterClassIds, setFilterClassIds] = useState<number[]>([]);
  /** Declaration-only narrower; ignored by the career-progression report. */
  const [filterDeclarationContext, setFilterDeclarationContext] = useState<string>(ALL_CONTEXTS);

  // Authenticated user id for scoping socket room
  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();

  // Memoize the progress update handler to prevent re-renders
  const handleProgressUpdate = useCallback((data: ProgressUpdate) => {
    const jobId = (data?.meta as { jobId?: string } | undefined)?.jobId;
    // Correlate a report download by its jobId; drop events belonging to a
    // different in-flight job.
    if (activeJobIdRef.current && jobId && jobId !== activeJobIdRef.current) return;
    setCurrentProgressUpdate(data);

    if (data.status === "completed") {
      // Report job finished → fetch the generated file, then clear the job.
      if (jobId && jobId === activeJobIdRef.current) {
        void ExportService.downloadReportJobFile(jobId, data.fileName || "report").catch((e) =>
          toast.error(e instanceof Error ? e.message : "Failed to download report"),
        );
        activeJobIdRef.current = null;
      }
      setIsExporting(false);
      // The modal auto-closes on the completed status in ExportProgressDialog
    } else if (data.status === "error") {
      if (jobId && jobId === activeJobIdRef.current) activeJobIdRef.current = null;
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
        if (availableAcademicYears.length === 0) {
          loadAcademicYears();
        }

        const regulationTypesData = await getRegulationTypes();
        setRegulationTypes(Array.isArray(regulationTypesData) ? regulationTypesData : []);

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

  const buildReportFilters = useCallback((): ReportExportQueryFilters => {
    const ay = Number(effectiveAcademicYearId);
    return {
      academicYearId: Number.isFinite(ay) && ay > 0 ? ay : undefined,
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

  // Report filters flattened to comma-separated query params for a job start.
  const filterParams = useCallback(() => {
    const f = buildReportFilters();
    return {
      programCourseIds: f.programCourseIds?.length ? f.programCourseIds.join(",") : undefined,
      affiliationIds: f.affiliationIds?.length ? f.affiliationIds.join(",") : undefined,
      regulationTypeIds: f.regulationTypeIds?.length ? f.regulationTypeIds.join(",") : undefined,
      classIds: f.classIds?.length ? f.classIds.join(",") : undefined,
    };
  }, [buildReportFilters]);

  /**
   * Start a background report job: opens the progress dialog, POSTs to start the
   * job, and stores the jobId. Real progress + the finished-file download are
   * driven by the socket handler (correlated on meta.jobId).
   */
  const runReportJob = useCallback(
    async (
      reportKey: string,
      label: string,
      params: Record<string, string | number | undefined | null>,
    ) => {
      setIsExporting(true);
      setExportProgressOpen(true);
      activeJobIdRef.current = null;
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        message: `Starting ${label}…`,
        progress: 0,
        status: "started",
        createdAt: new Date(),
      });
      try {
        const { jobId } = await ExportService.startReportJob(reportKey, params);
        activeJobIdRef.current = jobId;
      } catch (error) {
        activeJobIdRef.current = null;
        setIsExporting(false);
        setCurrentProgressUpdate({
          id: `export_${Date.now()}`,
          userId,
          type: "export_progress",
          message: `Failed to start ${label}`,
          progress: 0,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          createdAt: new Date(),
        });
        toast.error(
          error instanceof Error && error.message ? error.message : `Failed to start ${label}`,
        );
      }
    },
    [userId],
  );

  // Thin error boundary around a report download. Progress + the dialog are
  // owned by runReportJob (background job + socket); this only catches a throw
  // before the job starts.
  const handleDownload = async (reportId: string, downloadFunction: () => Promise<void>) => {
    try {
      await downloadFunction();
    } catch (error) {
      console.error(`Download failed for ${reportId}:`, error);
      activeJobIdRef.current = null;
      setIsExporting(false);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        message: "Export failed due to an error",
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date(),
      });
      toast.error(
        error instanceof Error && error.message ? error.message : `Failed to download ${reportId}`,
      );
    }
  };

  const downloadCareerProgressionFormReport = async () => {
    const f = buildReportFilters();
    await runReportJob("career-progression-form-report", "Career Progression Form Report", {
      academicYearId: f.academicYearId,
      ...filterParams(),
    });
  };

  const downloadDeclarationReport = async () => {
    const f = buildReportFilters();
    await runReportJob("declaration-report", "Declaration Report", {
      academicYearId: f.academicYearId,
      ...filterParams(),
      context: filterDeclarationContext === ALL_CONTEXTS ? undefined : filterDeclarationContext,
    });
  };

  const reports: ReportItem[] = [
    {
      id: "career-progression-form-report",
      domain: "CAREER_PROGRESSION",
      name: "Career Progression Form Report",
      description:
        "Student career-progression submissions with one column per configured certificate field.",
      icon: <FileText className="h-5 w-5 text-sky-600" />,
      downloadFunction: () =>
        handleDownload("career-progression-form-report", downloadCareerProgressionFormReport),
      requiresAcademicYear: false,
    },
    {
      id: "declaration-report",
      domain: "DECLARATION",
      name: "Declaration Report",
      description:
        "Declarations recorded against student promotions, with per-statement agreement and captured field values.",
      icon: <ClipboardCheck className="h-5 w-5 text-amber-600" />,
      downloadFunction: () => handleDownload("declaration-report", downloadDeclarationReport),
      requiresAcademicYear: false,
    },
  ];

  const activeExportFilterCount =
    filterRegulationIds.length +
    filterAffiliationIds.length +
    filterProgramCourseIds.length +
    filterClassIds.length +
    (filterDeclarationContext === ALL_CONTEXTS ? 0 : 1);

  const semesterClasses = useMemo(
    () =>
      [...classesList]
        .filter((c) => c.type === "SEMESTER" && c.isActive !== false)
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

  // Drop program-course selections that the cascade no longer offers.
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

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Document Issuance Reports
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Download career progression and declaration reports
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-end">
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
            <DialogContent className="flex max-h-[min(90vh,720px)] max-w-md flex-col overflow-hidden sm:max-w-lg">
              <DialogHeader className="shrink-0">
                <DialogTitle>Export filters</DialogTitle>
                <DialogDescription className="text-left text-slate-600">
                  Optional narrowers for the downloads below. Leave a filter empty to include
                  everything. Context applies to the Declaration Report only.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Academic year</Label>
                  <Select value={exportAcademicYearId} onValueChange={setExportAcademicYearId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All years</SelectItem>
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
                  <DialogMultiSelect
                    placeholder="All regulations"
                    options={regulationFilterOptions}
                    selectedOptions={filterRegulationIds.map(String)}
                    onChange={(s) => setFilterRegulationIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Affiliation</Label>
                  <DialogMultiSelect
                    placeholder="All affiliations"
                    options={affiliationFilterOptions}
                    selectedOptions={filterAffiliationIds.map(String)}
                    onChange={(s) => setFilterAffiliationIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Programme course</Label>
                  <p className="text-[11px] text-slate-500">
                    List follows affiliation and regulation above (leave those empty for all
                    courses).
                  </p>
                  <DialogMultiSelect
                    placeholder="All programme courses"
                    options={programCourseFilterOptions}
                    selectedOptions={filterProgramCourseIds.map(String)}
                    onChange={(s) => setFilterProgramCourseIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Semester (class)</Label>
                  <DialogMultiSelect
                    placeholder="All semesters"
                    options={semesterClassFilterOptions}
                    selectedOptions={filterClassIds.map(String)}
                    onChange={(s) => setFilterClassIds(parseIdStrings(s))}
                    contentClassName="min-w-[280px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Context</Label>
                  <p className="text-[11px] text-slate-500">
                    Declaration Report only — the Career Progression Form Report ignores it.
                  </p>
                  <Select
                    value={filterDeclarationContext}
                    onValueChange={setFilterDeclarationContext}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All contexts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CONTEXTS}>All contexts</SelectItem>
                      {DECLARATION_CONTEXTS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {domainToSentenceCase(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="shrink-0 gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFilterRegulationIds([]);
                    setFilterAffiliationIds([]);
                    setFilterProgramCourseIds([]);
                    setFilterClassIds([]);
                    setFilterDeclarationContext(ALL_CONTEXTS);
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
          {reports.map((report, index) => (
            <TableRow key={report.id} className="hover:bg-slate-50">
              <TableCell className="w-[5%] font-medium border border-slate-200 text-xs sm:text-sm py-3 sm:py-4 px-2 sm:px-4">
                {index + 1}
              </TableCell>
              <TableCell className="w-[18%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    title={formatDomainBadgeLabel(report.domain)}
                    className={cn("text-xs max-w-full", domainBadgeClassName(report.domain))}
                  >
                    {formatDomainBadgeLabel(report.domain)}
                  </Badge>
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
                    isExporting || (report.requiresAcademicYear && !effectiveAcademicYearId)
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
                      <span>Download</span>
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
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
