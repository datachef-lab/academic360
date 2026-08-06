/**
 * Library reports — flat catalog UI mirroring the platform-wide Reports page
 * (apps/main-console/src/features/reports/page/index.tsx). Plain h1 header,
 * multi-select Domain filter, sticky-header table, per-row Download button,
 * and a shared "Export filters" dialog with the full slice-and-dice set
 * (branch, date range, academic year, affiliation, regulation, program
 * course, class/semester, shift, session, section, user type, patron
 * category, community, gender, item category, circulation type, return
 * status, fine status, zone).
 *
 * Downloads hit the backend `/api/library/reports/<id>/download` endpoints —
 * every workbook is built with ExcelJS + applyStandardExcelReportTableStyling
 * on the server so formatting is consistent across every report.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DialogMultiSelect from "@/components/ui/DialogMultiSelect";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Clock,
  Coins,
  DoorOpen,
  Download,
  Filter,
  LineChart,
  ScrollText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibraryReportFilters } from "@/services/library-reports.service";
import { getLibraryBranches } from "@/services/library-branches.service";
import { getLibraryPatronCategories } from "@/services/library-patron-categories.service";
import { getLibraryItemCategories } from "@/services/library-item-categories.service";
import { getLibraryZones } from "@/services/library-zones.service";
import {
  getAffiliations,
  getProgramCourses,
  getRegulationTypes,
} from "@/services/course-design.api";
import { getAllClasses } from "@/services/classes.service";
import { getAllSections, getAllShifts } from "@/services/academic";
import { findAllSessions } from "@/services/session.service";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { ExportService } from "@/services/exportService";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";
import type { ProgressUpdate } from "@/types/progress";

type Domain =
  | "CIRCULATION"
  | "INVENTORY"
  | "FOOTFALL"
  | "PUBLICATIONS"
  | "PREDICTIONS"
  | "COMPLIANCE";

type ReportEntry = {
  id: string;
  /** Backend job key registered in `apps/backend/src/features/reports/report-generators.ts`. */
  jobKey: string;
  domain: Domain;
  name: string;
  description: string;
  icon: ReactNode;
  requiresAcademicYear?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Report catalog — 12 rows after the merges:
//   - Book circulation (was: overdue + separate returned + issued)
//   - Fines (was: outstanding + collected as two)
//   - Popular / high-demand books (was: popular + high-demand as two)
// The Batch-wise demographic report was dropped — the Export filters dialog
// now carries programme course / class / shift / etc., so any circulation or
// footfall report can be sliced by batch.
// ─────────────────────────────────────────────────────────────────────────────

