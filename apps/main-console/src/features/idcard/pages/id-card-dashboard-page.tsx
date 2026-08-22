import { useMemo, useState } from "react";
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
  CreditCard,
  FileClock,
  Filter,
  IdCard,
  Layers,
  LayoutDashboard,
  PrinterCheck,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DialogMultiSelect from "@/components/ui/DialogMultiSelect";
import { useAppSelector } from "@/store/hooks";
import { selectAvailableAcademicYears } from "@/store/slices/academicYearSlice";
import { getProgramCourses, type SimpleOption } from "@/services/admission-program-course.service";

import { GradientStatCard } from "@/features/notifications/components/gradient-stat-card";
import { formatCompactIN } from "@/features/notifications/utils/format";
import { VisualCard } from "@/features/fees-dashboard/components/VisualCard";
import { ChartDonut, type DonutSlice } from "@/features/fees-dashboard/components/ChartDonut";
import { LiveUpdatesBadge } from "@/features/fees-dashboard/components/LiveUpdatesBadge";

import { getIdCardDashboardStats, type IdCardDashboardFilters } from "../api/idcard-api";
import { useIdCardRealtime } from "../hooks/use-idcard-realtime";

// ── helpers ──────────────────────────────────────────────────────────────────
const nfmt = new Intl.NumberFormat("en-IN");
const fmt = (n: number) => nfmt.format(n);

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function presetRange(key: string): { from: string; to: string } {
  const today = new Date();
  const iso = toISODate(today);
  const back = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return toISODate(d);
  };
  switch (key) {
    case "last7":
      return { from: back(6), to: iso };
    case "last30":
      return { from: back(29), to: iso };
    case "month":
      return { from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso };
    case "year":
      return { from: toISODate(new Date(today.getFullYear(), 0, 1)), to: iso };
    default:
      return { from: "", to: "" };
  }
}
const PRESETS = [
  { key: "all", label: "All time" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
];
const dayLabel = (iso: string) => {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : iso;
};
const hourLabel = (h: number | string) => {
  const n = Number(h);
  const ampm = n < 12 ? "am" : "pm";
  const hh = n % 12 === 0 ? 12 : n % 12;
  return `${hh} ${ampm}`;
};

const STATUS_COLORS: Record<string, string> = {
  ISSUED: "#16a34a",
  REISSUED: "#d97706",
  RENEWED: "#2563eb",
  DRAFT: "#94a3b8",
};

type Applied = {
  academicYearIds: number[];
  programCourseIds: number[];
  from: string;
  to: string;
};
const EMPTY: Applied = { academicYearIds: [], programCourseIds: [], from: "", to: "" };

function toApiFilters(a: Applied): IdCardDashboardFilters {
  return {
    academicYearIds: a.academicYearIds.length ? a.academicYearIds : undefined,
    programCourseIds: a.programCourseIds.length ? a.programCourseIds : undefined,
    from: a.from || undefined,
    to: a.to || undefined,
  };
}

// ── small presentational pieces (same recipe as exam/library dashboards) ──────
function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function MiniTooltip({
  active,
  payload,
  label,
  color = "#6366f1",
  name = "Issued",
  labelFn,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string | number;
  color?: string;
  name?: string;
  labelFn?: (l: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grid min-w-[8rem] gap-1 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-[#1a1a1a]">
        {labelFn ? labelFn(label ?? "") : String(label ?? "")}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-[#444]">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {name}
        </span>
        <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
          {fmt(payload[0]?.value ?? 0)}
        </span>
      </div>
    </div>
  );
}

export default function IdCardDashboardPage() {
  const [applied, setApplied] = useState<Applied>(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Applied>(EMPTY);

  const availableYears = useAppSelector(selectAvailableAcademicYears);
  const { data: programCourses = [] } = useQuery<SimpleOption[]>({
    queryKey: ["idcard-dashboard-program-courses"],
    queryFn: getProgramCourses,
    staleTime: 5 * 60_000,
  });

  const { isConnected } = useIdCardRealtime();

  const statsQuery = useQuery({
    queryKey: ["idcard-dashboard-stats", applied],
    queryFn: () => getIdCardDashboardStats(toApiFilters(applied)),
    staleTime: 60_000,
    keepPreviousData: true,
  });
  const stats = statsQuery.data;
  const loading = statsQuery.isLoading;

  const activeFilters =
    applied.academicYearIds.length +
    applied.programCourseIds.length +
    (applied.from ? 1 : 0) +
    (applied.to ? 1 : 0);
  const activePreset = useMemo(() => {
    for (const p of PRESETS) {
      const r = presetRange(p.key);
      if (r.from === draft.from && r.to === draft.to) return p.key;
    }
    return "custom";
  }, [draft.from, draft.to]);

  const openDialog = (open: boolean) => {
    if (open) setDraft(applied);
    setDialogOpen(open);
  };

  const statusSlices: DonutSlice[] = (stats?.byStatus ?? []).map((s) => ({
    name: s.name,
    value: s.value,
    color: STATUS_COLORS[s.name] ?? "#64748b",
  }));
  const totalStatus = statusSlices.reduce((a, s) => a + s.value, 0);

  return (
    <div className="min-h-full min-w-0 bg-[#eaeaea]">
      <Tabs defaultValue="overview">
        {/* Header */}
        <header className="border-b border-[#d1d1d1] bg-gradient-to-r from-[#eef2ff] via-[#f5f3ff] to-white">
          <div className="flex flex-col gap-2 px-4 py-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-[#1a1a1a]">
                <LayoutDashboard className="h-5 w-5 text-indigo-600" />
                ID Card dashboard
              </h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={openDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="relative h-8 shrink-0 rounded-md bg-indigo-600 pr-3 text-xs text-white hover:bg-indigo-700"
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Filters
                  {activeFilters > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-5 min-w-5 justify-center rounded-full border-0 bg-white px-1.5 text-[10px] font-bold text-indigo-600"
                    >
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="flex max-h-[min(90vh,680px)] max-w-lg flex-col overflow-hidden">
                <DialogHeader className="shrink-0">
                  <DialogTitle>Dashboard filters</DialogTitle>
                  <DialogDescription className="text-left">
                    Narrow the stats by issue-date range, academic year and program course.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto py-1 pr-1">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-800">Quick range</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => {
                        const on = activePreset === p.key;
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => {
                              const r = presetRange(p.key);
                              setDraft((d) => ({ ...d, from: r.from, to: r.to }));
                            }}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                              on
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-800">From</label>
                      <Input
                        type="date"
                        value={draft.from}
                        max={draft.to || undefined}
                        onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-800">To</label>
                      <Input
                        type="date"
                        value={draft.to}
                        min={draft.from || undefined}
                        onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-800">Academic year</label>
                    <DialogMultiSelect
                      placeholder="All academic years"
                      options={availableYears.map((y) => ({
                        label: String(y.year),
                        value: String(y.id),
                      }))}
                      selectedOptions={draft.academicYearIds.map(String)}
                      onChange={(vals) =>
                        setDraft((d) => ({ ...d, academicYearIds: vals.map(Number) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-800">Program course</label>
                    <DialogMultiSelect
                      placeholder="All program courses"
                      options={programCourses.map((p) => ({ label: p.name, value: String(p.id) }))}
                      selectedOptions={draft.programCourseIds.map(String)}
                      onChange={(vals) =>
                        setDraft((d) => ({ ...d, programCourseIds: vals.map(Number) }))
                      }
                    />
                  </div>
                </div>

                <DialogFooter className="shrink-0 sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setDraft(EMPTY)}
                  >
                    <X className="h-4 w-4" /> Clear
                  </Button>
                  <Button
                    type="button"
                    className="bg-slate-800 text-white hover:bg-slate-900"
                    onClick={() => {
                      setApplied(draft);
                      setDialogOpen(false);
                    }}
                  >
                    Apply filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto border-t border-[#e5e5e5] bg-white/80 px-2">
            <TabsList className="inline-flex h-11 w-max min-w-full justify-start gap-0.5 rounded-none bg-transparent p-0">
              {[
                { value: "overview", label: "Overview" },
                { value: "activity", label: "Activity" },
                { value: "recent", label: "Recent issues" },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-none border-b-[3px] border-transparent px-4 text-sm font-medium text-slate-600 shadow-none data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-indigo-600 data-[state=active]:shadow-none"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </header>

        <div className="space-y-4 p-4 lg:p-5">
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <GradientStatCard
              label="Issued"
              value={formatCompactIN(stats?.kpis.totalIssued ?? 0)}
              hint="Finalized ID cards"
              icon={CreditCard}
              gradient="from-[#4f46e5] via-[#6366f1] to-[#818cf8]"
            />
            <GradientStatCard
              label="Today"
              value={formatCompactIN(stats?.kpis.issuedToday ?? 0)}
              hint="Cards saved today"
              icon={IdCard}
              gradient="from-[#059669] via-[#10b981] to-[#34d399]"
            />
            <GradientStatCard
              label="Drafts"
              value={formatCompactIN(stats?.kpis.draftsPending ?? 0)}
              hint="Printed, awaiting save"
              icon={FileClock}
              gradient="from-[#b45309] via-[#d97706] to-[#f59e0b]"
            />
            <GradientStatCard
              label="Unsaved"
              value={formatCompactIN(stats?.kpis.printedNotSaved ?? 0)}
              hint="Printed but not saved"
              icon={PrinterCheck}
              gradient="from-[#be123c] via-[#e11d48] to-[#fb7185]"
            />
            <GradientStatCard
              label="Students"
              value={formatCompactIN(stats?.kpis.studentsWithCard ?? 0)}
              hint="Distinct students with a card"
              icon={Users}
              gradient="from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]"
            />
            <GradientStatCard
              label="Templates"
              value={formatCompactIN(stats?.templates.active ?? 0)}
              hint={`${fmt(stats?.templates.total ?? 0)} total · active`}
              icon={Layers}
              gradient="from-[#0891b2] via-[#06b6d4] to-[#22d3ee]"
            />
          </div>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="mt-3 space-y-4 focus-visible:outline-none">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <VisualCard title="Issues over time" className="lg:col-span-2">
                {stats && stats.perDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart
                      data={stats.perDay}
                      margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="idcardFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={dayLabel}
                        tick={{ fontSize: 10, fill: "#666" }}
                        tickLine={false}
                        axisLine={{ stroke: "#d4d4d4" }}
                        minTickGap={28}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#666" }}
                        tickLine={false}
                        axisLine={false}
                        width={36}
                      />
                      <Tooltip
                        content={<MiniTooltip labelFn={(l) => dayLabel(String(l))} />}
                        cursor={{ fill: "#f1f5f9" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Issued"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#idcardFill)"
                        isAnimationActive={false}
                        dot={false}
                        activeDot={{ r: 3.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyPanel label={loading ? "Loading…" : "No issues in this range."} />
                )}
              </VisualCard>

              <VisualCard title="By status">
                {statusSlices.length > 0 ? (
                  <ChartDonut
                    data={statusSlices}
                    centerLabel={
                      <div>
                        <p className="text-2xl font-bold tabular-nums text-slate-800">
                          {fmt(totalStatus)}
                        </p>
                        <p className="text-xs text-muted-foreground">total cards</p>
                      </div>
                    }
                    tooltipFormatter={(v, name) => `${name}: ${fmt(v)}`}
                    footer={
                      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                        {statusSlices.map((s) => (
                          <div key={s.name} className="flex items-center gap-1.5 text-xs">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: s.color }}
                            />
                            <span className="text-slate-600">{s.name}</span>
                            <span className="font-semibold tabular-nums text-slate-800">
                              {fmt(s.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    }
                  />
                ) : (
                  <EmptyPanel label={loading ? "Loading…" : "No data."} />
                )}
              </VisualCard>
            </div>

            <VisualCard title="Top issuing operators" noPadding>
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="w-12 px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Operator</th>
                      <th className="px-3 py-2 text-right font-semibold">Cards issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.topOperators ?? []).map((o, i) => (
                      <tr key={o.name} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-3 py-2 text-slate-500 tabular-nums">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{o.name}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                          {fmt(o.value)}
                        </td>
                      </tr>
                    ))}
                    {(!stats || stats.topOperators.length === 0) && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          {loading ? "Loading…" : "No operators in this range."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </VisualCard>
          </TabsContent>

          {/* ── Activity (by hour of day) ── */}
          <TabsContent value="activity" className="mt-3 space-y-4 focus-visible:outline-none">
            <VisualCard title="Issues by hour of day">
              {stats && stats.byHour.some((h) => h.count > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={stats.byHour}
                    barCategoryGap="20%"
                    margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={hourLabel}
                      tick={{ fontSize: 10, fill: "#666" }}
                      tickLine={false}
                      axisLine={{ stroke: "#d4d4d4" }}
                      interval={1}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#666" }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      content={<MiniTooltip color="#0ea5e9" labelFn={(l) => hourLabel(l)} />}
                    />
                    <Bar
                      dataKey="count"
                      name="Issued"
                      fill="#0ea5e9"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={34}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel label={loading ? "Loading…" : "No issues in this range."} />
              )}
            </VisualCard>
          </TabsContent>

          {/* ── Recent issues ── */}
          <TabsContent value="recent" className="mt-3 focus-visible:outline-none">
            <VisualCard title="Recent issues" noPadding>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Student</th>
                      <th className="px-3 py-2 font-semibold">UID</th>
                      <th className="px-3 py-2 font-semibold">Course</th>
                      <th className="px-3 py-2 font-semibold">RFID</th>
                      <th className="px-3 py-2 font-semibold">Type</th>
                      <th className="px-3 py-2 font-semibold">Issued by</th>
                      <th className="px-3 py-2 font-semibold">Issued at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recent ?? []).map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {r.studentName ?? "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-600">{r.uid ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{r.course ?? "—"}</td>
                        <td className="px-3 py-2 tabular-nums text-slate-600">
                          {r.rfidNumber ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
                            style={{ background: STATUS_COLORS[r.issueStatus] ?? "#64748b" }}
                          >
                            {r.issueStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{r.issuedBy ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-500">{r.issuedAt ?? "—"}</td>
                      </tr>
                    ))}
                    {(!stats || stats.recent.length === 0) && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          {loading ? "Loading…" : "No issues in this range."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </VisualCard>
          </TabsContent>
        </div>
      </Tabs>

      <LiveUpdatesBadge connected={isConnected} loading={statsQuery.isFetching} />
    </div>
  );
}
