import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  FileCheck2,
  FileClock,
  Filter,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Loader2,
  MapPin,
  Printer,
  UserCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiSelectDropdown from "@/components/ui/MultiSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradientStatCard } from "@/features/notifications/components/gradient-stat-card";
import { VisualCard } from "@/features/fees-dashboard/components/VisualCard";
import { CompactPanel } from "@/features/fees-dashboard/components/CompactPanel";
import { LiveUpdatesBadge } from "@/features/fees-dashboard/components/LiveUpdatesBadge";
import { formatCompactIN } from "@/features/notifications/utils/format";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "@/features/fees-dashboard/components/FeesTable";
import { cn } from "@/lib/utils";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { getAllExamTypes } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getAllShifts } from "@/services/academic";
import {
  getAffiliations,
  getProgramCourseDtos,
  getRegulationTypes,
  getStreams,
  getSubjectTypes,
} from "@/services/course-design.api";
import { formatSemesterClassOptionLabel } from "@/features/fees-dashboard/utils/semester-display";
import type { Class } from "@/types/academics/class";
import type { Shift } from "@/types/academics/shift";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";
import type { ExamTypeT } from "@repo/db/schemas/models/exams";
import {
  getExamDashboardStats,
  type ExamDashboardFilters,
  type ExamDashboardStats,
} from "@/services/exam-dashboard.service";
import { useExamDashboardRealtime } from "../hooks/useExamDashboardRealtime";

// ── Tabs & filters ───────────────────────────────────────────────────────────

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "resources", label: "Resources" },
  { value: "admitcards", label: "Admit cards" },
  { value: "formfillup", label: "Form fill-up" },
] as const;

const RANGE_PRESETS = [
  // "All time" is the default — exams are sparse (a handful of groups per
  // term), so a "today" default would open on an empty dashboard. Tighter
  // windows are one click away.
  { value: "all", label: "All time", days: null as number | null },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "month", label: "This month", days: null as number | null },
  { value: "custom", label: "Custom", days: null as number | null },
] as const;

type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

type DraftFilters = {
  preset: RangePreset;
  dateFrom: string | null;
  dateTo: string | null;
  academicYearIds: string[];
  examTypeIds: string[];
  classIds: string[];
  shiftIds: string[];
  /** Cascade-only: narrow the programme-course options, never sent. */
  streamIds: string[];
  affiliationIds: string[];
  regulationTypeIds: string[];
  programCourseIds: string[];
  subjectTypeIds: string[];
};

const DEFAULT_DRAFT: DraftFilters = {
  preset: "all",
  dateFrom: null,
  dateTo: null,
  academicYearIds: [],
  examTypeIds: [],
  classIds: [],
  shiftIds: [],
  streamIds: [],
  affiliationIds: [],
  regulationTypeIds: [],
  programCourseIds: [],
  subjectTypeIds: [],
};

