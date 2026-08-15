import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpen,
  Boxes,
  BookMarked,
  Clock,
  Filter,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  RefreshCcw,
  Users,
  UserRoundCheck,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradientStatCard } from "@/features/notifications/components/gradient-stat-card";
import { VisualCard } from "@/features/fees-dashboard/components/VisualCard";
import { ChartDonut } from "@/features/fees-dashboard/components/ChartDonut";
import { LiveUpdatesBadge } from "@/features/fees-dashboard/components/LiveUpdatesBadge";
import { formatCompactIN } from "@/features/notifications/utils/format";
import { useLibraryRealtime } from "@/features/library/hooks/useLibraryRealtime";
import { LibrarySyncBanner } from "./LibrarySyncBanner";
import { getLibraryBranches } from "@/services/library-branches.service";
import {
  getLibraryDashboardStats,
  type LibraryDashboardFilters,
  type LibraryDashboardStats,
  getCirculationPolicies,
  getLibraryLoadStatus,
  getCatalogueCounts,
  type LibraryCatalogueGroup,
  getLibraryHolidaysReport,
  type LibraryHolidaysReport,
} from "@/services/library-dashboard.service";
import { cn } from "@/lib/utils";
// Same table primitives the fees and notifications dashboards use — bordered
// frame, dense header, ruled cells — so all three modules read as a family.
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "@/features/fees-dashboard/components/FeesTable";
// Raw shadcn TableCell for the rowSpan-merged cells in the Policies matrix —
// FeesTableCell only proxies colSpan, so rowSpan={n} was being dropped.
import { TableCell } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { HolidayMonthCalendar } from "./HolidayMonthCalendar";

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "circulation", label: "Circulation" },
  // Values are stable keys (deep links, remounts) — only the labels were
  // renamed to plainer words: Holdings → Catalogue, Footfall → Visits,
  // Fines → Fines & dues.
  { value: "holdings", label: "Catalogue" },
  { value: "footfall", label: "Visits" },
  { value: "fines", label: "Fines & dues" },
  { value: "policies", label: "Policies" },
  // Article entries lives as its own tab so the article-tables (books,
  // copies, journals, issues, series, LA rows) get a full row-share view
  // without competing for space inside Holdings. Catalogue / Masters /
  // Operational lived here briefly too — dropped, since those numbers are
  // either operational noise or duplicate what Circulation / Fines already
  // surface.
  { value: "articles", label: "Article entries" },
  // Holidays owns its own tab because it needs a 2-D view (holidays × program
  // course × semester), which doesn't fit next to a simple counts table.
  { value: "holidays", label: "Holidays" },
] as const;

const RANGE_PRESETS = [
  // "Today" is the default — the dashboard opens on the current day's
  // activity. Non-date-scoped stats (Books, Copies, In library now) are
  // unaffected by this filter.
  { value: "today", label: "Today", days: 0 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "14d", label: "Last 14 days", days: 14 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "month", label: "This month", days: null as number | null },
  { value: "all", label: "All time", days: null as number | null },
  { value: "custom", label: "Custom", days: null as number | null },
] as const;

type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

type DraftFilters = LibraryDashboardFilters & { preset: RangePreset };

function resolveRange(preset: RangePreset, fromRaw?: string | null, toRaw?: string | null) {
  const now = new Date();
  const to = new Date(now);
  let from = new Date(now);
  if (preset === "all") {
    return { dateFrom: null, dateTo: null };
  }
  if (preset === "today") {
    // Server-local midnight → now. Same convention as the "In library now"
    // tile so both scopes agree on what "today" means.
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }
  if (preset === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === "custom") {
    return { dateFrom: fromRaw ?? null, dateTo: toRaw ?? null };
  } else {
    const days = RANGE_PRESETS.find((r) => r.value === preset)?.days ?? 14;
    from.setDate(from.getDate() - (days ?? 14));
  }
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

/**
 * The Overview trend charts (footfall, issues per day) need a trend, not a
 * dot — on the default "Today" filter a one-point series renders as a single
 * marker. Pad the chart window back to at least 7 calendar days ending at the
 * filter's end date. Returns the SAME object when no widening is needed so
 * the widened query key matches the main one and react-query dedupes instead
 * of fetching twice.
 */
const MIN_CHART_DAYS = 7;
function widenRangeForCharts(applied: LibraryDashboardFilters): LibraryDashboardFilters {
  if (!applied.dateFrom) return applied; // all-time already spans ≥7 days
  const to = applied.dateTo ? new Date(applied.dateTo) : new Date();
  const from = new Date(applied.dateFrom);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return applied;
  if (to.getTime() - from.getTime() >= (MIN_CHART_DAYS - 1) * 86_400_000) return applied;
  const widenedFrom = new Date(to);
  widenedFrom.setDate(widenedFrom.getDate() - (MIN_CHART_DAYS - 1));
  widenedFrom.setHours(0, 0, 0, 0);
  return { ...applied, dateFrom: widenedFrom.toISOString() };
}

const nfmt = new Intl.NumberFormat("en-IN");
const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/** Compact rupees for tile values — "₹1.2L" fits a KPI card, "₹1,20,000" does not. */
const inrShort = (n: number) => `₹${formatCompactIN(n)}`;

/** Line colours for the per-patron-type visit series, assigned by traffic
 *  volume so the busiest patron type always gets the module violet. */
const CATEGORY_LINE_COLORS = [
  "#7c3aed",
  "#0891b2",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#2563eb",
  "#10b981",
  "#64748b",
] as const;

/** Fixed hues for the types staff recognise at a glance — STUDENT wears the
 *  module violet, STAFF wears red (mirrors the notifications trend chart's
 *  primary/danger pairing). Everything else takes the palette in volume
 *  order. */
const CATEGORY_COLOR_OVERRIDES: Record<string, string> = {
  STUDENT: "#7c3aed",
  STAFF: "#dc2626",
};

function colorForCategory(category: string, index: number): string {
  return (
    CATEGORY_COLOR_OVERRIDES[category] ??
    (CATEGORY_LINE_COLORS[index % CATEGORY_LINE_COLORS.length] as string)
  );
}

/**
 * Pivot the day × patron-type rows into one recharts row per day with a key
 * per category, binning to ISO weeks past ~4 months (same reasoning as the
 * old single-line aggregator: a multi-year daily series reads as static).
 * Categories come back ordered by total volume for stable colour assignment.
 */
function pivotVisitsByCategory(rows: Array<{ day: string; category: string; count: number }>): {
  data: Array<Record<string, number | string>>;
  categories: string[];
  weekly: boolean;
} {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.category, (totals.get(r.category) ?? 0) + r.count);
  const categories = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);

  const dayCount = new Set(rows.map((r) => r.day)).size;
  const weekly = dayCount > 120;
  const includeYear = spansMultipleYears(rows.map((r) => ({ day: r.day })));
  const fmt = (d: string) => (includeYear ? fmtDayYear(d) : fmtDay(d));
  const keyOf = (day: string) => {
    if (!weekly) return day;
    const dt = new Date(day);
    if (Number.isNaN(dt.getTime())) return day;
    dt.setDate(dt.getDate() - dt.getDay());
    return dt.toISOString().slice(0, 10);
  };

  const byKey = new Map<string, Record<string, number | string>>();
  for (const r of rows) {
    const k = keyOf(r.day);
    let row = byKey.get(k);
    if (!row) {
      row = { date: fmt(k) };
      for (const c of categories) row[c] = 0;
      byKey.set(k, row);
    }
    row[r.category] = ((row[r.category] as number) ?? 0) + r.count;
  }
  const data = Array.from(byKey.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
  return { data, categories, weekly };
}

