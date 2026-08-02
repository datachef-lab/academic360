/**
 * Library reports — flat catalog UI mirroring apps/main-console/src/features/
 * reports/page/index.tsx (the platform-wide Reports page): plain h1 header,
 * multi-select Domain filter, sticky-header table, per-row Download button,
 * and a shared "Export filters" dialog that pins branch/date/year narrowers
 * across every download.
 *
 * Each row downloads a styled Excel client-side (XLSX.json_to_sheet with
 * auto-fit columns, one sheet per section for compound payloads). Paginated
 * endpoints (popular, publications, batch, holdings) are pulled at a
 * larger-than-UI page size (500) so the export is comprehensive.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
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
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAisheReport,
  getBatchUsageReport,
  getBookDemandForecast,
  getFinesCollectedReport,
  getFinesOutstandingReport,
  getFootfallForecast,
  getFootfallReport,
  getHighDemandReport,
  getHoldingsReport,
  getNaacReport,
  getNirfReport,
  getOverdueReport,
  getPopularBooksReport,
  getPublicationUsageReport,
  getStockSummaryReport,
  type ReportFilters,
} from "@/services/library-reports.service";
import { getLibraryBranches } from "@/services/library-branches.service";

type Domain =
  | "CIRCULATION"
  | "INVENTORY"
  | "FOOTFALL"
  | "DEMOGRAPHICS"
  | "PREDICTIONS"
  | "COMPLIANCE";

type Ctx = {
  filters: ReportFilters;
  academicYear: string;
};

type ReportEntry = {
  id: string;
  domain: Domain;
  name: string;
  description: string;
  icon: ReactNode;
  requiresAcademicYear?: boolean;
  download: (ctx: Ctx) => Promise<void>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Excel helper — mirrors handleExportExcel in FilterAndExportComponent (dynamic
// column widths, ISO-dated filename).
// ─────────────────────────────────────────────────────────────────────────────

function autoCols<T extends Record<string, unknown>>(rows: T[]): XLSX.ColInfo[] {
  if (rows.length === 0) return [];
  const first = rows[0] as Record<string, unknown>;
  const headers = Object.keys(first);
  return headers.map((h) => ({
    wch: Math.max(
      15,
      h.length + 2,
      ...rows.map((r) => String((r as Record<string, unknown>)[h] ?? "").length),
    ),
  }));
}

function writeWorkbook(
  filename: string,
  sheets: Array<{ name: string; rows: Array<Record<string, unknown>> }>,
) {
  const nonEmpty = sheets.filter((s) => s.rows.length > 0);
  if (nonEmpty.length === 0) {
    toast.error("No data available for export.");
    return;
  }
  const wb = XLSX.utils.book_new();
  for (const s of nonEmpty) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    ws["!cols"] = autoCols(s.rows);
    // Sheet name max is 31 chars; trim to be safe.
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
  toast.success("Report exported successfully!");
}

const nfDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "");
const nfDateTime = (v?: string | null) => (v ? new Date(v).toLocaleString() : "");

// ─────────────────────────────────────────────────────────────────────────────
// Downloaders — one per catalog row. Paginated endpoints pull pageSize=500 for
// a comprehensive export.
// ─────────────────────────────────────────────────────────────────────────────

const EXPORT_PAGE_SIZE = 500;

async function downloadOverdue({ filters }: Ctx) {
  const r = await getOverdueReport(filters);
  const rows = (r.payload ?? []).map((row, i) => ({
    "#": i + 1,
    User: row.userName ?? `User #${row.userId}`,
    Title: row.bookTitle,
    Accession: row.accessNumber ?? "",
    Branch: row.branchName ?? "",
    "Issued at": nfDate(row.issuedAt),
    "Due at": nfDate(row.dueAt),
    "Days late": row.daysLate,
  }));
  writeWorkbook("Library_Overdue_List", [{ name: "Overdue", rows }]);
}

async function downloadFinesOutstanding({ filters }: Ctx) {
  const r = await getFinesOutstandingReport(filters);
  const p = r.payload;
  if (!p) return writeWorkbook("Library_Fines_Outstanding", []);
  const buckets = p.buckets.map((b) => ({
    Bucket: `${b.bucket} days`,
    Circulations: b.circulationCount,
    "Total outstanding (INR)": b.totalOutstanding,
  }));
  const debtors = p.topDebtors.map((d, i) => ({
    "#": i + 1,
    User: d.userName ?? `User #${d.userId}`,
    "Outstanding (INR)": d.outstanding,
    Circulations: d.circulationCount,
    "Oldest fine": nfDate(d.oldestFineDate),
  }));
  writeWorkbook("Library_Fines_Outstanding", [
    { name: "Age buckets", rows: buckets },
    { name: "Top debtors", rows: debtors },
  ]);
}

async function downloadFinesCollected({ filters }: Ctx) {
  const r = await getFinesCollectedReport(filters);
  const p = r.payload;
  const rows = (p?.rows ?? []).map((row) => ({
    "Payment #": row.paymentId,
    User: row.userId ?? "",
    "Amount (INR)": row.amount,
    "Paid at": nfDateTime(row.paidAt),
  }));
  const summary = p ? [{ "Total collected (INR)": p.total, "Payment count": p.count }] : [];
  writeWorkbook("Library_Fines_Collected", [
    { name: "Summary", rows: summary },
    { name: "Payments", rows },
  ]);
}

async function downloadStockSummary({ filters }: Ctx) {
  const r = await getStockSummaryReport(filters);
  const rows = (r.payload ?? []).map((row) => ({
    Branch: row.branchName,
    Status: row.statusName,
    Copies: row.copyCount,
  }));
  writeWorkbook("Library_Stock_Summary", [{ name: "Stock", rows }]);
}

async function downloadHighDemand({ filters }: Ctx) {
  const r = await getHighDemandReport(filters, 100);
  const rows = (r.payload ?? []).map((row, i) => ({
    "#": i + 1,
    Title: row.title,
    ISBN: row.isbn ?? "",
    Issues: row.issueCount,
    "Copies owned": row.copiesOwned,
    "Issues / copy": row.copiesOwned > 0 ? +(row.issueCount / row.copiesOwned).toFixed(2) : "",
  }));
  writeWorkbook("Library_High_Demand_Titles", [{ name: "High demand", rows }]);
}

async function downloadPopularBooks({ filters }: Ctx) {
  const r = await getPopularBooksReport(filters, { page: 1, pageSize: EXPORT_PAGE_SIZE });
  const rows = (r.payload?.content ?? []).map((row, i) => ({
    "#": i + 1,
    Title: row.title,
    Category: row.categoryName,
    ISBN: row.isbn ?? "",
    Issues: row.issueCount,
    "Unique readers": row.uniqueReaders,
  }));
  writeWorkbook("Library_Popular_Books", [{ name: "Popular", rows }]);
}

async function downloadFootfall({ filters }: Ctx) {
  const r = await getFootfallReport(filters);
  const p = r.payload;
  if (!p) return writeWorkbook("Library_Footfall", []);
  const daily = p.daily.map((row) => ({
    Date: row.date,
    Entries: row.entries,
    "Unique visitors": row.uniqueVisitors,
    "Avg duration (min)": row.avgDurationMinutes,
  }));
  const byHour = p.byHour.map((row) => ({
    Hour: `${String(row.hour).padStart(2, "0")}:00`,
    Entries: row.entries,
  }));
  const byZone = p.byZone.map((row) => ({ Zone: row.zoneName, Entries: row.entries }));
  writeWorkbook("Library_Footfall", [
    { name: "Daily", rows: daily },
    { name: "By hour", rows: byHour },
    { name: "By zone", rows: byZone },
  ]);
}

async function downloadHoldings({ filters }: Ctx) {
  // Bundle all four groupings — one sheet each.
  const groupings = ["category", "status", "language", "publisher"] as const;
  const sheets = await Promise.all(
    groupings.map(async (g) => {
      const r = await getHoldingsReport(filters, g, 1, EXPORT_PAGE_SIZE);
      const rows = (r.payload?.content ?? []).map((row) => ({
        Group: row.groupName,
        Books: row.bookCount,
        Copies: row.copyCount,
        "Value (INR)": row.totalPriceINR,
      }));
      return {
        name: `By ${g}`,
        rows,
      };
    }),
  );
  writeWorkbook("Library_Holdings", sheets);
}

async function downloadPublications({ filters }: Ctx) {
  const dims = ["publisher", "journal", "series"] as const;
  const sheets = await Promise.all(
    dims.map(async (d) => {
      const r = await getPublicationUsageReport(filters, d, 1, EXPORT_PAGE_SIZE);
      const rows = (r.payload?.content ?? []).map((row) => ({
        Name: row.name,
        Titles: row.titleCount,
        Issues: row.issueCount,
        "Unique readers": row.uniqueReaders,
        ...(d === "journal"
          ? {
              ISSN: row.issnNumber ?? "",
              "Active subscriptions": row.activeSubscriptions ?? 0,
            }
          : {}),
      }));
      return { name: `By ${d}`, rows };
    }),
  );
  writeWorkbook("Library_Publications_Usage", sheets);
}

async function downloadBatchUsage({ filters }: Ctx) {
  const metrics = ["circulation", "footfall"] as const;
  const sheets = await Promise.all(
    metrics.map(async (m) => {
      const r = await getBatchUsageReport(filters, m, 1, EXPORT_PAGE_SIZE);
      const rows = (r.payload?.content ?? []).map((row) => ({
        "Program course": row.programCourseName,
        Class: row.className,
        Session: row.sessionName,
        Shift: row.shiftName,
        Students: row.studentCount,
        Events: row.eventCount,
        "Events / student": row.eventsPerStudent,
      }));
      return {
        name: m === "circulation" ? "Book issues" : "Library visits",
        rows,
      };
    }),
  );
  writeWorkbook("Library_Batch_Usage", sheets);
}

async function downloadBookDemandForecast({ filters }: Ctx) {
  const r = await getBookDemandForecast(filters, { horizonDays: 30, limit: 100 });
  const rows = (r.payload?.rows ?? []).map((row, i) => ({
    "#": i + 1,
    Title: row.title,
    "Recent monthly avg": row.recentMonthlyAvg,
    "Seasonal index": row.seasonalIndex,
    Trend: row.trend,
    "Predicted issues (30d)": row.predictedDemand,
    Confidence: row.confidence,
  }));
  writeWorkbook("Library_Book_Demand_Forecast_30d", [{ name: "Book demand", rows }]);
}

async function downloadFootfallForecast({ filters }: Ctx) {
  const r = await getFootfallForecast(filters);
  const p = r.payload;
  if (!p) return writeWorkbook("Library_Footfall_Forecast_14d", []);
  const summary = [{ "Exam uplift factor": p.examUpliftFactor }];
  const exams = p.upcomingExams.map((e) => ({
    Exam: e.name,
    "Commencement date": e.commencementDate,
  }));
  const forecast = p.rows.map((row) => ({
    Date: row.date,
    Day: row.dayOfWeek,
    Baseline: row.baseline,
    "Seasonal idx": row.seasonalIndex,
    "Exam uplift": row.examUplift,
    Predicted: row.predicted,
    "Peak?": row.isPeak ? "Yes" : "",
    Drivers: row.drivers.join("; "),
  }));
  writeWorkbook("Library_Footfall_Forecast_14d", [
    { name: "Summary", rows: summary },
    { name: "Upcoming exams", rows: exams },
    { name: "Forecast", rows: forecast },
  ]);
}

async function downloadNaac({ academicYear }: Ctx) {
  if (!academicYear.trim()) {
    toast.error("Academic year is required. Open Export filters to set it.");
    return;
  }
  const r = await getNaacReport(academicYear.trim());
  const p = r.payload;
  if (!p) return writeWorkbook("Library_NAAC", []);
  const rows = Object.entries(p.metrics).map(([Metric, Value]) => ({ Metric, Value }));
  writeWorkbook(`Library_NAAC_${academicYear.trim()}`, [
    {
      name: "Header",
      rows: [{ Framework: p.framework, Criterion: p.criterion, "Academic year": p.academicYear }],
    },
    { name: "Metrics", rows },
  ]);
}

async function downloadNirf({ academicYear }: Ctx) {
  if (!academicYear.trim()) {
    toast.error("Academic year is required. Open Export filters to set it.");
    return;
  }
  const r = await getNirfReport(academicYear.trim());
  const p = r.payload;
  if (!p) return writeWorkbook("Library_NIRF", []);
  const rows = Object.entries(p.libraryResources).map(([Metric, Value]) => ({ Metric, Value }));
  writeWorkbook(`Library_NIRF_${academicYear.trim()}`, [{ name: "NIRF", rows }]);
}

async function downloadAishe({ academicYear }: Ctx) {
  if (!academicYear.trim()) {
    toast.error("Academic year is required. Open Export filters to set it.");
    return;
  }
  const r = await getAisheReport(academicYear.trim());
  const p = r.payload;
  if (!p) return writeWorkbook("Library_AISHE", []);
  const rows = Object.entries(p.library).map(([Metric, Value]) => ({ Metric, Value }));
  writeWorkbook(`Library_AISHE_${academicYear.trim()}`, [{ name: "AISHE", rows }]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

const REPORTS: ReportEntry[] = [
  {
    id: "overdue",
    domain: "CIRCULATION",
    name: "Overdue list",
    description: "Books currently issued past their due date, ordered by earliest due.",
    icon: <ScrollText className="h-5 w-5 text-amber-600" />,
    download: downloadOverdue,
  },
  {
    id: "fines-outstanding",
    domain: "CIRCULATION",
    name: "Fines outstanding",
    description:
      "Unpaid fine amounts bucketed by age (0-7, 8-30, 31-90, 90+ days) with top debtors.",
    icon: <Coins className="h-5 w-5 text-amber-600" />,
    download: downloadFinesOutstanding,
  },
  {
    id: "fines-collected",
    domain: "CIRCULATION",
    name: "Fines collected",
    description: "Library fine payments (SUCCESS) in the selected date range, with totals.",
    icon: <Coins className="h-5 w-5 text-emerald-600" />,
    download: downloadFinesCollected,
  },
  {
    id: "high-demand-titles",
    domain: "CIRCULATION",
    name: "High-demand titles",
    description:
      "Top titles by issues in the window with a demand-vs-supply ratio for procurement.",
    icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
    download: downloadHighDemand,
  },
  {
    id: "popular-books",
    domain: "CIRCULATION",
    name: "Popular books",
    description: "Titles ranked by issues and unique readers over the selected date range.",
    icon: <BookOpen className="h-5 w-5 text-amber-600" />,
    download: downloadPopularBooks,
  },
  {
    id: "stock-summary",
    domain: "INVENTORY",
    name: "Stock summary",
    description: "Copy counts by branch and status (available, issued, lost, damaged, etc.).",
    icon: <ClipboardList className="h-5 w-5 text-emerald-600" />,
    download: downloadStockSummary,
  },
  {
    id: "holdings",
    domain: "INVENTORY",
    name: "Books & copies (holdings)",
    description:
      "One sheet each for holdings grouped by category, status, language, and publisher.",
    icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
    download: downloadHoldings,
  },
  {
    id: "footfall",
    domain: "FOOTFALL",
    name: "Entry / Exit footfall",
    description:
      "Daily entries, unique visitors and average visit duration; plus by-hour and by-zone breakdowns.",
    icon: <DoorOpen className="h-5 w-5 text-teal-600" />,
    download: downloadFootfall,
  },
  {
    id: "publications",
    domain: "DEMOGRAPHICS",
    name: "Publications usage",
    description:
      "Circulation aggregated by publisher, journal (with ISSN + active subs), and series — one sheet each.",
    icon: <ScrollText className="h-5 w-5 text-indigo-600" />,
    download: downloadPublications,
  },
  {
    id: "batch-usage",
    domain: "DEMOGRAPHICS",
    name: "Batch-wise demographic usage",
    description:
      "Book issues and library visits attributed to each batch (program × class × session × shift).",
    icon: <Users className="h-5 w-5 text-indigo-600" />,
    download: downloadBatchUsage,
  },
  {
    id: "forecast-book-demand",
    domain: "PREDICTIONS",
    name: "Book demand forecast (30 days)",
    description:
      "Statistical per-title 30-day demand forecast: recent monthly avg × month-of-year seasonal index.",
    icon: <LineChart className="h-5 w-5 text-fuchsia-600" />,
    download: downloadBookDemandForecast,
  },
  {
    id: "forecast-footfall",
    domain: "PREDICTIONS",
    name: "Footfall forecast (14 days)",
    description:
      "Statistical 14-day footfall forecast with day-of-week seasonality and pre-exam uplift.",
    icon: <LineChart className="h-5 w-5 text-fuchsia-600" />,
    download: downloadFootfallForecast,
  },
  {
    id: "naac",
    domain: "COMPLIANCE",
    name: "NAAC criterion 4.2",
    description: "NAAC evidence figures for library resources and expenditure by academic year.",
    icon: <ShieldCheck className="h-5 w-5 text-purple-600" />,
    requiresAcademicYear: true,
    download: downloadNaac,
  },
  {
    id: "nirf",
    domain: "COMPLIANCE",
    name: "NIRF library resources",
    description: "NIRF submission figures — books, copies, e-journals, annual spend, circulation.",
    icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
    requiresAcademicYear: true,
    download: downloadNirf,
  },
  {
    id: "aishe",
    domain: "COMPLIANCE",
    name: "AISHE library figures",
    description:
      "AISHE library data — books & volumes available, journals subscribed, subscription spend.",
    icon: <Bell className="h-5 w-5 text-purple-600" />,
    requiresAcademicYear: true,
    download: downloadAishe,
  },
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
    case "DEMOGRAPHICS":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "PREDICTIONS":
      return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    case "COMPLIANCE":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LibraryReportsPage() {
  const [domainFilter, setDomainFilter] = useState<Domain[]>([]);

  // Global "Export filters" state — one dialog controls filters for every download.
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [branchId, setBranchId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("2025-26");
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getLibraryBranches({ page: 1, limit: 200 });
        setBranchOptions(
          (res.payload?.rows ?? []).map((b) => ({
            value: String(b.id),
            label: b.code ? `${b.name} (${b.code})` : b.name,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

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
    (branchId ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (academicYear ? 1 : 0);

  const handleDownload = useCallback(
    async (report: ReportEntry) => {
      if (report.requiresAcademicYear && !academicYear.trim()) {
        toast.error("Academic year is required. Open Export filters to set it.");
        setFilterDialogOpen(true);
        return;
      }
      setDownloadingId(report.id);
      try {
        await report.download({
          filters: {
            branchId: branchId === "" ? null : Number(branchId),
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
          },
          academicYear,
        });
      } catch (e) {
        console.error(`Download failed for ${report.id}:`, e);
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (e instanceof Error ? e.message : "Download failed");
        toast.error(msg);
      } finally {
        setDownloadingId(null);
      }
    },
    [branchId, dateFrom, dateTo, academicYear],
  );

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Library Reports</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Download library reports as Excel. Open Export filters to pin branch, date range or
            academic year for every download.
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
            <DialogContent className="flex max-h-[min(90vh,720px)] max-w-md flex-col overflow-hidden sm:max-w-lg">
              <DialogHeader className="shrink-0">
                <DialogTitle>Export filters</DialogTitle>
                <DialogDescription className="text-left text-slate-600">
                  Optional narrowers applied to every download on this page. Branch and date range
                  scope circulation / footfall reports; academic year is required by the compliance
                  reports (NAAC / NIRF / AISHE).
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Branch</Label>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-800">From date</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-800">To date</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-800">Academic year</Label>
                  <Input
                    placeholder="2025-26"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500">
                    Required by NAAC / NIRF / AISHE downloads.
                  </p>
                </div>
              </div>

              <DialogFooter className="shrink-0 gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBranchId("");
                    setDateFrom("");
                    setDateTo("");
                    setAcademicYear("");
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
    </div>
  );
}