function resolveRange(preset: RangePreset, fromRaw?: string | null, toRaw?: string | null) {
  const now = new Date();
  const to = new Date(now);
  let from = new Date(now);
  if (preset === "all") return { dateFrom: null, dateTo: null };
  if (preset === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === "custom") {
    return { dateFrom: fromRaw ?? null, dateTo: toRaw ?? null };
  } else {
    const days = RANGE_PRESETS.find((r) => r.value === preset)?.days ?? 30;
    from.setDate(from.getDate() - (days ?? 30));
  }
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

// ── Formatters ───────────────────────────────────────────────────────────────

const nfmt = new Intl.NumberFormat("en-IN");

function fmtDay(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function fmtDayYear(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** "2026-03" → "Mar 2026" for the papers-per-month axis. */
function fmtMonth(m: string) {
  const dt = new Date(`${m}-01T00:00:00`);
  if (Number.isNaN(dt.getTime())) return m;
  return dt.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** dd/mm/yyyy for a single date string — used in chart titles and tables. */
function fmtDMY(d: string | Date | null | undefined): string | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

function fmtDateTimeIST(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/** Human range for a chart title — same helper as the library dashboard: the
 *  explicit filter window when set, otherwise the data's own extent. */
function formatDateRangeDMY(
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined,
  opts: { fallback?: string; entryDays?: Array<{ day: string }> } = {},
): string {
  const fromLbl = fmtDMY(dateFrom);
  const toLbl = fmtDMY(dateTo);
  if (fromLbl && toLbl) return `${fromLbl} – ${toLbl}`;
  if (fromLbl) return `from ${fromLbl}`;
  if (toLbl) return `until ${toLbl}`;
  const days = (opts.entryDays ?? [])
    .map((r) => r.day)
    .filter((d): d is string => typeof d === "string" && d.length > 0)
    .sort();
  if (days.length >= 1) {
    const a = fmtDMY(days[0]);
    const b = fmtDMY(days[days.length - 1]);
    if (a && b) return a === b ? a : `${a} – ${b}`;
  }
  return opts.fallback ?? "all time";
}

function spansMultipleYears(rows: Array<{ day: string }>): boolean {
  const years = new Set<number>();
  for (const r of rows) {
    const y = new Date(r.day).getFullYear();
    if (Number.isFinite(y)) years.add(y);
  }
  return years.size > 1;
}

/**
 * Merge one-or-more day-keyed series onto a union day axis, binning to ISO
 * weeks past ~4 months of distinct days (same reasoning as the library visits
 * chart — a multi-month daily series reads as noise at dashboard width).
 */
function mergeDailySeries(
  series: Array<{ key: string; rows: Array<{ day: string; count: number }> }>,
): { data: Array<Record<string, number | string>>; weekly: boolean } {
  const allDays = new Set<string>();
  for (const s of series) for (const r of s.rows) allDays.add(r.day);
  const weekly = allDays.size > 120;
  const includeYear = spansMultipleYears(Array.from(allDays).map((day) => ({ day })));
  const fmt = (d: string) => (includeYear ? fmtDayYear(d) : fmtDay(d));
  const keyOf = (day: string) => {
    if (!weekly) return day;
    const dt = new Date(day);
    if (Number.isNaN(dt.getTime())) return day;
    dt.setDate(dt.getDate() - dt.getDay());
    return dt.toISOString().slice(0, 10);
  };

  const byKey = new Map<string, Record<string, number | string>>();
  for (const s of series) {
    for (const r of s.rows) {
      const k = keyOf(r.day);
      let row = byKey.get(k);
      if (!row) {
        row = { date: fmt(k) };
        for (const other of series) row[other.key] = 0;
        byKey.set(k, row);
      }
      row[s.key] = ((row[s.key] as number) ?? 0) + r.count;
    }
  }
  const data = Array.from(byKey.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
  return { data, weekly };
}

// ── Shared visual bits ───────────────────────────────────────────────────────

/** Gradient palette matching the notifications / library dashboards — same
 *  visual system across the console so the exam tiles read as one product. */
const GRADIENTS = {
  emerald: "from-[#047857] via-[#059669] to-[#10b981]",
  amber: "from-[#b45309] via-[#d97706] to-[#f59e0b]",
  rose: "from-[#b91c1c] via-[#dc2626] to-[#ef4444]",
  violet: "from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]",
  cyan: "from-[#0e7490] via-[#0891b2] to-[#06b6d4]",
  sky: "from-[#1d4ed8] via-[#2563eb] to-[#3b82f6]",
} as const;

/** Generic multi-series tooltip — same white card as the notifications and
 *  library trend tooltips, one row per series. */
function MultiSeriesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    stroke?: string;
    color?: string;
    fill?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grid min-w-[9rem] gap-1.5 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-[#1a1a1a]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#444]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.stroke ?? p.color ?? p.fill }}
            />
            {p.name}
          </span>
          <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
            {nfmt.format(p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartLegendDots({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

/** Set true once at least one socket event has fired this session — panels
 *  flash on socket-triggered remounts only, never on first paint. */
const ExamFlashContext = createContext(false);

function PanelCard(props: ComponentProps<typeof VisualCard>) {
  const shouldFlash = useContext(ExamFlashContext);
  return (
    <VisualCard {...props} className={cn(shouldFlash && "exam-live-flash", props.className)} />
  );
}

function TablePanel(props: ComponentProps<typeof CompactPanel>) {
  const shouldFlash = useContext(ExamFlashContext);
  return (
    <CompactPanel
      {...props}
      noPadding
      className={cn(shouldFlash && "exam-live-flash", props.className)}
    />
  );
}

/** Ranked list — rank pill, label, right-aligned tabular number. Same recipe
 *  as the library dashboard's top-books panel. */
function RankedList({
  items,
  emptyLabel,
  accent = "text-violet-700 bg-violet-50",
  format,
}: {
  items: Array<{ key: string; label: string; value: number; sublabel?: string }>;
  emptyLabel: string;
  accent?: string;
  format?: (v: number) => string;
}) {
  if (items.length === 0) return <EmptyPanel label={emptyLabel} />;
  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {items.map((it, i) => (
        <li key={it.key} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold",
              accent,
            )}
          >
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700" title={it.label}>
            {it.label}
            {it.sublabel ? (
              <span className="ml-1.5 text-xs text-slate-400">{it.sublabel}</span>
            ) : null}
          </span>
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {format ? format(it.value) : nfmt.format(it.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Slim in-cell progress bar + percentage, violet like the notifications
 *  templates table. */
function InlineProgress({
  value,
  total,
  color = "bg-[#7c3aed]",
}: {
  value: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-slate-700">{pct}%</span>
    </div>
  );
}

/** Admit-card window status chip — Open (inside window), Upcoming, Closed. */
function WindowStatusChip({ start, last }: { start: string | null; last: string | null }) {
  if (!start) {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
        Not set
      </Badge>
    );
  }
  const now = Date.now();
  const startMs = new Date(start).getTime();
  const lastMs = last ? new Date(last).getTime() : null;
  if (now < startMs) {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
        Upcoming
      </Badge>
    );
  }
  if (lastMs != null && now > lastMs) {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        Closed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
      Open
    </Badge>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

const PENDING_ALLOTMENT_DISPLAY = 6;

function OverviewTab({ stats, rangeLabel }: { stats: ExamDashboardStats; rangeLabel: string }) {
  const papersByMonth = useMemo(
    () => stats.papersByMonth.map((r) => ({ ...r, label: fmtMonth(r.month) })),
    [stats.papersByMonth],
  );
  // Programme-course × semester rows behind each month bucket, keyed by the
  // chart's axis label so the tooltip can list them.
  const papersDetailByLabel = useMemo(() => {
    const map = new Map<
      string,
      Array<{ programCourse: string; className: string | null; papers: number }>
    >();
    for (const d of stats.papersByMonthDetail) {
      const key = fmtMonth(d.month);
      const list = map.get(key) ?? [];
      list.push(d);
      map.set(key, list);
    }
    return map;
  }, [stats.papersByMonthDetail]);

  function PapersTooltip({ active, label }: { active?: boolean; label?: string }) {
    if (!active || !label) return null;
    const details = papersDetailByLabel.get(label) ?? [];
    const shown = details.slice(0, 6);
    const more = details.length - shown.length;
    const total = papersByMonth.find((r) => r.label === label)?.papers ?? 0;
    return (
      <div className="grid min-w-[13rem] gap-1.5 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-xs shadow-md">
        <p className="font-semibold text-[#1a1a1a]">
          {label} · {nfmt.format(total)} papers
        </p>
        {shown.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="truncate text-[#444]">
              {d.programCourse}
              {d.className ? ` · ${d.className}` : ""}
            </span>
            <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
              {nfmt.format(d.papers)}
            </span>
          </div>
        ))}
        {more > 0 && <p className="text-[10px] text-slate-400">+{more} more</p>}
      </div>
    );
  }
  // One overview pulse-line per activity stream — downloads, student form
  // submissions, desk handouts — same overlaid-lines recipe as the
  // notifications "over time" chart.
  const activity = useMemo(
    () =>
      mergeDailySeries([
        { key: "downloads", rows: stats.downloadsByDay },
        { key: "submissions", rows: stats.studentSubmissionsByDay },
        { key: "handouts", rows: stats.distributionsByDay },
      ]),
    [stats.downloadsByDay, stats.studentSubmissionsByDay, stats.distributionsByDay],
  );
  const showPending = stats.pendingAllotment.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Staff think in exam groups (cycles), not the per-class exam rows a
          group fans into — so the headline is groups, and every count is
          students, never candidate × paper rows. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={Layers}
          label="Cycles"
          value={formatCompactIN(stats.examGroups)}
          hint={`exam groups · ${formatCompactIN(stats.papersScheduled)} papers`}
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={Users}
          label="Students"
          value={formatCompactIN(stats.students)}
          hint="appearing · distinct on rosters"
        />
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={ClipboardList}
          label="Unallotted"
          value={formatCompactIN(stats.pendingAllotmentCount)}
          hint="exams without rooms or students"
        />
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={Clock}
          label="Today"
          value={formatCompactIN(stats.cycleStatus.today)}
          hint="cycles with a paper today"
        />
        <GradientStatCard
          gradient={GRADIENTS.sky}
          icon={CalendarDays}
          label="Upcoming"
          value={formatCompactIN(stats.cycleStatus.upcoming)}
          hint={`cycles ahead · ${formatCompactIN(stats.upcomingPapers30d)} papers in 30 days`}
        />
        <GradientStatCard
          gradient={GRADIENTS.rose}
          icon={ClipboardCheck}
          label="Completed"
          value={formatCompactIN(stats.cycleStatus.completed)}
          hint="cycles fully done"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelCard
          title={`Exam activity over time · ${activity.weekly ? "weekly" : "daily"} · ${rangeLabel}`}
          className="lg:col-span-2"
        >
          {activity.data.length === 0 ? (
            <EmptyPanel label="No exam activity in this range" />
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={activity.data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#666" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    minTickGap={40}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#666" }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip content={<MultiSeriesTooltip />} cursor={{ fill: "#f1f5f9" }} />
                  <Area
                    type="monotone"
                    dataKey="downloads"
                    name="Admit-card downloads"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="#7c3aed"
                    fillOpacity={0.12}
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    name="Form submissions"
                    stroke="#0891b2"
                    strokeWidth={2}
                    fill="#0891b2"
                    fillOpacity={0.08}
                  />
                  <Area
                    type="monotone"
                    dataKey="handouts"
                    name="Physical handouts"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="#f59e0b"
                    fillOpacity={0.08}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <ChartLegendDots
                items={[
                  { label: "Admit-card downloads", color: "#7c3aed" },
                  { label: "Form submissions", color: "#0891b2" },
                  { label: "Physical handouts", color: "#f59e0b" },
                ]}
              />
            </div>
          )}
        </PanelCard>

        <PanelCard title="Exam cycles by type">
          <RankedList
            emptyLabel="No exam cycles scheduled yet"
            accent="text-sky-700 bg-sky-50"
            items={stats.examCyclesByType.map((t) => ({
              key: t.name,
              label: t.name,
              sublabel: t.shortName ?? undefined,
              value: t.count,
            }))}
          />
        </PanelCard>
      </div>

      <PanelCard title={`Papers scheduled per month · ${rangeLabel}`}>
        {papersByMonth.length === 0 ? (
          <EmptyPanel label="No papers scheduled in this range" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={papersByMonth} barCategoryGap="30%">
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              {/* Tooltip lists the programme courses + semesters behind the
                  month's papers. */}
              <Tooltip cursor={{ fill: "#f1f5f9" }} content={<PapersTooltip />} />
              {/* Orange, per Harsh — matches the library "Books added per
                  year" bars and keeps the big bar chart visually distinct
                  from the violet activity lines above it. */}
              <Bar dataKey="papers" name="Papers" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </PanelCard>

      {showPending && (
        <TablePanel
          title="Awaiting allotment · exams without rooms or students"
          headerRight={
            <Link
              to="/dashboard/exam-management/allot"
              className="text-xs font-medium text-[#7c3aed] hover:underline"
            >
              Go to Allot Exam →
            </Link>
          }
        >
          <FeesTable fixed={false} dense>
            <FeesTableHeader>
              <FeesTableHead>Exam group</FeesTableHead>
              <FeesTableHead>Exam type</FeesTableHead>
              <FeesTableHead className="text-center">Semester</FeesTableHead>
              <FeesTableHead className="text-center">First paper</FeesTableHead>
              <FeesTableHead className="text-center">Students</FeesTableHead>
              <FeesTableHead className="text-center">Rooms</FeesTableHead>
              <FeesTableHead className="text-center">Missing</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {stats.pendingAllotment.slice(0, PENDING_ALLOTMENT_DISPLAY).map((p) => (
                <FeesTableRow key={p.examId}>
                  <FeesTableCell className="font-medium">{p.examGroupName ?? "—"}</FeesTableCell>
                  <FeesTableCell className="text-slate-600">{p.examTypeName ?? "—"}</FeesTableCell>
                  <FeesTableCell className="text-center">{p.className ?? "—"}</FeesTableCell>
                  <FeesTableCell className="whitespace-nowrap text-center text-slate-600">
                    {p.firstPaperAt ? fmtDMY(p.firstPaperAt) : "—"}
                  </FeesTableCell>
                  <FeesTableCell className="text-center tabular-nums">
                    {nfmt.format(p.candidates)}
                  </FeesTableCell>
                  <FeesTableCell className="text-center tabular-nums">
                    {nfmt.format(p.rooms)}
                  </FeesTableCell>
                  <FeesTableCell className="text-center">
                    <span className="inline-flex flex-wrap justify-center gap-1">
                      {p.rooms === 0 && (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          Rooms
                        </Badge>
                      )}
                      {p.candidates === 0 && (
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50 text-rose-700"
                        >
                          Students
                        </Badge>
                      )}
                    </span>
                  </FeesTableCell>
                </FeesTableRow>
              ))}
            </FeesTableBody>
          </FeesTable>
          {stats.pendingAllotment.length > PENDING_ALLOTMENT_DISPLAY && (
            <p className="border-t border-[#b8b8b8] px-3 py-2 text-xs text-[#555]">
              …and {stats.pendingAllotment.length - PENDING_ALLOTMENT_DISPLAY} more awaiting
              allotment — see the Allot Exam page for the full queue.
            </p>
          )}
        </TablePanel>
      )}

      {stats.upcomingPapers.length > 0 && (
        <TablePanel title="Upcoming papers · next 10">
          <FeesTable fixed={false} dense>
            <FeesTableHeader>
              <FeesTableHead>Date &amp; time</FeesTableHead>
              <FeesTableHead>Subject / paper</FeesTableHead>
              <FeesTableHead>Exam group</FeesTableHead>
              <FeesTableHead className="text-center">Semester</FeesTableHead>
              <FeesTableHead className="text-center">Students</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {stats.upcomingPapers.map((p) => (
                <FeesTableRow key={p.examSubjectId}>
                  <FeesTableCell className="whitespace-nowrap text-slate-700">
                    {fmtDateTimeIST(p.startTime)}
                  </FeesTableCell>
                  <FeesTableCell>
                    <span className="font-medium text-slate-800">{p.subjectName}</span>
                    {p.paperCode ? (
                      <span className="ml-1.5 text-xs text-slate-500">{p.paperCode}</span>
                    ) : null}
                  </FeesTableCell>
                  <FeesTableCell>{p.examGroupName ?? "—"}</FeesTableCell>
                  <FeesTableCell className="text-center">{p.className ?? "—"}</FeesTableCell>
                  <FeesTableCell className="text-center font-semibold tabular-nums">
                    {nfmt.format(p.candidateCount)}
                  </FeesTableCell>
                </FeesTableRow>
              ))}
            </FeesTableBody>
          </FeesTable>
        </TablePanel>
      )}
    </div>
  );
}

function ResourcesTab({ stats }: { stats: ExamDashboardStats }) {
  const seatedRate =
    stats.students > 0 ? Math.round((stats.studentsSeated / stats.students) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={Building2}
          label="Rooms"
          value={formatCompactIN(stats.roomsInUse)}
          hint={`in use of ${formatCompactIN(stats.roomsTotal)}`}
        />
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={MapPin}
          label="Floors"
          value={formatCompactIN(stats.floorsInUse)}
          hint={`in use of ${formatCompactIN(stats.floorsTotal)}`}
        />
        <GradientStatCard
          gradient={GRADIENTS.sky}
          icon={Users}
          label="Capacity"
          value={formatCompactIN(stats.totalRoomCapacity)}
          hint="seats across all rooms"
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={UserCheck}
          label="Seated"
          value={`${seatedRate}%`}
          hint={`${formatCompactIN(stats.studentsSeated)} of ${formatCompactIN(stats.students)} students placed`}
          progress={seatedRate}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Grouped bars instead of a table — rooms vs rooms-in-use per
            floor at a glance; capacity rides in the tooltip. */}
        <PanelCard title="Floor utilisation · rooms vs in use" className="lg:col-span-2">
          {stats.roomsByFloor.length === 0 ? (
            <EmptyPanel label="No rooms configured yet" />
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={stats.roomsByFloor.map((f) => ({ ...f, label: f.floor }))}
                  barGap={2}
                  barCategoryGap="26%"
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<MultiSeriesTooltip />} />
                  <Bar dataKey="rooms" name="Rooms" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="inUse" name="In use" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegendDots
                items={[
                  { label: "Rooms", color: "#06b6d4" },
                  { label: "In use", color: "#7c3aed" },
                ]}
              />
            </div>
          )}
        </PanelCard>

        <PanelCard title="Most used rooms">
          <RankedList
            emptyLabel="No rooms allotted yet"
            accent="text-emerald-700 bg-emerald-50"
            items={stats.topRooms.map((r) => ({
              key: `${r.name}·${r.floor ?? ""}`,
              label: r.name,
              sublabel: `${r.floor ?? "—"} · ${nfmt.format(r.capacity)} seats`,
              value: r.timesUsed,
            }))}
            format={(v) => `${nfmt.format(v)}×`}
          />
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Coverage list instead of a table — one row per exam group with an
            inline seated/total bar. */}
        <PanelCard title="Seating coverage per exam group" className="lg:col-span-2">
          {stats.groupStats.length === 0 ? (
            <EmptyPanel label="No exam groups in this scope" />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {stats.groupStats.map((g) => {
                const pct = g.students > 0 ? Math.round((g.studentsSeated / g.students) * 100) : 0;
                return (
                  <li key={g.examGroupId} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-slate-700" title={g.name}>
                        {g.name}
                        <span className="ml-1.5 text-xs text-slate-400">
                          {fmtDMY(g.commencementDate) ?? ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-slate-600">
                        {nfmt.format(g.studentsSeated)} / {nfmt.format(g.students)} seated ·{" "}
                        {nfmt.format(g.rooms)} rooms
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PanelCard>

        <PanelCard title="Exams scheduled by · staff">
          <RankedList
            emptyLabel="No exams scheduled yet"
            accent="text-violet-700 bg-violet-50"
            items={stats.scheduledBy.map((s) => ({
              key: s.name,
              label: s.name,
              value: s.count,
            }))}
          />
        </PanelCard>
      </div>
    </div>
  );
}

function AdmitCardsTab({ stats, rangeLabel }: { stats: ExamDashboardStats; rangeLabel: string }) {
  const notDownloaded = Math.max(0, stats.students - stats.studentsDownloaded);
  const digitalVsPhysical = useMemo(
    () =>
      mergeDailySeries([
        { key: "downloads", rows: stats.downloadsByDay },
        { key: "distributions", rows: stats.distributionsByDay },
      ]),
    [stats.downloadsByDay, stats.distributionsByDay],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={Download}
          label="Downloaded"
          value={formatCompactIN(stats.studentsDownloaded)}
          hint="students · digital admit cards"
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={ClipboardCheck}
          label="Rate"
          value={`${stats.downloadRate}%`}
          hint="of students on rosters"
          progress={stats.downloadRate}
        />
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={FileClock}
          label="Pending"
          value={formatCompactIN(notDownloaded)}
          hint="students yet to download"
        />
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={Printer}
          label="Handouts"
          value={formatCompactIN(stats.physicalDistributions)}
          hint="physical · at the desk"
        />
      </div>

      <PanelCard
        title={`Admit-card activity · digital vs physical · ${digitalVsPhysical.weekly ? "weekly" : "daily"} · ${rangeLabel}`}
      >
        {digitalVsPhysical.data.length === 0 ? (
          <EmptyPanel label="No admit-card activity in this range" />
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={digitalVsPhysical.data}
                margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#666" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d4" }}
                  minTickGap={40}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#666" }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip content={<MultiSeriesTooltip />} cursor={{ fill: "#f1f5f9" }} />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  name="Digital downloads"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="#7c3aed"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="distributions"
                  name="Physical handouts"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="#f59e0b"
                  fillOpacity={0.08}
                />
              </AreaChart>
            </ResponsiveContainer>
            <ChartLegendDots
              items={[
                { label: "Digital downloads", color: "#7c3aed" },
                { label: "Physical handouts", color: "#f59e0b" },
              ]}
            />
          </div>
        )}
      </PanelCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TablePanel title="Downloads per exam group" className="lg:col-span-2">
          <FeesTable fixed={false} dense>
            <FeesTableHeader>
              <FeesTableHead>Exam group</FeesTableHead>
              <FeesTableHead className="text-center">Students</FeesTableHead>
              <FeesTableHead className="text-center">Downloaded</FeesTableHead>
              <FeesTableHead>Rate</FeesTableHead>
              <FeesTableHead className="text-center">Window</FeesTableHead>
              <FeesTableHead className="text-center">Status</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {stats.groupStats.map((g) => (
                <FeesTableRow key={g.examGroupId}>
                  <FeesTableCell className="font-medium">{g.name}</FeesTableCell>
                  <FeesTableCell className="text-center tabular-nums">
                    {nfmt.format(g.students)}
                  </FeesTableCell>
                  <FeesTableCell className="text-center tabular-nums">
                    {nfmt.format(g.studentsDownloaded)}
                  </FeesTableCell>
                  <FeesTableCell>
                    <InlineProgress value={g.studentsDownloaded} total={g.students} />
                  </FeesTableCell>
                  <FeesTableCell className="whitespace-nowrap text-center text-xs text-slate-600">
                    {g.admitCardStart
                      ? `${fmtDMY(g.admitCardStart)} – ${fmtDMY(g.admitCardLast) ?? "…"}`
                      : "—"}
                  </FeesTableCell>
                  <FeesTableCell className="text-center">
                    <WindowStatusChip start={g.admitCardStart} last={g.admitCardLast} />
                  </FeesTableCell>
                </FeesTableRow>
              ))}
            </FeesTableBody>
          </FeesTable>
        </TablePanel>

        <PanelCard title="Top distributors · desk handouts">
          <RankedList
            emptyLabel="No physical distributions yet"
            accent="text-emerald-700 bg-emerald-50"
            items={stats.topDistributors.map((d) => ({
              key: d.name,
              label: d.name,
              value: d.count,
            }))}
          />
        </PanelCard>
      </div>
    </div>
  );
}

function FormFillupTab({ stats, rangeLabel }: { stats: ExamDashboardStats; rangeLabel: string }) {
  const mismatch = stats.uploadedNotSubmitted + stats.submittedNotUploaded;
  const sources = useMemo(
    () =>
      mergeDailySeries([
        { key: "studentSide", rows: stats.studentSubmissionsByDay },
        { key: "staffSide", rows: stats.formFillupByDay },
      ]),
    [stats.studentSubmissionsByDay, stats.formFillupByDay],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Two independent sources feed form fill-up: students submit from the
          student console, and staff bulk-upload rows via Bulk Data Upload.
          The tab's job is the reconciliation between the two. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={ClipboardList}
          label="Uploads"
          value={formatCompactIN(stats.formFillupTotal)}
          hint={`staff · Bulk Data Upload · ${formatCompactIN(stats.formFillupCompleted)} completed`}
        />
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={GraduationCap}
          label="Submissions"
          value={formatCompactIN(stats.promotionsFormSubmitted)}
          hint="students · via student console"
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={FileCheck2}
          label="Linked"
          value={formatCompactIN(stats.linkedStudents)}
          hint="students with an uploaded form linked"
        />
        {/* Both directions count: staff uploaded a form but the student
            never submitted, and submitted with nothing uploaded. */}
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={FileClock}
          label="Mismatch"
          value={formatCompactIN(mismatch)}
          hint={`${formatCompactIN(stats.uploadedNotSubmitted)} not submitted · ${formatCompactIN(stats.submittedNotUploaded)} not uploaded`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelCard
          title={`Student vs staff entries · ${sources.weekly ? "weekly" : "daily"} · ${rangeLabel}`}
        >
          {sources.data.length === 0 ? (
            <EmptyPanel label="No form fill-up activity in this range" />
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sources.data} barGap={2} barCategoryGap="22%">
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#666" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#666" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<MultiSeriesTooltip />} />
                  <Bar
                    dataKey="studentSide"
                    name="Student submissions"
                    fill="#06b6d4"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="staffSide"
                    name="Staff uploads"
                    fill="#7c3aed"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegendDots
                items={[
                  { label: "Student submissions", color: "#06b6d4" },
                  { label: "Staff uploads", color: "#7c3aed" },
                ]}
              />
            </div>
          )}
        </PanelCard>

        <TablePanel
          title="Reconciliation per programme course · student vs staff"
          className="lg:col-span-2"
        >
          <FeesTable fixed={false} dense>
            <FeesTableHeader>
              <FeesTableHead>Programme course</FeesTableHead>
              <FeesTableHead className="text-center">Student submitted</FeesTableHead>
              <FeesTableHead className="text-center">Staff uploaded</FeesTableHead>
              <FeesTableHead className="text-center">Linked</FeesTableHead>
              <FeesTableHead className="text-center">Gap</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {stats.formReconciliationByProgramCourse.map((r) => {
                const gap = r.studentSubmitted - r.staffRecorded;
                return (
                  <FeesTableRow key={r.name}>
                    <FeesTableCell className="font-medium">{r.name}</FeesTableCell>
                    <FeesTableCell className="text-center tabular-nums text-cyan-700">
                      {nfmt.format(r.studentSubmitted)}
                    </FeesTableCell>
                    <FeesTableCell className="text-center tabular-nums text-violet-700">
                      {nfmt.format(r.staffRecorded)}
                    </FeesTableCell>
                    <FeesTableCell className="text-center tabular-nums text-emerald-700">
                      {nfmt.format(r.linked)}
                    </FeesTableCell>
                    <FeesTableCell
                      className={cn(
                        "text-center font-semibold tabular-nums",
                        gap === 0 ? "text-slate-400" : "text-amber-700",
                      )}
                    >
                      {gap === 0 ? "—" : nfmt.format(gap)}
                    </FeesTableCell>
                  </FeesTableRow>
                );
              })}
            </FeesTableBody>
          </FeesTable>
        </TablePanel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelCard title="Forms by appear type">
          <RankedList
            emptyLabel="No staff-uploaded forms yet"
            accent="text-violet-700 bg-violet-50"
            items={stats.formsByAppearType.map((r) => ({
              key: r.name,
              label: r.name,
              value: r.count,
            }))}
          />
        </PanelCard>
      </div>
    </div>
  );
}

// ── Filters dialog ───────────────────────────────────────────────────────────

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[#444]">{label}</label>
      {children}
    </div>
  );
}

/** Cohort-rich filters dialog — mirrors FeesFiltersDialog / the notifications
 *  dashboard dialog: multi-select everywhere, programme courses cascaded from
 *  the selected streams (streams themselves only narrow options). */
function FiltersDialog({
  open,
  onOpenChange,
  value,
  defaultDraft,
  onApply,
  academicYears,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: DraftFilters;
  /** What Reset restores — includes the default active-year selection. */
  defaultDraft: DraftFilters;
  onApply: (v: DraftFilters) => void;
  academicYears: Array<{ id: number; year: string }>;
}) {
  const [draft, setDraft] = useState<DraftFilters>(value);
  const [examTypes, setExamTypes] = useState<ExamTypeT[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [streams, setStreams] = useState<{ id: number; name: string }[]>([]);
  const [affiliations, setAffiliations] = useState<{ id: number; name: string }[]>([]);
  const [regulationTypes, setRegulationTypes] = useState<{ id: number; name: string }[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<{ id: number; name: string }[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourseDto[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // Load cohort options once, on first open (mirrors FeesFiltersDialog).
  useEffect(() => {
    if (!open || optionsLoaded) return;
    let cancelled = false;
    void (async () => {
      try {
        const [typeRes, classRows, shiftRows, streamRows, affRows, regRows, pcRows, stRows] =
          await Promise.all([
            getAllExamTypes(),
            getAllClasses(),
            getAllShifts(),
            getStreams(),
            getAffiliations(),
            getRegulationTypes(),
            getProgramCourseDtos(),
            getSubjectTypes(),
          ]);
        if (cancelled) return;
        const named = (rows: unknown) =>
          (Array.isArray(rows) ? (rows as { id?: number | null; name?: string | null }[]) : [])
            .filter((r) => r?.id != null && r?.name)
            .map((r) => ({ id: Number(r.id), name: String(r.name) }));
        setExamTypes((typeRes.payload ?? []).filter((t) => t.isActive !== false));
        setClasses((classRows ?? []).filter((c) => c.isActive !== false));
        setShifts((shiftRows ?? []).filter((s) => !s.disabled));
        setStreams(named(streamRows));
        setAffiliations(named(affRows));
        setRegulationTypes(named(regRows));
        setProgramCourses(Array.isArray(pcRows) ? pcRows : []);
        setSubjectTypes(named(stRows));
        setOptionsLoaded(true);
      } catch {
        // options stay empty; filters still usable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, optionsLoaded]);

  const update = <K extends keyof DraftFilters>(key: K, v: DraftFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  // Cascade: programme-course options narrow to the selected streams /
  // affiliations / regulations (mirrors FeesFiltersDialog).
  const programCourseOptions = useMemo(() => {
    let list = programCourses.filter((pc) => pc.id != null && pc.isActive !== false);
    if (draft.streamIds.length) {
      const allowed = new Set(draft.streamIds.map(Number));
      list = list.filter((pc) => pc.stream?.id != null && allowed.has(pc.stream.id));
    }
    if (draft.affiliationIds.length) {
      const allowed = new Set(draft.affiliationIds.map(Number));
      list = list.filter((pc) => pc.affiliation?.id != null && allowed.has(pc.affiliation.id));
    }
    if (draft.regulationTypeIds.length) {
      const allowed = new Set(draft.regulationTypeIds.map(Number));
      list = list.filter(
        (pc) => pc.regulationType?.id != null && allowed.has(pc.regulationType.id),
      );
    }
    return list.map((pc) => ({ value: String(pc.id), label: String(pc.name ?? `#${pc.id}`) }));
  }, [programCourses, draft.streamIds, draft.affiliationIds, draft.regulationTypeIds]);

  // Drop selected programme courses that fell out of the narrowed list.
  useEffect(() => {
    const valid = new Set(programCourseOptions.map((o) => o.value));
    setDraft((d) => {
      const pruned = d.programCourseIds.filter((id) => valid.has(id));
      return pruned.length === d.programCourseIds.length ? d : { ...d, programCourseIds: pruned };
    });
  }, [programCourseOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Split layout: a fixed illustration rail on the left; on the right a
          pinned header, scrollable filter body, pinned footer. */}
      <DialogContent className="w-[95vw] max-w-3xl overflow-hidden p-0">
        <div className="flex max-h-[85vh]">
          <div className="hidden w-[200px] shrink-0 self-stretch border-r border-[#ede9fe] bg-[#f5f3ff] sm:block">
            <img
              src="/modern-analytics-visualization-business-insights-vector.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <DialogHeader className="shrink-0 border-b border-[#e5e5e5] px-5 py-4">
              <DialogTitle>Exam dashboard filters</DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c3aed]">
                Exam
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FilterField label="Exam types">
                  <MultiSelectDropdown
                    placeholder="All exam types"
                    options={examTypes.flatMap((t) =>
                      t.id != null ? [{ value: String(t.id), label: t.name }] : [],
                    )}
                    selectedOptions={draft.examTypeIds}
                    onChange={(s: string[]) => update("examTypeIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
                <FilterField label="Subject categories">
                  <MultiSelectDropdown
                    placeholder="All categories"
                    options={subjectTypes.map((s) => ({ value: String(s.id), label: s.name }))}
                    selectedOptions={draft.subjectTypeIds}
                    onChange={(s: string[]) => update("subjectTypeIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
                <FilterField label="Time range">
                  <Select
                    value={draft.preset}
                    onValueChange={(v) => update("preset", v as RangePreset)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RANGE_PRESETS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              </div>

              {draft.preset === "custom" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FilterField label="From">
                    <Input
                      type="date"
                      value={draft.dateFrom ?? ""}
                      onChange={(e) => update("dateFrom", e.target.value)}
                    />
                  </FilterField>
                  <FilterField label="To">
                    <Input
                      type="date"
                      value={draft.dateTo ?? ""}
                      onChange={(e) => update("dateTo", e.target.value)}
                    />
                  </FilterField>
                </div>
              )}

              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c3aed]">
                Cohort
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FilterField label="Academic years">
                  <MultiSelectDropdown
                    placeholder="All academic years"
                    options={academicYears.map((y) => ({ value: String(y.id), label: y.year }))}
                    selectedOptions={draft.academicYearIds}
                    onChange={(s: string[]) => update("academicYearIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
                <FilterField label="Affiliations">
                  <MultiSelectDropdown
                    placeholder="All affiliations"
                    options={affiliations.map((a) => ({ value: String(a.id), label: a.name }))}
                    selectedOptions={draft.affiliationIds}
                    onChange={(s: string[]) => update("affiliationIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
                <FilterField label="Regulations">
                  <MultiSelectDropdown
                    placeholder="All regulations"
                    options={regulationTypes.map((r) => ({ value: String(r.id), label: r.name }))}
                    selectedOptions={draft.regulationTypeIds}
                    onChange={(s: string[]) => update("regulationTypeIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
                <FilterField label="Streams">
                  <MultiSelectDropdown
                    placeholder="All streams"
                    options={streams.map((s) => ({ value: String(s.id), label: s.name }))}
                    selectedOptions={draft.streamIds}
                    onChange={(s: string[]) => update("streamIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
                <FilterField label="Programme courses">
                  <MultiSelectDropdown
                    placeholder="All programme courses"
                    options={programCourseOptions}
                    selectedOptions={draft.programCourseIds}
                    onChange={(s: string[]) => update("programCourseIds", s)}
                    contentClassName="min-w-[300px]"
                  />
                </FilterField>
                <FilterField label="Semesters">
                  <MultiSelectDropdown
                    placeholder="All semesters"
                    options={classes.flatMap((c) =>
                      c.id != null
                        ? [{ value: String(c.id), label: formatSemesterClassOptionLabel(c.name) }]
                        : [],
                    )}
                    selectedOptions={draft.classIds}
                    onChange={(s: string[]) => update("classIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
                <FilterField label="Shifts">
                  <MultiSelectDropdown
                    placeholder="All shifts"
                    options={shifts.flatMap((s) =>
                      s.id != null ? [{ value: String(s.id), label: s.name }] : [],
                    )}
                    selectedOptions={draft.shiftIds}
                    onChange={(s: string[]) => update("shiftIds", s)}
                    contentClassName="min-w-[260px]"
                  />
                </FilterField>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-[#e5e5e5] px-5 py-3 sm:justify-between">
              <Button
                variant="outline"
                className="sm:mr-auto"
                onClick={() => setDraft(defaultDraft)}
              >
                Reset
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#7c3aed] hover:bg-[#6d28d9]"
                onClick={() => {
                  onApply(draft);
                  onOpenChange(false);
                }}
              >
                Apply
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<(typeof DASHBOARD_TABS)[number]["value"]>("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<DraftFilters>(DEFAULT_DRAFT);

  const { availableAcademicYears, loadAcademicYears } = useAcademicYear();
  useEffect(() => {
    loadAcademicYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active (current) academic years are pre-selected — the dashboard opens
  // scoped to the running year(s); Reset restores this same default.
  const defaultYearIds = useMemo(
    () =>
      (availableAcademicYears ?? [])
        .filter((y) => y.isCurrentYear === true && y.id != null)
        .map((y) => String(y.id)),
    [availableAcademicYears],
  );
  const defaultDraft = useMemo<DraftFilters>(
    () => ({ ...DEFAULT_DRAFT, academicYearIds: defaultYearIds }),
    [defaultYearIds],
  );
  const seededYearsRef = useRef(false);
  useEffect(() => {
    if (seededYearsRef.current || defaultYearIds.length === 0) return;
    seededYearsRef.current = true;
    setDraft((d) => (d.academicYearIds.length ? d : { ...d, academicYearIds: defaultYearIds }));
  }, [defaultYearIds]);

  const applied = useMemo<ExamDashboardFilters>(() => {
    const range = resolveRange(draft.preset, draft.dateFrom, draft.dateTo);
    const nums = (v: string[]) => (v.length ? v.map(Number) : undefined);
    return {
      academicYearIds: nums(draft.academicYearIds),
      examTypeIds: nums(draft.examTypeIds),
      classIds: nums(draft.classIds),
      shiftIds: nums(draft.shiftIds),
      programCourseIds: nums(draft.programCourseIds),
      subjectTypeIds: nums(draft.subjectTypeIds),
      ...range,
    };
  }, [draft]);

  // The default active-year selection doesn't count as a user filter — the
  // badge only reflects deviations from the default view.
  const yearsAreDefault =
    draft.academicYearIds.length === defaultYearIds.length &&
    draft.academicYearIds.every((id) => defaultYearIds.includes(id));
  const activeFilterCount =
    (draft.academicYearIds.length && !yearsAreDefault ? 1 : 0) +
    (draft.examTypeIds.length ? 1 : 0) +
    (draft.classIds.length ? 1 : 0) +
    (draft.shiftIds.length ? 1 : 0) +
    (draft.streamIds.length ? 1 : 0) +
    (draft.affiliationIds.length ? 1 : 0) +
    (draft.regulationTypeIds.length ? 1 : 0) +
    (draft.programCourseIds.length ? 1 : 0) +
    (draft.subjectTypeIds.length ? 1 : 0) +
    (draft.preset !== "all" ? 1 : 0);

  const {
    data: stats,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["exam-dashboard-stats", applied],
    queryFn: async () => (await getExamDashboardStats(applied)).payload!,
    keepPreviousData: true,
    // Socket events are the primary refresh signal; the 60s poll is the
    // safety net when the socket drops (same fallback as notifications).
    refetchInterval: 60_000,
  });

  const { isConnected, eventCounter } = useExamDashboardRealtime();

  const rangeLabel = formatDateRangeDMY(applied.dateFrom, applied.dateTo, {
    fallback: "all time",
    entryDays: stats?.downloadsByDay ?? [],
  });

  return (
    // `min-h-full bg-[#eaeaea]` — same wrapper as the notifications, fees and
    // library dashboards so the module family reads as one product.
    <div className="min-h-full min-w-0 bg-[#eaeaea]">
      <header className="border-b border-[#d1d1d1] bg-gradient-to-r from-[#f5f3ff] via-[#faf5ff] to-white">
        <div className="flex flex-col gap-3 px-4 py-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="flex shrink-0 items-center gap-2 text-xl font-bold text-[#1a1a1a]">
            <LayoutDashboard className="h-5 w-5 text-[#7c3aed]" />
            Exam dashboard
          </h1>
          <Button
            size="sm"
            className="relative h-8 shrink-0 rounded-md bg-[#7c3aed] pr-3 text-xs text-white hover:bg-[#6d28d9]"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-5 min-w-5 justify-center rounded-full border-0 bg-white px-1.5 text-[10px] font-bold text-[#7c3aed]"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="overflow-x-auto border-t border-[#e5e5e5] bg-white/80 px-2">
            <TabsList className="inline-flex h-11 w-max min-w-full justify-start gap-0.5 rounded-none bg-transparent p-0">
              {DASHBOARD_TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-none border-b-[3px] border-transparent px-4 text-sm font-medium text-slate-600 shadow-none data-[state=active]:border-[#7c3aed] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#7c3aed] data-[state=active]:shadow-none"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* `key={eventCounter}` remounts the tab body on every socket event,
              restarting the amber flash animation on every PanelCard so the
              operator can see widgets were refreshed by real activity. The
              context flag keeps the very first render flash-free. */}
          <ExamFlashContext.Provider value={eventCounter > 0}>
            <div key={eventCounter} className="p-3 lg:p-4">
              {isLoading && !stats ? (
                <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading dashboard…
                </div>
              ) : isError || !stats ? (
                <div className="flex min-h-[70vh] items-center justify-center text-sm text-red-600">
                  Failed to load dashboard.
                </div>
              ) : (
                <>
                  <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
                    <OverviewTab stats={stats} rangeLabel={rangeLabel} />
                  </TabsContent>
                  <TabsContent value="resources" className="mt-0 focus-visible:outline-none">
                    <ResourcesTab stats={stats} />
                  </TabsContent>
                  <TabsContent value="admitcards" className="mt-0 focus-visible:outline-none">
                    <AdmitCardsTab stats={stats} rangeLabel={rangeLabel} />
                  </TabsContent>
                  <TabsContent value="formfillup" className="mt-0 focus-visible:outline-none">
                    <FormFillupTab stats={stats} rangeLabel={rangeLabel} />
                  </TabsContent>
                </>
              )}
              {isFetching && !isLoading && (
                <div className="mt-2 flex items-center justify-end text-[11px] text-slate-400">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> refreshing…
                </div>
              )}
            </div>
          </ExamFlashContext.Provider>
        </Tabs>
      </header>

      <FiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={draft}
        defaultDraft={defaultDraft}
        onApply={setDraft}
        academicYears={(availableAcademicYears ?? []).flatMap((y) =>
          y.id != null ? [{ id: y.id, year: y.year }] : [],
        )}
      />

      {/* Floating status pill — red pulse while the socket is live, matching
          every other dashboard in the console. */}
      <LiveUpdatesBadge connected={isConnected} loading={isFetching && !stats} />
    </div>
  );
}