/** Generic multi-series tooltip — same white card as the notifications trend
 *  tooltip, one row per line in the chart. */
function MultiSeriesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; stroke?: string; color?: string }>;
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
              style={{ backgroundColor: p.stroke ?? p.color }}
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

/** Styled tooltip for the circulation trend chart — same white card recipe
 *  as the notifications trend tooltip, instead of the default recharts box. */
function IssuesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { issues?: number; reissues?: number; returns?: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-[#1a1a1a]">{label}</p>
      {(
        [
          ["Issues", row.issues ?? 0, "#7c3aed"],
          ["Reissues", row.reissues ?? 0, "#f59e0b"],
          ["Returns", row.returns ?? 0, "#10b981"],
        ] as const
      ).map(([name, val, color]) => (
        <div key={name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#444]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {name}
          </span>
          <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
            {nfmt.format(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLOURS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#0ea5e9",
  "#8b5cf6",
  "#14b8a6",
  "#f43f5e",
];

function spansMultipleYears(rows: Array<{ day: string }>): boolean {
  if (rows.length < 2) return false;
  const years = new Set<number>();
  for (const r of rows) {
    const y = new Date(r.day).getFullYear();
    if (Number.isFinite(y)) years.add(y);
  }
  return years.size > 1;
}

function fmtDayYear(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDay(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** dd/mm/yyyy for a single date string — used in chart titles/tooltips. */
function fmtDMY(d: string | Date | null | undefined): string | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Human range for a chart title: prefers the filter's explicit from/to when
 * present, otherwise falls back to the first/last day the data covers so the
 * "All time" preset still shows a meaningful window instead of "all time".
 */
function formatDateRangeDMY(
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined,
  opts: {
    fallback?: string;
    entryDays?: Array<{ day: string }>;
  } = {},
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

/**
 * Wall-clock elapsed for the loader banner, anchored on the server-provided
 * `startedAt`. Ticks every second so the display walks smoothly between
 * emits and survives a page refresh mid-load (the server anchor means every
 * dashboard sees the same elapsed).
 */
function useLoaderElapsed(startedAtISO: string | null | undefined): number | null {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startedAtISO) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [startedAtISO]);

  const serverStartMs = useMemo(() => {
    if (!startedAtISO) return null;
    const t = new Date(startedAtISO).getTime();
    return Number.isFinite(t) ? t : null;
  }, [startedAtISO]);

  if (serverStartMs == null) return null;
  return Math.max(0, Date.now() - serverStartMs);
}

/**
 * Rate-based ETA using a rolling recent-window of row-progress samples.
 *
 * Every emit contributes a `(t, rowsProcessed)` sample. We keep the last 30
 * (~2–5 minutes of activity depending on load pace) and fit rate from the
 * oldest-still-in-window to the newest: `rate = Δrows / Δt`. Remaining is
 * then `(rowsTotal − rowsProcessed) / rate`.
 *
 * Why not since-start rate: earlier layers process small master tables
 * ~10× faster per row than later layers with heavy FK-joined resolvers. A
 * since-start average stays biased toward the fast phase and every subsequent
 * emit had to ratchet upward. A recent-window rate settles at the CURRENT
 * pace, so the ETA is stable once we're inside a layer and only jumps ONCE
 * at layer transitions (honest correction, not creeping growth).
 *
 * Between emits, the caller subtracts wall-clock delta from the stored
 * remaining so the display counts DOWN like a real timer. On new emit,
 * remaining is recomputed and stored. Clamped at 0 when the loader outpaces
 * our estimate.
 *
 * Resets on a large percent regression (new run detected).
 */
function useLoaderRateETA(
  rowsProcessed: number | null | undefined,
  rowsTotal: number | null | undefined,
): { remainingMs: number | null; ratePerSec: number | null } {
  const samplesRef = useRef<Array<{ t: number; rows: number }>>([]);
  // Stored (computedAt, remainingMs) — between emits we subtract wall-clock
  // delta from this to get a live-counting-down display.
  const storedRef = useRef<{ computedAt: number; remainingMs: number } | null>(null);
  const rateRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (rowsProcessed == null || rowsTotal == null || rowsTotal <= 0) return;
    const now = Date.now();
    const samples = samplesRef.current;
    const last = samples[samples.length - 1];
    // New run — cumulative rows went backwards materially.
    if (last && last.rows > rowsProcessed + 10) {
      samples.length = 0;
      storedRef.current = null;
      rateRef.current = null;
    }
    // Skip zero-progress emits (same rows as last sample) — they add noise
    // to the rate fit without carrying new information.
    if (!last || last.rows !== rowsProcessed) {
      samples.push({ t: now, rows: rowsProcessed });
    }
    while (samples.length > 30) samples.shift();

    const first = samples[0];
    const latest = samples[samples.length - 1];
    if (samples.length >= 2 && first && latest) {
      const dt = latest.t - first.t;
      const dRows = latest.rows - first.rows;
      if (dt > 0 && dRows > 0) {
        const rate = dRows / dt; // rows per ms
        rateRef.current = rate;
        const rowsLeft = Math.max(0, rowsTotal - rowsProcessed);
        const remainingMs = rowsLeft / rate;
        storedRef.current = { computedAt: now, remainingMs };
      }
    }
    setTick((x) => x + 1);
  }, [rowsProcessed, rowsTotal]);

  useEffect(() => {
    if (rowsProcessed == null || rowsTotal == null) return;
    if (rowsProcessed >= rowsTotal) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [rowsProcessed, rowsTotal]);

  const now = Date.now();
  let remainingMs: number | null = null;
  if (storedRef.current) {
    remainingMs = Math.max(0, storedRef.current.remainingMs - (now - storedRef.current.computedAt));
  }
  const ratePerSec = rateRef.current ? rateRef.current * 1000 : null;
  return { remainingMs, ratePerSec };
}

/** "5m 12s" style formatter — collapses to "<1s" for sub-second values. */
function formatDurationHuman(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return "<1s";
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

/**
 * Gradient palette matching the notifications dashboard — same visual system
 * across the console so the library tiles read as one product.
 */
const GRADIENTS = {
  indigo: "from-[#3730a3] via-[#4f46e5] to-[#6366f1]",
  emerald: "from-[#047857] via-[#059669] to-[#10b981]",
  amber: "from-[#b45309] via-[#d97706] to-[#f59e0b]",
  rose: "from-[#b91c1c] via-[#dc2626] to-[#ef4444]",
  violet: "from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]",
  cyan: "from-[#0e7490] via-[#0891b2] to-[#06b6d4]",
  sky: "from-[#1d4ed8] via-[#2563eb] to-[#3b82f6]",
  pink: "from-[#9d174d] via-[#be185d] to-[#ec4899]",
} as const;

// Alias so the render body reads the same as fees / notifications pages.
/**
 * Set true once at least one socket event has fired this session. Panels use
 * it to decide whether to apply the flash class on remount — the first
 * render on page load must NOT flash (every widget would pulse for no
 * reason), only subsequent remounts triggered by socket activity should.
 */
const LibraryFlashContext = createContext(false);

function PanelCard(props: React.ComponentProps<typeof VisualCard>) {
  const shouldFlash = useContext(LibraryFlashContext);
  return (
    <VisualCard {...props} className={cn(shouldFlash && "library-live-flash", props.className)} />
  );
}

/**
 * Ranked list — a rank number in a coloured square, a labelled row and a right-
 * aligned tabular number. The old edge-to-edge horizontal bar looked flat and
 * hid the value inside the row; ranks + spacing read at a glance.
 */
function RankedList({
  items,
  emptyLabel,
  format,
  accent = "text-indigo-700 bg-indigo-50",
}: {
  items: Array<{ key: string; label: string; value: number }>;
  emptyLabel: string;
  format?: (v: number) => string;
  /** Tailwind pair for the rank pill: text colour + bg colour. */
  accent?: string;
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
          </span>
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {format ? format(it.value) : nfmt.format(it.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  chartStats,
  chartApplied,
}: {
  stats: LibraryDashboardStats;
  /** Stats for the (possibly widened) chart window — trend charts read these
   *  so they always cover at least the last 7 days; tiles keep `stats`. */
  chartStats: LibraryDashboardStats;
  chartApplied: LibraryDashboardFilters;
}) {
  // Title reflects the chart window, not a hard-coded "last 14 days". When
  // the user picks "all time" (or the range covers the full data extent) the
  // title says "all time"; otherwise it spells out the exact dd/mm/yyyy
  // window using the same helper the footfall chart uses.
  const issueRangeLabel = formatDateRangeDMY(chartApplied.dateFrom, chartApplied.dateTo, {
    fallback: "all time",
    entryDays: chartStats.dailyIssuesLast14,
  });
  // One line per patron type; falls back to a single "Entries" line while an
  // older cached stats payload (without the per-category series) is on screen.
  const visits = useMemo(() => {
    const rows = chartStats.entryExitByDayByCategory?.length
      ? chartStats.entryExitByDayByCategory
      : chartStats.entryExitByDay.map((d) => ({ day: d.day, category: "Entries", count: d.count }));
    return pivotVisitsByCategory(rows);
  }, [chartStats.entryExitByDayByCategory, chartStats.entryExitByDay]);
  const donutData = useMemo(
    () =>
      stats.copiesByStatus.map((s, i) => ({
        name: s.statusName,
        value: s.count,
        // STATUS_COLOURS is a fixed non-empty tuple; modulo always lands in it,
        // but TS widens the index access to `string | undefined` — pin the type.
        color: STATUS_COLOURS[i % STATUS_COLOURS.length] as string,
      })),
    [stats.copiesByStatus],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {/* Same six-hue spread as the notifications KPI strip — violet, blue,
            amber, red, green, teal — so no two neighbouring tiles share a hue
            (the old strip had Books and Active issues both purple). */}
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={BookOpen}
          label="Books"
          value={formatCompactIN(stats.totalBooks)}
          hint="catalogued titles"
        />
        <GradientStatCard
          gradient={GRADIENTS.sky}
          icon={Boxes}
          label="Copies"
          value={formatCompactIN(stats.totalCopies)}
          hint="physical + e-copies"
        />
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={BookMarked}
          label="Active issues"
          value={formatCompactIN(stats.activeIssues)}
          hint="currently borrowed"
        />
        <GradientStatCard
          gradient={GRADIENTS.rose}
          icon={Clock}
          label="Overdue"
          value={formatCompactIN(stats.overdueCount)}
          hint="past due date"
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={IndianRupee}
          label="Fines collected"
          value={inrShort(stats.finesCollectedThisMonth)}
          hint="in the selected range"
        />
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={UserRoundCheck}
          label="In library now"
          value={formatCompactIN(stats.currentlyInLibrary)}
          hint="checked in, not out"
        />
      </div>

      {/* Entry trend with one line per patron type — same overlaid multi-
          line recipe as the notifications "over time" chart. Weekly bins
          past ~4 months so a multi-year window doesn't read as static. */}
      <VisualCard
        title={`Library visits · ${visits.weekly ? "weekly" : "daily"} · one line per patron type · ${issueRangeLabel}`}
      >
        {visits.data.length === 0 ? (
          <EmptyPanel label="No visits in the last 7 days" />
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={visits.data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
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
                {visits.categories.map((c, i) => {
                  const color = colorForCategory(c, i);
                  return (
                    <Area
                      key={c}
                      type="monotone"
                      dataKey={c}
                      name={c}
                      stroke={color}
                      strokeWidth={2}
                      fill={color}
                      fillOpacity={i === 0 ? 0.15 : 0.08}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
              {visits.categories.map((c, i) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: colorForCategory(c, i) }}
                  />
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </VisualCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Grouped bars (three per day) — deliberately a different chart
            shape from the visits area above so the two Overview trends
            don't read as the same widget twice. */}
        <PanelCard
          title={`Issues · reissues · returns · ${issueRangeLabel}`}
          className="lg:col-span-2"
        >
          {chartStats.dailyIssuesLast14.length === 0 ? (
            <EmptyPanel label="No circulation activity in the last 7 days" />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartStats.dailyIssuesLast14.map((d) => ({ ...d, label: fmtDay(d.day) }))}
                  barGap={2}
                  barCategoryGap="22%"
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<IssuesTooltip />} />
                  <Bar dataKey="issues" name="Issues" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="reissues" name="Reissues" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="returns" name="Returns" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#7c3aed]" /> Issues
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Reissues
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Returns
                </span>
              </div>
            </div>
          )}
        </PanelCard>

        <PanelCard title="Copies by status">
          {donutData.length === 0 || donutData.every((d) => d.value === 0) ? (
            <EmptyPanel label="No copies catalogued yet" />
          ) : (
            <ChartDonut
              data={donutData}
              centerLabel={
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-slate-900">
                    {nfmt.format(stats.totalCopies)}
                  </span>
                  <span className="text-xs text-slate-500">Copies</span>
                </div>
              }
            />
          )}
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelCard title="Top 5 books">
          <RankedList
            emptyLabel="No circulation yet"
            items={stats.topBooks.map((b) => ({
              key: String(b.bookId),
              label: b.title || `Book #${b.bookId}`,
              value: b.issueCount,
            }))}
          />
        </PanelCard>
        <PanelCard title="Top 5 patrons">
          <RankedList
            emptyLabel="No circulation yet"
            accent="text-violet-700 bg-violet-50"
            items={stats.topPatrons.map((p) => ({
              key: String(p.userId),
              label: p.userName ?? `Patron #${p.userId}`,
              value: p.issueCount,
            }))}
          />
        </PanelCard>
      </div>
    </div>
  );
}

/** Patron chip — STUDENT wears the module violet, STAFF red (same pairing
 *  as the visits chart lines), FACULTY amber. */
function UserTypeBadge({ category }: { category: string }) {
  const cls =
    category === "STUDENT"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : category === "FACULTY"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <Badge variant="outline" className={cls}>
      {category}
    </Badge>
  );
}

/** Ageing buckets get hotter as loans get later — amber → orange → red. */
const AGEING_BUCKETS = [
  { key: "0-7", label: "1–7 days late", color: "#f59e0b" },
  { key: "8-30", label: "8–30 days late", color: "#f97316" },
  { key: ">30", label: "30+ days late", color: "#dc2626" },
] as const;

function CirculationTab({ stats }: { stats: LibraryDashboardStats }) {
  const ageing = AGEING_BUCKETS.map((b) => {
    const found = stats.overdueAgeing.find((r) => r.bucket === b.key);
    return { bucket: b.label, count: found?.count ?? 0, fill: b.color };
  });
  const total = stats.activeIssues;
  const overdue = stats.overdueCount;
  const onTime = Math.max(0, total - overdue);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GradientStatCard
          gradient={GRADIENTS.indigo}
          icon={BookMarked}
          label="Active issues"
          value={formatCompactIN(total)}
          hint="currently borrowed"
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={BookOpen}
          label="On-time"
          value={formatCompactIN(onTime)}
          hint="within due date"
        />
        <GradientStatCard
          gradient={GRADIENTS.rose}
          icon={Clock}
          label="Overdue"
          value={formatCompactIN(overdue)}
          hint="past due date"
        />
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={RefreshCcw}
          label="Reissues"
          value={formatCompactIN(stats.reissueCount)}
          hint={`in the selected range · ${formatCompactIN(stats.reissueCountAllTime)} all-time`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelCard title="Overdue ageing · how late are the late ones" className="lg:col-span-2">
          {overdue === 0 ? (
            <EmptyPanel label="Nothing overdue" />
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageing} margin={{ top: 20, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<MultiSeriesTooltip />} />
                  {/* Per-bar colour comes from each row's `fill`; the value
                      label on top saves a hover for the exact count. */}
                  <Bar dataKey="count" name="Loans" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="count"
                      position="top"
                      formatter={(v: number) => nfmt.format(v)}
                      style={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                    />
                    {ageing.map((row) => (
                      <Cell key={row.bucket} fill={row.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-slate-600">
                {AGEING_BUCKETS.map((b) => (
                  <span key={b.key} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </PanelCard>
        <PanelCard title="Loan quality">
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50/70 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs text-violet-700/80">Average loan duration</div>
                <div className="text-lg font-bold text-violet-900">
                  {stats.avgLoanDays > 0 ? `${stats.avgLoanDays.toFixed(1)} days` : "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/70 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs text-amber-700/80">Forced issues</div>
                <div className="text-lg font-bold text-amber-900">
                  {nfmt.format(stats.forcedIssueCount)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <IndianRupee className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs text-emerald-700/80">Fines waived this month</div>
                <div className="text-lg font-bold text-emerald-900">
                  {inr(stats.finesWaivedThisMonth)}
                </div>
              </div>
            </div>
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Top overdue borrowers (top 10)">
        <FeesTable fixed={false} framed stickyHeader maxHeight="max-h-[420px]">
          <FeesTableHeader>
            <FeesTableHead className="w-[56px] text-center">Sr no</FeesTableHead>
            <FeesTableHead>Borrower</FeesTableHead>
            <FeesTableHead className="text-center">UID / Code</FeesTableHead>
            <FeesTableHead className="text-center">Patron</FeesTableHead>
            <FeesTableHead className="text-center">Books overdue</FeesTableHead>
          </FeesTableHeader>
          <FeesTableBody>
            {stats.overdueByPatron.length === 0 ? (
              <EmptyRow label="Nobody is overdue" cols={5} />
            ) : (
              stats.overdueByPatron.map((r, i) => (
                <FeesTableRow key={r.userId}>
                  <FeesTableCell className="text-center tabular-nums text-[#555]">
                    {i + 1}
                  </FeesTableCell>
                  <FeesTableCell className="font-medium text-[#333]">
                    {r.userName ?? `Patron #${r.userId}`}
                  </FeesTableCell>
                  <FeesTableCell className="text-center tabular-nums text-[#555]">
                    {r.uid ?? "—"}
                  </FeesTableCell>
                  <FeesTableCell className="text-center">
                    <UserTypeBadge category={r.category} />
                  </FeesTableCell>
                  <FeesTableCell className="text-center font-semibold tabular-nums text-rose-700">
                    {nfmt.format(r.count)}
                  </FeesTableCell>
                </FeesTableRow>
              ))
            )}
          </FeesTableBody>
        </FeesTable>
      </PanelCard>

      <PanelCard title="Longest overdue books (top 10)">
        <FeesTable fixed={false} framed stickyHeader maxHeight="max-h-[420px]">
          <FeesTableHeader>
            <FeesTableHead>Book</FeesTableHead>
            <FeesTableHead>Borrower</FeesTableHead>
            <FeesTableHead className="text-center">UID / Code</FeesTableHead>
            <FeesTableHead className="text-center">Patron</FeesTableHead>
            <FeesTableHead className="text-center">Due on</FeesTableHead>
            <FeesTableHead className="text-center">Days overdue</FeesTableHead>
          </FeesTableHeader>
          <FeesTableBody>
            {stats.longestOverdue.length === 0 ? (
              <EmptyRow label="Nothing overdue" cols={6} />
            ) : (
              stats.longestOverdue.map((r) => (
                <FeesTableRow key={r.circulationId}>
                  <FeesTableCell className="max-w-[380px] truncate font-medium text-[#333]">
                    {r.title}
                  </FeesTableCell>
                  <FeesTableCell>{r.userName ?? "—"}</FeesTableCell>
                  <FeesTableCell className="text-center tabular-nums text-[#555]">
                    {r.uid ?? "—"}
                  </FeesTableCell>
                  <FeesTableCell className="text-center">
                    <UserTypeBadge category={r.category} />
                  </FeesTableCell>
                  <FeesTableCell className="text-center tabular-nums">
                    {fmtDMY(r.dueDate) ?? r.dueDate}
                  </FeesTableCell>
                  <FeesTableCell className="text-center font-semibold tabular-nums text-rose-700">
                    {nfmt.format(r.daysOverdue)}
                  </FeesTableCell>
                </FeesTableRow>
              ))
            )}
          </FeesTableBody>
        </FeesTable>
      </PanelCard>
    </div>
  );
}

function HoldingsTab({ stats }: { stats: LibraryDashboardStats }) {
  const totalCopies = stats.copiesByRack.reduce((a, r) => a + r.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Red → green → orange → purple spread; the per-year bar chart
            below wears orange to echo the warm end of the strip. */}
        <GradientStatCard
          gradient={GRADIENTS.rose}
          icon={BookOpen}
          label="Books"
          value={formatCompactIN(stats.totalBooks)}
          hint="catalogued titles"
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={Boxes}
          label="Copies"
          value={formatCompactIN(stats.totalCopies)}
          hint="physical + e-copies"
        />
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={BookMarked}
          label="Languages"
          value={formatCompactIN(stats.totalLanguages)}
          hint="distinct languages in the catalogue"
        />
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={Boxes}
          label="Publishers"
          value={formatCompactIN(stats.totalPublishers)}
          hint="distinct publishers in the catalogue"
        />
      </div>

      {/* Books added per year — moved up to sit right below the stat cards. */}
      <PanelCard title="Books added per year">
        {stats.booksAddedPerYear.length === 0 ? (
          <EmptyPanel label="No catalogued books" />
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.booksAddedPerYear}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </PanelCard>

      {/* Tables (with % of total) read better than donuts when there are many
          slices — a librarian wants the exact figure and share side by side. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelCard title="Books by language">
          <FeesTable fixed={false} framed stickyHeader maxHeight="max-h-[320px]">
            <FeesTableHeader>
              <FeesTableHead>Language</FeesTableHead>
              <FeesTableHead className="text-right">Books</FeesTableHead>
              <FeesTableHead className="text-right">Share</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {stats.booksByLanguage.length === 0 ? (
                <EmptyRow label="No language on the catalogued books" cols={3} />
              ) : (
                stats.booksByLanguage.map((r) => {
                  const pct = stats.totalBooks
                    ? Math.round((r.count / stats.totalBooks) * 1000) / 10
                    : 0;
                  return (
                    <FeesTableRow key={r.language}>
                      <FeesTableCell className="font-medium text-[#333]">
                        {r.language}
                      </FeesTableCell>
                      <FeesTableCell className="text-right tabular-nums">
                        {nfmt.format(r.count)}
                      </FeesTableCell>
                      <FeesTableCell className="text-right tabular-nums text-[#555]">
                        {pct}%
                      </FeesTableCell>
                    </FeesTableRow>
                  );
                })
              )}
            </FeesTableBody>
          </FeesTable>
        </PanelCard>

        <PanelCard title="Books by document type">
          <FeesTable fixed={false} framed stickyHeader maxHeight="max-h-[320px]">
            <FeesTableHeader>
              <FeesTableHead>Document type</FeesTableHead>
              <FeesTableHead className="text-right">Books</FeesTableHead>
              <FeesTableHead className="text-right">Share</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {stats.booksByDocumentType.length === 0 ? (
                <EmptyRow label="No document type set on any book" cols={3} />
              ) : (
                stats.booksByDocumentType.map((r) => {
                  const pct = stats.totalBooks
                    ? Math.round((r.count / stats.totalBooks) * 1000) / 10
                    : 0;
                  return (
                    <FeesTableRow key={r.documentType}>
                      <FeesTableCell className="font-medium text-[#333]">
                        {r.documentType}
                      </FeesTableCell>
                      <FeesTableCell className="text-right tabular-nums">
                        {nfmt.format(r.count)}
                      </FeesTableCell>
                      <FeesTableCell className="text-right tabular-nums text-[#555]">
                        {pct}%
                      </FeesTableCell>
                    </FeesTableRow>
                  );
                })
              )}
            </FeesTableBody>
          </FeesTable>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelCard title="Top publishers (by number of books)">
          <RankedList
            emptyLabel="No books yet"
            accent="text-emerald-700 bg-emerald-50"
            items={stats.booksByPublisher.map((r) => ({
              key: r.publisher,
              label: r.publisher,
              value: r.count,
            }))}
          />
        </PanelCard>
        <PanelCard title={`Copies by rack — ${nfmt.format(totalCopies)} placed`}>
          <RankedList
            emptyLabel="No copies assigned to a rack"
            accent="text-amber-700 bg-amber-50"
            items={stats.copiesByRack.map((r) => ({
              key: r.rack,
              label: r.rack,
              value: r.count,
            }))}
          />
        </PanelCard>
      </div>
    </div>
  );
}

/**
 * Single-group catalogue counts tab. The four tabs (Article entries,
 * Catalogue & credits, Masters, Operational) all render through this one
 * component — they share the same query so the counts land once and both
 * fan out from the cache.
 *
 * `library-catalogue-counts` is invalidated by the realtime hook on every
 * `library:master:updated`, so the table refreshes live as the operator
 * enters new data (or the loader lands new rows). The PanelCard wrapper
 * carries `library-live-flash`, so its border pulses on refresh — matching
 * the flash behaviour of the rest of the dashboard.
 */
function CatalogueGroupTab({
  groupKey,
  title,
  emptyLabel,
}: {
  groupKey: string;
  title: string;
  emptyLabel: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["library-catalogue-counts"],
    queryFn: getCatalogueCounts,
    staleTime: 30_000,
  });
  const group: LibraryCatalogueGroup | undefined = data?.find((g) => g.key === groupKey);
  const items = group?.items ?? [];
  const total = items.reduce((a, r) => a + r.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <PanelCard
        title={`${title} — ${nfmt.format(total)} row${total === 1 ? "" : "s"} across ${items.length} table${items.length === 1 ? "" : "s"}`}
      >
        {isError ? (
          <EmptyPanel label="Failed to load counts" />
        ) : (
          <FeesTable fixed={false} framed stickyHeader maxHeight="max-h-[600px]">
            <FeesTableHeader>
              <FeesTableHead>Entity</FeesTableHead>
              <FeesTableHead className="text-right">Rows</FeesTableHead>
              <FeesTableHead className="text-right">Share</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {isLoading && items.length === 0 ? (
                <SkeletonRows rows={6} cols={3} />
              ) : items.length === 0 ? (
                <EmptyRow label={emptyLabel} cols={3} />
              ) : (
                items.map((r) => {
                  const pct = total ? Math.round((r.count / total) * 1000) / 10 : 0;
                  return (
                    <FeesTableRow key={r.key}>
                      <FeesTableCell className="font-medium text-[#333]">{r.label}</FeesTableCell>
                      <FeesTableCell className="text-right tabular-nums">
                        {nfmt.format(r.count)}
                      </FeesTableCell>
                      <FeesTableCell className="text-right tabular-nums text-[#555]">
                        {total ? `${pct}%` : "—"}
                      </FeesTableCell>
                    </FeesTableRow>
                  );
                })
              )}
            </FeesTableBody>
          </FeesTable>
        )}
      </PanelCard>
    </div>
  );
}

/**
 * Holidays tab — three tables in one view:
 *  1. Top stat cards (total holidays, active class assignments, programme courses,
 *     semesters covered).
 *  2. Holiday calendar — one row per holiday, with the dd/mm/yyyy range and
 *     how many class assignments mark it as a holiday.
 *  3. Program-course × semester breakdown — the "how many holidays does BA-1
 *     get this year" view the librarian actually plans against.
 *
 * Backing endpoint: /library/dashboard/holidays-report. Live-refreshes on
 * `library:master:updated`.
 */
function HolidaysTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["library-holidays-report"],
    queryFn: getLibraryHolidaysReport,
    staleTime: 30_000,
  });
  const report: LibraryHolidaysReport | undefined = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GradientStatCard
          gradient={GRADIENTS.indigo}
          icon={BookOpen}
          label="Holidays"
          value={formatCompactIN(report?.totals.holidays ?? 0)}
          hint="calendar entries"
        />
        <GradientStatCard
          gradient={GRADIENTS.emerald}
          icon={Users}
          label="Active assignments"
          value={formatCompactIN(report?.totals.activeAssignments ?? 0)}
          hint="course × semester × holiday"
        />
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={Boxes}
          label="Programme courses"
          value={formatCompactIN(report?.totals.programCourses ?? 0)}
          hint="with a holiday mapping"
        />
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={Clock}
          label="Semesters covered"
          value={formatCompactIN(report?.totals.classes ?? 0)}
          hint="distinct semesters"
        />
      </div>

      <PanelCard title="Holiday calendar">
        {isError ? (
          <EmptyPanel label="Failed to load holidays" />
        ) : isLoading && !report ? (
          <div className="p-4 text-sm text-slate-500">Loading calendar…</div>
        ) : !report || report.holidays.length === 0 ? (
          <EmptyPanel label="No holidays on record" />
        ) : (
          <HolidayMonthCalendar holidays={report.holidays} />
        )}
      </PanelCard>
    </div>
  );
}

function FootfallTab({ stats }: { stats: LibraryDashboardStats }) {
  // Both series in one row per hour so recharts can draw them side by side —
  // easier to read than two separate charts and shows the entry-vs-exit
  // pattern at a glance.
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}h`,
    entries: stats.entriesByHourOfDay.find((r) => r.hour === h)?.count ?? 0,
    exits: stats.exitsByHourOfDay.find((r) => r.hour === h)?.count ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={UserRoundCheck}
          label="In library now"
          value={formatCompactIN(stats.currentlyInLibrary)}
          hint="checked in, not out"
        />
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={Users}
          label="Visits in range"
          value={formatCompactIN(stats.entryExitByDay.reduce((a, r) => a + r.count, 0))}
          hint="library entries"
        />
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={Clock}
          label="Avg time spent"
          value={stats.avgVisitMinutes > 0 ? `${stats.avgVisitMinutes.toFixed(0)} min` : "—"}
          hint="entry to exit"
        />
      </div>

      <PanelCard title="Entries vs exits — by hour of day">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hours}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="entries" name="Entries" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              <Bar dataKey="exits" name="Exits" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm bg-[#7c3aed]" />
              Entries
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm bg-[#f59e0b]" />
              Exits
            </span>
          </div>
        </div>
      </PanelCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelCard title="Entries by user type">
          <RankedList
            emptyLabel="No entries yet"
            accent="text-pink-700 bg-pink-50"
            items={stats.entriesByPatronCategory.map((r) => ({
              key: r.category,
              label: r.category,
              value: r.count,
            }))}
          />
        </PanelCard>
        {/* Zone occupancy widget removed per product ask — was noisy on
            days with no attendance and duplicated info already present in
            the Entry/Exit reports. */}
      </div>
    </div>
  );
}

function FinesTab({ stats }: { stats: LibraryDashboardStats }) {
  const timeline = stats.finesByDay.map((d) => ({ ...d, label: fmtDay(d.day) }));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Tile hues mirror the chart below: Collected = violet bars,
            Waived = teal bars; Outstanding (no series) wears amber. */}
        <GradientStatCard
          gradient={GRADIENTS.violet}
          icon={IndianRupee}
          label="Collected"
          value={inrShort(stats.finesCollectedThisMonth)}
          hint="in the selected range"
        />
        <GradientStatCard
          gradient={GRADIENTS.amber}
          icon={IndianRupee}
          label="Outstanding"
          value={inrShort(stats.finesOutstanding)}
          hint="unpaid, not waived"
        />
        <GradientStatCard
          gradient={GRADIENTS.cyan}
          icon={IndianRupee}
          label="Waived"
          value={inrShort(stats.finesWaivedThisMonth)}
          hint="this month"
        />
      </div>

      <PanelCard title="Collected vs waived · per day">
        {timeline.length === 0 ? (
          <EmptyPanel label="No fine activity" />
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="collected" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="waived" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Waived" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </PanelCard>

      <PanelCard title="Outstanding by patron (top 10)">
        <RankedList
          emptyLabel="No outstanding fines"
          accent="text-rose-700 bg-rose-50"
          format={(v) => inr(v)}
          items={stats.outstandingByPatron.map((r) => ({
            key: String(r.userId),
            label: r.userName ?? `Patron #${r.userId}`,
            value: r.amount,
          }))}
        />
      </PanelCard>
    </div>
  );
}

// ── Master tabs (Patrons / Items / Branches / Policies) ────────────────────

function EmptyRow({ label, cols }: { label: string; cols: number }) {
  return (
    <FeesTableRow>
      <FeesTableCell colSpan={cols} className="py-8 text-center text-sm text-[#666]">
        {label}
      </FeesTableCell>
    </FeesTableRow>
  );
}

function SkeletonRows({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <FeesTableRow key={r}>
          {Array.from({ length: cols }).map((__, c) => (
            <FeesTableCell key={c}>
              <div className="h-4 w-24 animate-pulse rounded bg-[#eee]" />
            </FeesTableCell>
          ))}
        </FeesTableRow>
      ))}
    </>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

/**
 * One combined pivot table across every item type. First two columns are the
 * axes (Item type · Metric), remaining columns are the patron categories.
 * Groups the six metrics under each item type, so a librarian reads it as a
 * stack of blocks even though it stays a single scrollable table.
 */
function PoliciesTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["library-circulation-policies"],
    queryFn: getCirculationPolicies,
  });

  const { byItem, patrons } = useMemo(() => {
    const items = new Map<string, Map<string, (typeof data)[number]>>();
    const patronSet = new Set<string>();
    for (const p of data) {
      patronSet.add(p.patronCategory);
      const row = items.get(p.itemCategory) ?? new Map();
      row.set(p.patronCategory, p);
      items.set(p.itemCategory, row);
    }
    return {
      byItem: Array.from(items.entries()).sort(([a], [b]) => a.localeCompare(b)),
      patrons: Array.from(patronSet).sort(),
    };
  }, [data]);

  const METRICS: Array<{
    key: "issueDays" | "graceDays" | "finePerDay" | "renewalLimit" | "maxCopiesAtOnce" | "status";
    label: string;
  }> = [
    { key: "issueDays", label: "Issue days" },
    { key: "graceDays", label: "Grace" },
    { key: "finePerDay", label: "Fine / day" },
    { key: "renewalLimit", label: "Renewals" },
    { key: "maxCopiesAtOnce", label: "Max copies" },
    { key: "status", label: "Status" },
  ];

  const cellValue = (
    p: (typeof data)[number] | undefined,
    key: (typeof METRICS)[number]["key"],
  ): React.ReactNode => {
    if (!p) return <span className="text-xs text-[#aaa]">—</span>;
    if (key === "issueDays") {
      return p.loanDays === 0 ? (
        <span className="text-xs text-[#888]">not for loan</span>
      ) : (
        p.loanDays
      );
    }
    if (key === "graceDays") return p.graceDays;
    if (key === "finePerDay") {
      return p.finePerDay > 0 ? (
        <span className="font-medium">{inr(p.finePerDay)}</span>
      ) : (
        <span className="text-xs text-[#888]">—</span>
      );
    }
    if (key === "renewalLimit") return p.renewalLimit;
    if (key === "maxCopiesAtOnce") return p.maxCopiesAtOnce;
    return <StatusPill active={p.isActive} />;
  };

  return (
    <PanelCard title="Circulation policies">
      <FeesTable fixed={false} framed stickyHeader maxHeight="max-h-[640px]">
        <FeesTableHeader>
          <FeesTableHead className="w-[60px] text-center">Sr no</FeesTableHead>
          <FeesTableHead className="w-[160px]">Item type</FeesTableHead>
          <FeesTableHead className="w-[120px]">Patron</FeesTableHead>
          {METRICS.map((m) => (
            <FeesTableHead key={m.key} className="whitespace-nowrap text-right">
              {m.label}
            </FeesTableHead>
          ))}
        </FeesTableHeader>
        <FeesTableBody>
          {isLoading ? (
            <SkeletonRows cols={3 + METRICS.length} />
          ) : byItem.length === 0 ? (
            <EmptyRow label="No circulation policies yet." cols={3 + METRICS.length} />
          ) : (
            // One row per (item type × patron); metric columns to the right.
            // Sr no + Item type merge across the item's patron rows via
            // rowSpan so the block reads as one group.
            byItem.flatMap(([itemType, byPatron], itemIndex) =>
              patrons.map((pc, pi) => (
                <FeesTableRow
                  key={`${itemType}-${pc}`}
                  className={pi === 0 && itemIndex > 0 ? "border-t-2 border-[#8a8a8a]" : ""}
                >
                  {pi === 0 && (
                    <>
                      <TableCell
                        rowSpan={patrons.length}
                        className="border-r border-[#b8b8b8] bg-[#f8f8f8] px-2 py-1.5 text-center align-middle text-sm font-semibold tabular-nums text-[#1a1a1a]"
                      >
                        {itemIndex + 1}
                      </TableCell>
                      <TableCell
                        rowSpan={patrons.length}
                        className="border-r border-[#b8b8b8] bg-[#f8f8f8] px-2 py-1.5 align-middle text-sm font-semibold text-[#1a1a1a]"
                      >
                        {itemType}
                      </TableCell>
                    </>
                  )}
                  <FeesTableCell className="font-medium text-[#333]">{pc}</FeesTableCell>
                  {METRICS.map((m) => (
                    <FeesTableCell key={m.key} className="text-right tabular-nums">
                      {cellValue(byPatron.get(pc), m.key)}
                    </FeesTableCell>
                  ))}
                </FeesTableRow>
              )),
            )
          )}
        </FeesTableBody>
      </FeesTable>
    </PanelCard>
  );
}

// ── Seed banner ─────────────────────────────────────────────────────────────

/**
 * A modal that opens EVERY visit to the library dashboard while any seeded row
 * is still present. Per user's ask: they want the seeded state surfaced up-
 * front, not tucked into a dismissible banner. Numbers below come straight from
 * `readLibrarySeedStatus` so as staff edit or delete rows the count drops
 * accordingly, and once nothing seeded remains the dialog stops opening.
 */
// ── Filters dialog ───────────────────────────────────────────────────────────

function FiltersDialog({
  open,
  onOpenChange,
  value,
  onApply,
  branches,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: DraftFilters;
  onApply: (v: DraftFilters) => void;
  branches: Array<{ id: number; name: string }>;
}) {
  const [draft, setDraft] = useState<DraftFilters>(value);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(value);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Branch</Label>
            <Combobox
              value={draft.branchId ? String(draft.branchId) : ""}
              onChange={(v) => setDraft((d) => ({ ...d, branchId: v ? Number(v) : null }))}
              dataArr={[
                { value: "", label: "All branches" },
                ...branches.map((b) => ({ value: String(b.id), label: b.name })),
              ]}
              placeholder="All branches"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Date range</Label>
            <div className="flex flex-wrap gap-1.5">
              {RANGE_PRESETS.map((r) => (
                <Button
                  key={r.value}
                  type="button"
                  size="sm"
                  variant={draft.preset === r.value ? "default" : "outline"}
                  className={draft.preset === r.value ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                  onClick={() => setDraft((d) => ({ ...d, preset: r.value }))}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          {draft.preset === "custom" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>From</Label>
                <Input
                  type="date"
                  value={draft.dateFrom ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  value={draft.dateTo ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof DASHBOARD_TABS)[number]["value"]>("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<DraftFilters>({
    // Today by default — the dashboard answers "what's happening right now";
    // wider ranges (7d, month, all time) one click away.
    preset: "today",
    branchId: null,
    dateFrom: null,
    dateTo: null,
  });

  const applied = useMemo<LibraryDashboardFilters>(() => {
    const range = resolveRange(draft.preset, draft.dateFrom, draft.dateTo);
    return { branchId: draft.branchId ?? null, ...range };
  }, [draft]);

  const activeFilterCount = (draft.branchId ? 1 : 0) + (draft.preset !== "today" ? 1 : 0);

  const { data: branchList } = useQuery({
    queryKey: ["library-branches", "all"],
    queryFn: async () =>
      (await getLibraryBranches({ page: 1, limit: 200, isActive: true })).payload?.rows ?? [],
  });

  const {
    data: stats,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["library-dashboard-stats", applied],
    queryFn: async () => (await getLibraryDashboardStats(applied)).payload!,
    keepPreviousData: true,
  });

  // Second stats fetch for the Overview trend charts, padded to ≥7 days.
  // When the applied range already spans 7+ days, `widenRangeForCharts`
  // returns the same object, the query keys match and react-query serves
  // the same cache entry — no duplicate request.
  const chartApplied = useMemo(() => widenRangeForCharts(applied), [applied]);
  const { data: chartStats } = useQuery({
    queryKey: ["library-dashboard-stats", chartApplied],
    queryFn: async () => (await getLibraryDashboardStats(chartApplied)).payload!,
    keepPreviousData: true,
  });

  const [loadBanner, setLoadBanner] = useState<null | {
    label: string;
    loaded: number;
    failed: number;
    total: number;
    percent: number;
    layer?: number;
    layerTotal?: number;
    currentLayerLabels?: string[];
    dependsOnLabels?: string[];
    /** Server-provided ISO of when this loader run began — feeds elapsed. */
    startedAt?: string;
    /** Table-count progress from the emit. */
    tablesDone?: number;
    tablesTotal?: number;
    /** Row-count progress from the planning phase + row loop. */
    rowsProcessed?: number;
    rowsTotal?: number;
  }>(null);

  // Elapsed is server-anchored (survives page refreshes). ETA is fitted
  // from a rolling window of (t, rowsProcessed) samples — recent rate, not
  // since-start — so a slow layer only causes ONE upward correction and
  // then stabilises, instead of the ratchet-up-every-emit behaviour that
  // made the old projection appear to keep growing.
  const elapsedMs = useLoaderElapsed(loadBanner?.startedAt);
  const { remainingMs: rateRemainingMs, ratePerSec: rowsPerSec } = useLoaderRateETA(
    loadBanner?.rowsProcessed,
    loadBanner?.rowsTotal,
  );

  const { isConnected, eventCounter } = useLibraryRealtime({
    onLoadProgress: (payload) => {
      const p = payload as typeof payload & {
        label?: string;
        percent?: number;
        layer?: number;
        layerTotal?: number;
        currentLayerLabels?: string[];
        dependsOnLabels?: string[];
        startedAt?: string;
        tablesDone?: number;
        tablesTotal?: number;
        rowsProcessed?: number;
        rowsTotal?: number;
      };
      setLoadBanner({
        label: p.label ?? p.table,
        loaded: payload.loaded,
        failed: payload.failed,
        total: payload.total,
        percent: typeof p.percent === "number" ? p.percent : 0,
        layer: p.layer,
        layerTotal: p.layerTotal,
        currentLayerLabels: p.currentLayerLabels,
        dependsOnLabels: p.dependsOnLabels,
        startedAt: p.startedAt,
        tablesDone: p.tablesDone,
        tablesTotal: p.tablesTotal,
        rowsProcessed: p.rowsProcessed,
        rowsTotal: p.rowsTotal,
      });
    },
  });

  // The socket only carries events forward from the moment it joins the room,
  // so a refresh during a fast layer (~19 tables in ~6s) would leave the
  // banner empty forever. Ask the server what the loader last did — if it
  // says "still running", seed the banner with that snapshot straight away.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getLibraryLoadStatus();
        const s = status?.snapshot;
        if (!cancelled && s?.running) {
          setLoadBanner({
            label: s.label ?? s.table,
            loaded: s.loaded,
            failed: s.failed,
            total: s.total,
            percent: s.percent,
            layer: s.layer,
            layerTotal: s.layerTotal,
            currentLayerLabels: s.currentLayerLabels,
            dependsOnLabels: s.dependsOnLabels,
            startedAt: s.startedAt,
            tablesDone: s.tablesDone,
            tablesTotal: s.tablesTotal,
            rowsProcessed: s.rowsProcessed,
            rowsTotal: s.rowsTotal,
          });
        }
      } catch {
        // Not fatal — the socket will still catch up on the next emit.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    // `min-h-full bg-[#eaeaea]` — same wrapper as the notifications home page.
    // The old min-w-0 wrapper left a hard white bottom on short tabs (Branches
    // with one row, an empty Fines chart, etc.); this grey extends the module
    // background all the way down.
    <div className="min-h-full min-w-0 bg-[#eaeaea]">
      {/* Same header recipe as the notifications and fees dashboards — the
          bordered "page header" card was too heavy and no other dashboard
          uses it. Inline h1 keeps the module family consistent. */}
      <header className="border-b border-[#d1d1d1] bg-gradient-to-r from-[#f5f3ff] via-[#faf5ff] to-white">
        <div className="flex flex-col gap-3 px-4 py-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="flex shrink-0 items-center gap-2 text-xl font-bold text-[#1a1a1a]">
              <LayoutDashboard className="h-5 w-5 text-[#7c3aed]" />
              Library dashboard
            </h1>
            {/* Compact sync pill lives beside the title (was a full-width
                banner row); hover it for the detailed sentence. */}
            <LibrarySyncBanner />
          </div>
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

        {loadBanner && loadBanner.percent < 100 && (
          // Amber / progress-orange — distinct from the purple module accent
          // so it reads as "a running task" rather than another decorated
          // header element.
          <div className="mx-4 mb-2 mt-1 flex flex-col gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-amber-700" />
              <span className="flex-1">
                Importing library data — just finished <strong>{loadBanner.label}</strong>.
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-amber-800">
                {loadBanner.percent}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-300"
                style={{ width: `${loadBanner.percent}%` }}
              />
            </div>
            {/* Elapsed + tables-done counter + calculated ETA.
                ETA math: `remaining = elapsed × (100 − percent) / percent`.
                This is the honest linear projection from the CURRENT rate
                using the server-anchored elapsed; no rolling window, no
                smoothing, no fudged floor. It grows if the loader slows
                (later layers are heavier than layer 1), it shrinks with
                every new emit that advances percent. That growth used to be
                hidden behind a generic "30–60 min" hint — user asked for a
                real number, so this is it. Once percent hits 100 the banner
                clears entirely (the outer `loadBanner.percent < 100` guard
                unmounts this block). */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0 pt-0.5 text-[10.5px] text-amber-800">
              <span className="tabular-nums">
                Elapsed <strong>{formatDurationHuman(elapsedMs)}</strong>
              </span>
              {loadBanner.tablesDone != null && loadBanner.tablesTotal != null ? (
                <>
                  <span className="text-amber-500">·</span>
                  <span className="tabular-nums">
                    <strong>{loadBanner.tablesDone}</strong> of{" "}
                    <strong>{loadBanner.tablesTotal}</strong> tables done
                  </span>
                </>
              ) : null}
              {elapsedMs != null && (
                <>
                  <span className="text-amber-500">·</span>
                  <span className="tabular-nums">
                    {rateRemainingMs == null ? (
                      <>
                        Estimated total <em>estimating…</em>
                      </>
                    ) : rateRemainingMs < 1000 ? (
                      <>
                        Estimated total <em>wrapping up…</em>
                      </>
                    ) : (
                      <>
                        Estimated total{" "}
                        <strong>≈ {formatDurationHuman(elapsedMs + rateRemainingMs)}</strong>{" "}
                        <span className="text-amber-700">
                          ({formatDurationHuman(rateRemainingMs)} remaining
                          {rowsPerSec != null ? ` at ${rowsPerSec.toFixed(1)} rows/s` : ""})
                        </span>
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

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

          {/* `key={eventCounter}` remounts the tab body on every socket
              event, which restarts the CSS animation on any widget carrying
              the `library-live-flash` class. Amber pulse for ~1.2s so the
              operator can see a widget was refreshed by real activity, not
              a manual reload. Context flag prevents flashing on the very
              first render (eventCounter is 0 then). */}
          <LibraryFlashContext.Provider value={eventCounter > 0}>
            <div key={eventCounter} className="p-3 lg:p-4">
              {isLoading && !stats ? (
                // min-h-[70vh] so the loading state fills the viewport rather
                // than leaving a hard white gap above the fold.
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
                    <OverviewTab
                      stats={stats}
                      chartStats={chartStats ?? stats}
                      chartApplied={chartApplied}
                    />
                  </TabsContent>
                  <TabsContent value="circulation" className="mt-0 focus-visible:outline-none">
                    <CirculationTab stats={stats} />
                  </TabsContent>
                  <TabsContent value="holdings" className="mt-0 focus-visible:outline-none">
                    <HoldingsTab stats={stats} />
                  </TabsContent>
                  <TabsContent value="footfall" className="mt-0 focus-visible:outline-none">
                    <FootfallTab stats={stats} />
                  </TabsContent>
                  <TabsContent value="fines" className="mt-0 focus-visible:outline-none">
                    <FinesTab stats={stats} />
                  </TabsContent>
                  <TabsContent value="policies" className="mt-0 focus-visible:outline-none">
                    <PoliciesTab />
                  </TabsContent>
                  <TabsContent value="articles" className="mt-0 focus-visible:outline-none">
                    <CatalogueGroupTab
                      groupKey="articles"
                      title="Article entries"
                      emptyLabel="No article entries yet"
                    />
                  </TabsContent>
                  <TabsContent value="holidays" className="mt-0 focus-visible:outline-none">
                    <HolidaysTab />
                  </TabsContent>
                </>
              )}
              {isFetching && !isLoading && (
                <div className="mt-2 flex items-center justify-end text-[11px] text-slate-400">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> refreshing…
                </div>
              )}
            </div>
          </LibraryFlashContext.Provider>
        </Tabs>
      </header>

      <FiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={draft}
        onApply={setDraft}
        branches={branchList ?? []}
      />

      {/* Floating status pill — red pulse when the socket is connected,
          matches every other dashboard in the console. */}
      <LiveUpdatesBadge connected={isConnected} loading={isFetching && !stats} />
    </div>
  );
}