const REPORTS: ReportEntry[] = [
  {
    id: "book-circulation",
    jobKey: "library-book-circulation",
    domain: "CIRCULATION",
    name: "Book circulation",
    description:
      "Every issued, returned, overdue, reissued or forced-issue event with full user, book and copy details.",
    icon: <ScrollText className="h-5 w-5 text-amber-600" />,
  },
  {
    id: "fines",
    jobKey: "library-fines",
    domain: "CIRCULATION",
    name: "Fines (outstanding + collected)",
    description:
      "Unpaid fines with student and book context, collected fine payments, and a summary of totals.",
    icon: <Coins className="h-5 w-5 text-amber-600" />,
  },
  {
    id: "popular-books",
    jobKey: "library-popular-books",
    domain: "CIRCULATION",
    name: "Popular / high-demand books",
    description:
      "Top titles by issues in the window, plus a second sheet sorted by issues per copy (buy-more candidates).",
    icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
  },
  {
    id: "stock-summary",
    jobKey: "library-stock-summary",
    domain: "INVENTORY",
    name: "Stock summary",
    description: "Number of copies grouped by branch, item category and status.",
    icon: <ClipboardList className="h-5 w-5 text-emerald-600" />,
  },
  {
    id: "holdings",
    jobKey: "library-holdings",
    domain: "INVENTORY",
    name: "Books & copies (holdings)",
    description:
      "Holdings grouped four ways — by item category, by copy status, by language and by publisher — one sheet each.",
    icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
  },
  {
    id: "entry-exit",
    jobKey: "library-entry-exit",
    domain: "FOOTFALL",
    name: "Entry / Exit footfall",
    description:
      "Every entry/exit event with the same user context columns the entry/exit page uses, plus a daily summary sheet.",
    icon: <DoorOpen className="h-5 w-5 text-teal-600" />,
  },
  {
    id: "publications",
    jobKey: "library-publications",
    domain: "PUBLICATIONS",
    name: "Publications usage",
    description:
      "Circulation aggregated by publisher, journal (with ISSN + active subscriptions) and series — one sheet each.",
    icon: <ScrollText className="h-5 w-5 text-indigo-600" />,
  },
  {
    id: "book-demand-forecast",
    jobKey: "library-book-demand-forecast",
    domain: "PREDICTIONS",
    name: "Book demand estimate (next 30 days)",
    description:
      "Per-title estimated issues for the next 30 days using recent-month averages and time-of-year adjustments.",
    icon: <LineChart className="h-5 w-5 text-fuchsia-600" />,
  },
  {
    id: "footfall-forecast",
    jobKey: "library-footfall-forecast",
    domain: "PREDICTIONS",
    name: "Footfall estimate (next 14 days)",
    description:
      "Day-by-day estimated library entries for the next 14 days with a pre-exam uplift factor.",
    icon: <LineChart className="h-5 w-5 text-fuchsia-600" />,
  },
  {
    id: "naac",
    jobKey: "library-naac",
    domain: "COMPLIANCE",
    name: "NAAC criterion 4.2",
    description: "NAAC evidence figures for library resources and expenditure by academic year.",
    icon: <ShieldCheck className="h-5 w-5 text-purple-600" />,
    requiresAcademicYear: true,
  },
  {
    id: "nirf",
    jobKey: "library-nirf",
    domain: "COMPLIANCE",
    name: "NIRF library resources",
    description: "NIRF submission figures — books, copies, e-journals, annual spend, circulation.",
    icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
    requiresAcademicYear: true,
  },
  {
    id: "aishe",
    jobKey: "library-aishe",
    domain: "COMPLIANCE",
    name: "AISHE library figures",
    description:
      "AISHE library data — books & volumes available, journals subscribed, subscription spend.",
    icon: <Bell className="h-5 w-5 text-purple-600" />,
    requiresAcademicYear: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Static enums the backend accepts (mirrors library-report-filters.ts values)
// ─────────────────────────────────────────────────────────────────────────────

const USER_TYPE_OPTIONS = [
  { label: "Student", value: "STUDENT" },
  { label: "Staff", value: "STAFF" },
  { label: "Faculty", value: "FACULTY" },
  { label: "Parents", value: "PARENTS" },
  { label: "Admin", value: "ADMIN" },
];
const COMMUNITY_OPTIONS = [
  { label: "Gujarati", value: "GUJARATI" },
  { label: "Non-Gujarati", value: "NON-GUJARATI" },
];
const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];
const CIRCULATION_TYPE_OPTIONS = [
  { label: "Issue", value: "ISSUE" },
  { label: "Reissue", value: "REISSUE" },
  { label: "Forced issue", value: "FORCED_ISSUE" },
];
const RETURN_STATUS_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Returned", value: "RETURNED" },
  { label: "Not returned", value: "NOT_RETURNED" },
];
const FINE_STATUS_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Paid", value: "PAID" },
  { label: "Outstanding", value: "OUTSTANDING" },
  { label: "Waived", value: "WAIVED" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Domain badge
// ─────────────────────────────────────────────────────────────────────────────

function domainToSentenceCase(domain: string): string {
  const s = domain.replace(/_/g, " ").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function domainBadgeClassName(domain: Domain): string {
  switch (domain) {
    case "CIRCULATION":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "INVENTORY":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "FOOTFALL":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "PUBLICATIONS":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "PREDICTIONS":
      return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    case "COMPLIANCE":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

const parseIdStrings = (values: string[]): number[] =>
  values.map((v) => Number(v)).filter((n) => Number.isFinite(n));

type Option = { label: string; value: string };

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LibraryReportsPage() {
  const [domainFilter, setDomainFilter] = useState<Domain[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Background-job + progress-dialog state — mirrors the platform Reports page
  // (apps/main-console/src/features/reports/page/index.tsx).
  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const activeReportRef = useRef<ReportEntry | null>(null);

  // Academic years — dropdown source
  const { availableAcademicYears, currentAcademicYear, loadAcademicYears } = useAcademicYear();
  useEffect(() => {
    if (availableAcademicYears.length === 0) loadAcademicYears();
  }, [availableAcademicYears.length, loadAcademicYears]);

  // Filter values — sectioned by group for the dialog
  const [branchId, setBranchId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");

  // Default the academic year to the current one as soon as it loads.
  useEffect(() => {
    if (academicYear) return;
    const cur = currentAcademicYear?.year || availableAcademicYears[0]?.year;
    if (cur) setAcademicYear(cur);
  }, [availableAcademicYears, currentAcademicYear, academicYear]);

  const [affiliationIds, setAffiliationIds] = useState<number[]>([]);
  const [regulationTypeIds, setRegulationTypeIds] = useState<number[]>([]);
  const [programCourseIds, setProgramCourseIds] = useState<number[]>([]);
  const [classIds, setClassIds] = useState<number[]>([]);
  const [shiftIds, setShiftIds] = useState<number[]>([]);
  const [sessionIds, setSessionIds] = useState<number[]>([]);
  const [sectionIds, setSectionIds] = useState<number[]>([]);

  const [userTypes, setUserTypes] = useState<string[]>([]);
  const [patronCategoryIds, setPatronCategoryIds] = useState<number[]>([]);
  const [communities, setCommunities] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);

  const [itemCategoryIds, setItemCategoryIds] = useState<number[]>([]);
  const [circulationTypes, setCirculationTypes] = useState<string[]>([]);
  const [returnStatus, setReturnStatus] = useState<string>("");
  const [fineStatus, setFineStatus] = useState<string>("");

  const [zoneIds, setZoneIds] = useState<number[]>([]);

  // Option lists loaded from the platform services
  const [branchOptions, setBranchOptions] = useState<Option[]>([]);
  const [affiliationOptions, setAffiliationOptions] = useState<Option[]>([]);
  const [regulationOptions, setRegulationOptions] = useState<Option[]>([]);
  const [allProgramCourses, setAllProgramCourses] = useState<
    Array<{
      id: number;
      name: string;
      shortName?: string | null;
      affiliationId?: number | null;
      regulationTypeId?: number | null;
    }>
  >([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [shiftOptions, setShiftOptions] = useState<Option[]>([]);
  const [sessionOptions, setSessionOptions] = useState<Option[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
  const [patronCategoryOptions, setPatronCategoryOptions] = useState<Option[]>([]);
  const [itemCategoryOptions, setItemCategoryOptions] = useState<Option[]>([]);
  const [zoneOptions, setZoneOptions] = useState<Option[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [
          branches,
          affiliations,
          regulations,
          programCourses,
          classes,
          shifts,
          sessions,
          sections,
          patrons,
          items,
          zones,
        ] = await Promise.all([
          getLibraryBranches({ page: 1, limit: 200 }),
          getAffiliations().catch(() => []),
          getRegulationTypes().catch(() => []),
          getProgramCourses().catch(() => []),
          getAllClasses().catch(() => []),
          getAllShifts().catch(() => []),
          findAllSessions().catch(() => ({ payload: [] as unknown[] }) as never),
          getAllSections().catch(() => []),
          getLibraryPatronCategories({ page: 1, limit: 200 }).catch(
            () => ({ payload: { rows: [] } }) as never,
          ),
          getLibraryItemCategories({ page: 1, limit: 200 }).catch(
            () => ({ payload: { rows: [] } }) as never,
          ),
          getLibraryZones({ page: 1, limit: 200 }).catch(
            () => ({ payload: { rows: [] } }) as never,
          ),
        ]);
        setBranchOptions(
          (branches.payload?.rows ?? []).map((b) => ({
            value: String(b.id),
            label: b.code ? `${b.name} (${b.code})` : b.name,
          })),
        );
        const affArr = (Array.isArray(affiliations) ? affiliations : []) as Array<{
          id?: number | null;
          name?: string | null;
          shortName?: string | null;
        }>;
        setAffiliationOptions(
          affArr
            .filter((a) => a?.id != null)
            .map((a) => ({
              value: String(a.id),
              label: a.shortName || a.name || `Affiliation ${a.id}`,
            })),
        );
        const regArr = (Array.isArray(regulations) ? regulations : []) as Array<{
          id?: number | null;
          name?: string | null;
          shortName?: string | null;
        }>;
        setRegulationOptions(
          regArr
            .filter((r) => r?.id != null)
            .map((r) => ({
              value: String(r.id),
              label: r.shortName || r.name || `Regulation ${r.id}`,
            })),
        );
        const pcArr = (Array.isArray(programCourses) ? programCourses : []) as Array<{
          id?: number | null;
          name?: string | null;
          shortName?: string | null;
          affiliationId?: number | null;
          regulationTypeId?: number | null;
        }>;
        setAllProgramCourses(
          pcArr
            .filter((pc) => pc?.id != null)
            .map((pc) => ({
              id: pc.id as number,
              name: pc.name || pc.shortName || `Program ${pc.id}`,
              shortName: pc.shortName ?? null,
              affiliationId: pc.affiliationId ?? null,
              regulationTypeId: pc.regulationTypeId ?? null,
            })),
        );
        setClassOptions(
          (Array.isArray(classes) ? classes : [])
            .filter((c) => c && (c as { type?: string }).type === "SEMESTER")
            .map((c) => ({
              value: String((c as { id: number }).id),
              label: (c as { name: string }).name,
            })),
        );
        setShiftOptions(
          (Array.isArray(shifts) ? shifts : []).map((s) => ({
            value: String((s as { id: number }).id),
            label: (s as { name: string }).name,
          })),
        );
        const sessionArr =
          (sessions as { payload?: Array<{ id?: number; name?: string; year?: string }> })
            ?.payload ?? [];
        setSessionOptions(
          sessionArr
            .filter(
              (s): s is { id: number; name?: string; year?: string } =>
                s != null && typeof s.id === "number",
            )
            .map((s) => ({ value: String(s.id), label: s.name || s.year || `Session ${s.id}` })),
        );
        setSectionOptions(
          (Array.isArray(sections) ? sections : []).map((s) => ({
            value: String((s as { id: number }).id),
            label: (s as { name: string }).name,
          })),
        );
        setPatronCategoryOptions(
          (
            (
              patrons as {
                payload?: { rows?: Array<{ id: number; name: string; code?: string | null }> };
              }
            ).payload?.rows ?? []
          ).map((r) => ({
            value: String(r.id),
            label: r.code ? `${r.name} (${r.code})` : r.name,
          })),
        );
        setItemCategoryOptions(
          (
            (
              items as {
                payload?: { rows?: Array<{ id: number; name: string; code?: string | null }> };
              }
            ).payload?.rows ?? []
          ).map((r) => ({
            value: String(r.id),
            label: r.code ? `${r.name} (${r.code})` : r.name,
          })),
        );
        setZoneOptions(
          (
            (
              zones as {
                payload?: { rows?: Array<{ id: number; name: string; code?: string | null }> };
              }
            ).payload?.rows ?? []
          ).map((r) => ({
            value: String(r.id),
            label: r.code ? `${r.name} (${r.code})` : r.name,
          })),
        );
      } catch (e) {
        console.error("Failed to load report filter options", e);
      }
    })();
  }, []);

  // Programme courses narrow by selected affiliation + regulation, same pattern
  // as apps/main-console/src/features/reports/page/index.tsx:1150-1178
  const programCourseFilterOptions = useMemo<Option[]>(() => {
    let list = allProgramCourses;
    if (affiliationIds.length > 0) {
      const aff = new Set(affiliationIds);
      list = list.filter((pc) => pc.affiliationId != null && aff.has(pc.affiliationId));
    }
    if (regulationTypeIds.length > 0) {
      const reg = new Set(regulationTypeIds);
      list = list.filter((pc) => pc.regulationTypeId != null && reg.has(pc.regulationTypeId));
    }
    return list
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((pc) => ({ value: String(pc.id), label: pc.name }));
  }, [allProgramCourses, affiliationIds, regulationTypeIds]);

  useEffect(() => {
    const allowed = new Set(programCourseFilterOptions.map((o) => Number(o.value)));
    setProgramCourseIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [programCourseFilterOptions]);

  const allDomains = useMemo(
    () =>
      Array.from(new Set(REPORTS.map((r) => r.domain))).sort((a, b) =>
        a.localeCompare(b),
      ) as Domain[],
    [],
  );

  const reportCountByDomain = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of REPORTS) acc[r.domain] = (acc[r.domain] ?? 0) + 1;
    return acc;
  }, []);

  const filteredReports = useMemo(
    () =>
      domainFilter.length === 0 ? REPORTS : REPORTS.filter((r) => domainFilter.includes(r.domain)),
    [domainFilter],
  );

  const toggleDomainFilter = (domain: Domain) => {
    setDomainFilter((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain],
    );
  };

  const activeExportFilterCount =
    (branchId ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (academicYear ? 1 : 0) +
    affiliationIds.length +
    regulationTypeIds.length +
    programCourseIds.length +
    classIds.length +
    shiftIds.length +
    sessionIds.length +
    sectionIds.length +
    userTypes.length +
    patronCategoryIds.length +
    communities.length +
    genders.length +
    itemCategoryIds.length +
    circulationTypes.length +
    (returnStatus ? 1 : 0) +
    (fineStatus ? 1 : 0) +
    zoneIds.length;

  const filters: LibraryReportFilters = {
    branchId: branchId === "" ? null : Number(branchId),
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    academicYear: academicYear || null,
    affiliationIds,
    regulationTypeIds,
    programCourseIds,
    classIds,
    shiftIds,
    sessionIds,
    sectionIds,
    userTypes,
    patronCategoryIds,
    communities,
    genders,
    itemCategoryIds,
    circulationTypes,
    returnStatus: returnStatus || null,
    fineStatus: fineStatus || null,
    zoneIds,
  };

  const clearFilters = () => {
    setBranchId("");
    setDateFrom("");
    setDateTo("");
    setAffiliationIds([]);
    setRegulationTypeIds([]);
    setProgramCourseIds([]);
    setClassIds([]);
    setShiftIds([]);
    setSessionIds([]);
    setSectionIds([]);
    setUserTypes([]);
    setPatronCategoryIds([]);
    setCommunities([]);
    setGenders([]);
    setItemCategoryIds([]);
    setCirculationTypes([]);
    setReturnStatus("");
    setFineStatus("");
    setZoneIds([]);
  };

  // Flatten filters to a single-string-per-key params bag for
  // ExportService.startReportJob (which encodes each as a URL query param).
  const flatFilterParams = useMemo(() => {
    const out: Record<string, string | number | undefined | null> = {};
    if (filters.branchId != null) out.branchId = filters.branchId;
    if (filters.dateFrom) out.dateFrom = filters.dateFrom;
    if (filters.dateTo) out.dateTo = filters.dateTo;
    if (filters.academicYear) out.academicYear = filters.academicYear;
    const joinIds = (arr: number[] | undefined) =>
      arr && arr.length > 0 ? arr.join(",") : undefined;
    const joinStrs = (arr: string[] | undefined) =>
      arr && arr.length > 0 ? arr.join(",") : undefined;
    out.academicYearIds = joinIds(filters.academicYearIds);
    out.affiliationIds = joinIds(filters.affiliationIds);
    out.regulationTypeIds = joinIds(filters.regulationTypeIds);
    out.programCourseIds = joinIds(filters.programCourseIds);
    out.classIds = joinIds(filters.classIds);
    out.shiftIds = joinIds(filters.shiftIds);
    out.sessionIds = joinIds(filters.sessionIds);
    out.sectionIds = joinIds(filters.sectionIds);
    out.patronCategoryIds = joinIds(filters.patronCategoryIds);
    out.itemCategoryIds = joinIds(filters.itemCategoryIds);
    out.zoneIds = joinIds(filters.zoneIds);
    out.userTypes = joinStrs(filters.userTypes);
    out.communities = joinStrs(filters.communities);
    out.genders = joinStrs(filters.genders);
    out.circulationTypes = joinStrs(filters.circulationTypes);
    if (filters.returnStatus) out.returnStatus = filters.returnStatus;
    if (filters.fineStatus) out.fineStatus = filters.fineStatus;
    return out;
  }, [filters]);

  // Progress dialog handler — correlates events by meta.jobId; ignores other
  // background operations happening on the same socket. Once the job hits
  // status "completed", pulls the file via ExportService.downloadReportJobFile.
  const handleProgressUpdate = useCallback((data: ProgressUpdate) => {
    const jobId = (data?.meta as { jobId?: string } | undefined)?.jobId;
    if (activeJobIdRef.current && jobId && jobId !== activeJobIdRef.current) return;
    setCurrentProgressUpdate(data);
    if (data.status === "completed") {
      if (jobId && jobId === activeJobIdRef.current) {
        const fallbackName =
          activeReportRef.current?.name.replace(/[^\w-]+/g, "_") ?? "library-report";
        void ExportService.downloadReportJobFile(jobId, data.fileName || fallbackName).catch((e) =>
          toast.error(e instanceof Error ? e.message : "Failed to download report"),
        );
        activeJobIdRef.current = null;
        activeReportRef.current = null;
      }
      setDownloadingId(null);
    } else if (data.status === "error") {
      if (jobId && jobId === activeJobIdRef.current) {
        activeJobIdRef.current = null;
        activeReportRef.current = null;
      }
      setDownloadingId(null);
    }
  }, []);

  useSocket({ userId, onProgressUpdate: handleProgressUpdate });

  const handleDownload = useCallback(
    async (report: ReportEntry) => {
      if (report.requiresAcademicYear && !academicYear.trim()) {
        toast.error("Academic year is required. Open Export filters to set it.");
        setFilterDialogOpen(true);
        return;
      }
      setDownloadingId(report.id);
      activeReportRef.current = report;
      setExportProgressOpen(true);
      activeJobIdRef.current = null;
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        message: `Starting ${report.name}…`,
        progress: 0,
        status: "started",
        createdAt: new Date(),
      });
      try {
        const { jobId } = await ExportService.startReportJob(report.jobKey, flatFilterParams);
        activeJobIdRef.current = jobId;
      } catch (e) {
        console.error(`Download failed to start for ${report.id}:`, e);
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (e instanceof Error ? e.message : "Failed to start report");
        toast.error(msg);
        setCurrentProgressUpdate({
          id: `export_${Date.now()}`,
          userId,
          type: "export_progress",
          message: msg,
          progress: 0,
          status: "error",
          error: msg,
          createdAt: new Date(),
        });
        activeJobIdRef.current = null;
        activeReportRef.current = null;
        setDownloadingId(null);
      }
    },
    [academicYear, flatFilterParams, userId],
  );

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Library Reports</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Download library reports as Excel. Open Export filters to pin branch, date range,
            academic year, programme course, class, shift, user type and more for every download.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong>Which filters apply:</strong> batch, user and circulation filters (program
            course, class, shift, user type, community, etc.) apply to Book circulation, Fines,
            Popular / high-demand, Entry / Exit and Publications reports. Item category applies to
            Stock summary and Holdings. Zone applies to Entry / Exit only. Academic year is required
            for the Compliance (NAAC / NIRF / AISHE) downloads.
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
                        ? domainToSentenceCase(domainFilter[0]!)
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
                  ({REPORTS.length}) All domains
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {allDomains.map((d) => (
                  <DropdownMenuCheckboxItem
                    key={d}
                    checked={domainFilter.includes(d)}
                    onCheckedChange={() => toggleDomainFilter(d)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    ({reportCountByDomain[d] ?? 0}) {domainToSentenceCase(d)}
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
            <DialogContent className="flex max-h-[min(90vh,780px)] max-w-md flex-col overflow-hidden sm:max-w-2xl">
              <DialogHeader className="shrink-0">
                <DialogTitle>Export filters</DialogTitle>
                <DialogDescription className="text-left text-slate-600">
                  Optional narrowers applied to every download on this page. Reports that don&apos;t
                  care about a filter (e.g. Holdings ignores date range) will just skip it.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-2 px-1">
                {/* Location & time */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Location &amp; time
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Branch</Label>
                      <Select
                        value={branchId || "__all__"}
                        onValueChange={(v) => setBranchId(v === "__all__" ? "" : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All branches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All branches</SelectItem>
                          {branchOptions.map((b) => (
                            <SelectItem key={b.value} value={b.value}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">From date</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To date</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Academic year{" "}
                      <span className="text-slate-500">(required for NAAC / NIRF / AISHE)</span>
                    </Label>
                    <Select
                      value={academicYear || "__none__"}
                      onValueChange={(v) => setAcademicYear(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">(not set)</SelectItem>
                        {availableAcademicYears
                          .filter((y) => y.year)
                          .map((y) => (
                            <SelectItem key={y.id} value={String(y.year)}>
                              {y.year}
                              {currentAcademicYear?.id === y.id ? " (current)" : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                {/* Batch / demographics */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Batch (programme course, class, shift, session, section)
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Affiliation</Label>
                      <DialogMultiSelect
                        placeholder="All affiliations"
                        options={affiliationOptions}
                        selectedOptions={affiliationIds.map(String)}
                        onChange={(s) => setAffiliationIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Regulation type</Label>
                      <DialogMultiSelect
                        placeholder="All regulations"
                        options={regulationOptions}
                        selectedOptions={regulationTypeIds.map(String)}
                        onChange={(s) => setRegulationTypeIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Programme course</Label>
                      <DialogMultiSelect
                        placeholder="All programme courses"
                        options={programCourseFilterOptions}
                        selectedOptions={programCourseIds.map(String)}
                        onChange={(s) => setProgramCourseIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Class / Semester</Label>
                      <DialogMultiSelect
                        placeholder="All classes"
                        options={classOptions}
                        selectedOptions={classIds.map(String)}
                        onChange={(s) => setClassIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Shift</Label>
                      <DialogMultiSelect
                        placeholder="All shifts"
                        options={shiftOptions}
                        selectedOptions={shiftIds.map(String)}
                        onChange={(s) => setShiftIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Session</Label>
                      <DialogMultiSelect
                        placeholder="All sessions"
                        options={sessionOptions}
                        selectedOptions={sessionIds.map(String)}
                        onChange={(s) => setSessionIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Section</Label>
                      <DialogMultiSelect
                        placeholder="All sections"
                        options={sectionOptions}
                        selectedOptions={sectionIds.map(String)}
                        onChange={(s) => setSectionIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                  </div>
                </section>

                {/* User attributes */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User attributes
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">User type</Label>
                      <DialogMultiSelect
                        placeholder="All user types"
                        options={USER_TYPE_OPTIONS}
                        selectedOptions={userTypes}
                        onChange={setUserTypes}
                        contentClassName="min-w-[240px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Library patron category</Label>
                      <DialogMultiSelect
                        placeholder="All patron categories"
                        options={patronCategoryOptions}
                        selectedOptions={patronCategoryIds.map(String)}
                        onChange={(s) => setPatronCategoryIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Community</Label>
                      <DialogMultiSelect
                        placeholder="All communities"
                        options={COMMUNITY_OPTIONS}
                        selectedOptions={communities}
                        onChange={setCommunities}
                        contentClassName="min-w-[240px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Gender</Label>
                      <DialogMultiSelect
                        placeholder="All genders"
                        options={GENDER_OPTIONS}
                        selectedOptions={genders}
                        onChange={setGenders}
                        contentClassName="min-w-[240px]"
                      />
                    </div>
                  </div>
                </section>

                {/* Circulation attributes */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Circulation attributes (issues, fines, book categories)
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Item category</Label>
                      <DialogMultiSelect
                        placeholder="All item categories"
                        options={itemCategoryOptions}
                        selectedOptions={itemCategoryIds.map(String)}
                        onChange={(s) => setItemCategoryIds(parseIdStrings(s))}
                        contentClassName="min-w-[280px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Circulation type</Label>
                      <DialogMultiSelect
                        placeholder="Any circulation type"
                        options={CIRCULATION_TYPE_OPTIONS}
                        selectedOptions={circulationTypes}
                        onChange={setCirculationTypes}
                        contentClassName="min-w-[240px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Return status</Label>
                      <Select
                        value={returnStatus || "__any__"}
                        onValueChange={(v) => setReturnStatus(v === "__any__" ? "" : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__any__">Any</SelectItem>
                          {RETURN_STATUS_OPTIONS.filter((o) => o.value !== "").map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fine status</Label>
                      <Select
                        value={fineStatus || "__any__"}
                        onValueChange={(v) => setFineStatus(v === "__any__" ? "" : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__any__">Any</SelectItem>
                          {FINE_STATUS_OPTIONS.filter((o) => o.value !== "").map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Zone — footfall only */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Zone{" "}
                    <span className="text-[10px] normal-case text-slate-400">
                      (applies to Entry/Exit only)
                    </span>
                  </h3>
                  <div className="space-y-1">
                    <Label className="text-xs">Zone</Label>
                    <DialogMultiSelect
                      placeholder="All zones"
                      options={zoneOptions}
                      selectedOptions={zoneIds.map(String)}
                      onChange={(s) => setZoneIds(parseIdStrings(s))}
                      contentClassName="min-w-[280px]"
                    />
                  </div>
                </section>
              </div>

              <DialogFooter className="shrink-0 gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear all filters
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
            <TableHead className="w-[15%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Domain
            </TableHead>
            <TableHead className="w-[22%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Report
            </TableHead>
            <TableHead className="w-[40%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Description
            </TableHead>
            <TableHead className="w-[18%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.map((report, index) => {
            const isDownloading = downloadingId === report.id;
            const disabled =
              downloadingId !== null || (report.requiresAcademicYear && !academicYear.trim());
            return (
              <TableRow key={report.id} className="hover:bg-slate-50">
                <TableCell className="w-[5%] font-medium border border-slate-200 text-xs sm:text-sm py-3 sm:py-4 px-2 sm:px-4">
                  {index + 1}
                </TableCell>
                <TableCell className="w-[15%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 min-w-0">
                  <Badge
                    variant="outline"
                    title={domainToSentenceCase(report.domain)}
                    className={cn("text-xs max-w-full", domainBadgeClassName(report.domain))}
                  >
                    {domainToSentenceCase(report.domain)}
                  </Badge>
                </TableCell>
                <TableCell className="w-[22%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-shrink-0">{report.icon}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {report.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[40%] text-slate-600 border border-slate-200 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm whitespace-normal break-words">
                  {report.description}
                </TableCell>
                <TableCell className="w-[18%] border border-slate-200 py-3 sm:py-4 px-2 sm:px-4">
                  <Button
                    onClick={() => void handleDownload(report)}
                    disabled={disabled}
                    className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm disabled:opacity-50 w-full sm:w-auto flex-shrink-0"
                    size="sm"
                  >
                    {isDownloading ? (
                      <>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Downloading...</span>
                        <span className="sm:hidden">...</span>
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

      <ExportProgressDialog
        isOpen={exportProgressOpen}
        onClose={() => {
          setExportProgressOpen(false);
          setCurrentProgressUpdate(null);
        }}
        progressUpdate={currentProgressUpdate}
      />
    </div>
  );
}
