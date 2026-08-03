import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { LibraryHolidayRow } from "@/services/library-dashboard.service";

/**
 * Month-grid calendar of library holidays.
 *
 * Layout is Google-Calendar style: a fixed 6×7 grid, weekday header, and
 * multi-day holidays render as spanning bars *inside* the row's 7-column CSS
 * grid overlay. No absolute positioning — CSS grid handles bar geometry via
 * `grid-column: start / end + 1`, which means the bars stay pixel-aligned with
 * their day cells at every viewport width.
 *
 * All data comes from the existing `/library/dashboard/holidays-report`
 * endpoint via the parent; this component is presentational and stateless
 * except for the currently-shown month.
 *
 * Academic-year convention here: **July → June**, matching BESC's session
 * cycle (the AY selector jumps to July of the chosen year).
 */

type Props = {
  holidays: LibraryHolidayRow[];
};

// Six palettes — cycled by holiday.id so the same holiday always gets the same
// colour across months (helpful when a multi-week recess spans month boundaries
// and the user pages between them).
const PALETTES = [
  {
    bar: "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200",
    accent: "bg-amber-500",
  },
  {
    bar: "bg-rose-100 border-rose-300 text-rose-900 hover:bg-rose-200",
    accent: "bg-rose-500",
  },
  {
    bar: "bg-violet-100 border-violet-300 text-violet-900 hover:bg-violet-200",
    accent: "bg-violet-500",
  },
  {
    bar: "bg-teal-100 border-teal-300 text-teal-900 hover:bg-teal-200",
    accent: "bg-teal-500",
  },
  {
    bar: "bg-cyan-100 border-cyan-300 text-cyan-900 hover:bg-cyan-200",
    accent: "bg-cyan-500",
  },
  {
    bar: "bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200",
    accent: "bg-emerald-500",
  },
] as const;

/** Modulo always lands in range, but strict indexed access can't prove it. */
function getPalette(idx: number): (typeof PALETTES)[number] {
  return PALETTES[Math.abs(idx) % PALETTES.length] ?? PALETTES[0];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
// How many lane rows fit inside a cell before overflow collapses to "+N more".
const MAX_LANES_PER_CELL = 4;

// ── Date helpers ────────────────────────────────────────────────────────────
// `holiday.from` / `holiday.to` arrive from Postgres as `YYYY-MM-DD` strings.
// We parse them into UTC-noon dates so DST + timezone maths never nudge a
// holiday off by a day (a plain `new Date("2026-10-17")` is UTC-midnight,
// which in negative-offset zones renders as the day before).

function parseYMD(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** UTC-noon Date for a Y/M/D triple — matches parseYMD's convention. */
function utcNoon(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, 12));
}

function addDaysUTC(d: Date, delta: number): Date {
  const nd = new Date(d.getTime());
  nd.setUTCDate(nd.getUTCDate() + delta);
  return nd;
}

/** Inclusive day count between two UTC-noon dates. Min 1. */
function dayDiffInclusive(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

function ymdKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function fmtDMY(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * BESC's academic year runs July → June, so months Jul–Dec belong to AY
 * `YY/YY+1` and Jan–Jun belong to `YY-1/YY`. Returned as the year-start
 * calendar year (2026 → the 2026-27 AY).
 */
function academicYearStart(d: Date): number {
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
}

// ── Grid + lane assignment ──────────────────────────────────────────────────

type ParsedHoliday = LibraryHolidayRow & {
  fromDate: Date;
  toDate: Date;
  days: number;
  paletteIdx: number;
};

type Bar = {
  holiday: ParsedHoliday;
  laneIdx: number;
  /** 1-based CSS grid column (1..7). */
  startCol: number;
  /** 1-based CSS grid column (1..7). Inclusive. */
  endCol: number;
  continuesLeft: boolean;
  continuesRight: boolean;
};

type WeekRow = {
  /** Seven UTC-noon Dates for this row, Sun→Sat. */
  days: Date[];
  bars: Bar[];
  /** For each day in this row, holidays that touch that day (for the
   *  overflow "+N more" popover). */
  perDay: Array<ParsedHoliday[]>;
};

function parseHolidays(rows: LibraryHolidayRow[]): ParsedHoliday[] {
  return (
    rows
      .map((r) => {
        const fromDate = parseYMD(r.from);
        const toDate = parseYMD(r.to);
        return {
          ...r,
          fromDate,
          toDate,
          days: dayDiffInclusive(fromDate, toDate),
          paletteIdx: Math.abs(r.id) % PALETTES.length,
        } satisfies ParsedHoliday;
      })
      // Guard against reversed ranges in the source data.
      .filter((h) => h.toDate.getTime() >= h.fromDate.getTime())
  );
}

function buildMonthGrid(year: number, monthIdx: number, holidays: ParsedHoliday[]): WeekRow[] {
  // First cell = Sunday on/before the 1st of the month.
  const first = utcNoon(year, monthIdx, 1);
  const firstDow = first.getUTCDay(); // 0 = Sunday
  const gridStart = addDaysUTC(first, -firstDow);

  const weeks: WeekRow[] = [];
  for (let w = 0; w < 6; w++) {
    const weekStart = addDaysUTC(gridStart, w * 7);
    const weekEnd = addDaysUTC(weekStart, 6);
    const days: Date[] = [];
    const perDay: ParsedHoliday[][] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDaysUTC(weekStart, d);
      days.push(day);
      perDay.push([]);
    }

    // Holidays overlapping this week — sorted long-first so multi-week
    // recesses claim the top lanes and short chips stack under them.
    const overlapping = holidays
      .filter(
        (h) =>
          h.fromDate.getTime() <= weekEnd.getTime() && h.toDate.getTime() >= weekStart.getTime(),
      )
      .sort((a, b) => {
        if (a.fromDate.getTime() !== b.fromDate.getTime()) {
          return a.fromDate.getTime() - b.fromDate.getTime();
        }
        return b.days - a.days;
      });

    // Populate perDay lookup for "+N more" popovers regardless of lane
    // capacity — the popover must show every holiday, not just the visible
    // ones.
    for (const h of overlapping) {
      for (let d = 0; d < 7; d++) {
        const day = days[d];
        if (!day) continue; // loop is bounded, but strict indexed access can't see it
        if (day.getTime() >= h.fromDate.getTime() && day.getTime() <= h.toDate.getTime()) {
          perDay[d]?.push(h);
        }
      }
    }

    // Greedy lane assignment. Each lane is an array of `endCol` values —
    // a holiday takes the lowest lane index whose latest occupied column is
    // to the left of the new bar's `startCol`.
    const lanes: number[] = []; // lane index → last-occupied end column
    const bars: Bar[] = [];
    for (const h of overlapping) {
      const startColIdx = Math.max(
        0,
        Math.floor((h.fromDate.getTime() - weekStart.getTime()) / 86_400_000),
      );
      const endColIdx = Math.min(
        6,
        Math.floor((h.toDate.getTime() - weekStart.getTime()) / 86_400_000),
      );

      let lane = lanes.findIndex((occupiedEnd) => occupiedEnd < startColIdx);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(endColIdx);
      } else {
        lanes[lane] = endColIdx;
      }

      bars.push({
        holiday: h,
        laneIdx: lane,
        // CSS grid columns are 1-based.
        startCol: startColIdx + 1,
        endCol: endColIdx + 1,
        continuesLeft: h.fromDate.getTime() < weekStart.getTime(),
        continuesRight: h.toDate.getTime() > weekEnd.getTime(),
      });
    }

    weeks.push({ days, bars, perDay });
  }
  return weeks;
}

// ── Component ───────────────────────────────────────────────────────────────

export function HolidayMonthCalendar({ holidays }: Props) {
  const parsed = useMemo(() => parseHolidays(holidays), [holidays]);

  // Range of academic years that actually have holidays on file — powers the
  // AY selector and clamps navigation.
  const ayRange = useMemo(() => {
    if (parsed.length === 0) {
      const now = new Date();
      const ay = academicYearStart(
        utcNoon(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      return { min: ay, max: ay };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const h of parsed) {
      const a = academicYearStart(h.fromDate);
      const b = academicYearStart(h.toDate);
      if (a < min) min = a;
      if (b > max) max = b;
    }
    return { min, max };
  }, [parsed]);

  // Initial month: current calendar month if it falls inside the data range,
  // else the AY-start month (July) of the current AY.
  const initialMonth = useMemo(() => {
    const today = new Date();
    const todayUtc = utcNoon(today.getFullYear(), today.getMonth(), today.getDate());
    const currentAY = academicYearStart(todayUtc);
    if (currentAY >= ayRange.min && currentAY <= ayRange.max) {
      return { year: todayUtc.getUTCFullYear(), month: todayUtc.getUTCMonth() };
    }
    // Fall back to July of the nearest AY with data.
    const ay = Math.min(Math.max(currentAY, ayRange.min), ayRange.max);
    return { year: ay, month: 6 };
  }, [ayRange]);

  const [cursor, setCursor] = useState(initialMonth);
  // Recentre if the parent later feeds in holidays that shift the AY window.
  useEffect(() => {
    setCursor(initialMonth);
  }, [initialMonth]);

  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month, parsed), [cursor, parsed]);

  const goPrev = useCallback(
    () =>
      setCursor(({ year, month }) => {
        if (month === 0) return { year: year - 1, month: 11 };
        return { year, month: month - 1 };
      }),
    [],
  );
  const goNext = useCallback(
    () =>
      setCursor(({ year, month }) => {
        if (month === 11) return { year: year + 1, month: 0 };
        return { year, month: month + 1 };
      }),
    [],
  );
  const goToday = useCallback(() => {
    const t = new Date();
    setCursor({ year: t.getFullYear(), month: t.getMonth() });
  }, []);

  // Keyboard navigation: ← / → to page months when the calendar is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea somewhere on the page.
      const t = e.target as HTMLElement | null;
      if (t && ("value" in t || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // AY selector — every AY in the data range, plus one on each side so the
  // user can look ahead / behind.
  const ayOptions = useMemo(() => {
    const out: number[] = [];
    for (let y = ayRange.min - 1; y <= ayRange.max + 1; y++) out.push(y);
    return out;
  }, [ayRange]);
  const currentAY = academicYearStart(utcNoon(cursor.year, cursor.month, 1));

  const todayKey = ymdKey(
    utcNoon(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header — navigation + academic-year jump */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goPrev}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[10.5rem] text-center text-sm font-semibold text-slate-800">
            {MONTH_NAMES[cursor.month]} {cursor.year}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goNext}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="ml-1 h-8" onClick={goToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Academic year</span>
          <Select
            value={String(currentAY)}
            onValueChange={(v) => {
              const ay = Number(v);
              // Jump to July of the picked AY — the AY start month.
              setCursor({ year: ay, month: 6 });
            }}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="AY" />
            </SelectTrigger>
            <SelectContent>
              {ayOptions.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">
                  {y}–{String(y + 1).slice(-2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 overflow-hidden rounded-t-md border-x border-t border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn("py-2 text-center", i === 0 || i === 6 ? "text-rose-500" : "")}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Grid of weeks */}
      <div className="-mt-3 overflow-hidden rounded-b-md border border-slate-200 bg-white">
        {weeks.map((week, wIdx) => (
          <WeekRowView
            key={wIdx}
            week={week}
            cursorMonth={cursor.month}
            todayKey={todayKey}
            isLastRow={wIdx === weeks.length - 1}
          />
        ))}
      </div>

      {/* Legend — kept minimal because each bar carries its name inline. */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" />
          Single-day holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded-sm border border-violet-300 bg-violet-100" />
          Multi-day recess
        </span>
        <span className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-400" />
          Hover a bar for details. Use ← / → to page months.
        </span>
      </div>
    </div>
  );
}

// ── Week row + cell + bar renderers ─────────────────────────────────────────

function WeekRowView({
  week,
  cursorMonth,
  todayKey,
  isLastRow,
}: {
  week: WeekRow;
  cursorMonth: number;
  todayKey: string;
  isLastRow: boolean;
}) {
  // Bars can overflow the lane budget — collapse the extras into a "+N more"
  // chip per day rather than dropping them silently.
  const visibleBars = week.bars.filter((b) => b.laneIdx < MAX_LANES_PER_CELL);
  const laneCount = Math.min(
    MAX_LANES_PER_CELL,
    week.bars.reduce((max, b) => Math.max(max, b.laneIdx + 1), 0),
  );

  // Per-day overflow: how many holidays touch this day but are on a lane
  // beyond the visible budget.
  const overflowPerDay = week.days.map((_, i) => {
    const inCell = week.perDay[i] ?? [];
    // Count holidays whose lane is beyond MAX_LANES_PER_CELL for this row.
    return inCell.filter((h) => {
      const bar = week.bars.find((b) => b.holiday.id === h.id);
      return bar && bar.laneIdx >= MAX_LANES_PER_CELL;
    }).length;
  });

  const cellMinHeight = 56 + laneCount * 22 + 4; // header strip + N lanes

  return (
    <div
      className={cn("relative grid grid-cols-7", !isLastRow && "border-b border-slate-200")}
      style={{ minHeight: `${cellMinHeight}px` }}
    >
      {/* Day cells (numbers + backdrop). */}
      {week.days.map((day, dIdx) => {
        const isCurrentMonth = day.getUTCMonth() === cursorMonth;
        const isToday = ymdKey(day) === todayKey;
        const isWeekend = dIdx === 0 || dIdx === 6;
        const overflow = overflowPerDay[dIdx] ?? 0;
        return (
          <div
            key={dIdx}
            className={cn(
              "relative border-r border-slate-200 p-1.5 last:border-r-0",
              !isCurrentMonth && "bg-slate-50/60 text-slate-400",
              isCurrentMonth && isWeekend && "bg-rose-50/30",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between text-[11px] font-semibold",
                !isCurrentMonth && "text-slate-400",
                isCurrentMonth && "text-slate-700",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 tabular-nums",
                  isToday && "bg-violet-600 text-white",
                )}
              >
                {day.getUTCDate()}
              </span>
              {overflow > 0 && (
                <DayOverflowPopover day={day} holidays={week.perDay[dIdx] ?? []} count={overflow} />
              )}
            </div>
          </div>
        );
      })}

      {/* Bar overlay — same 7-column grid as the cells, positioned below
          the numbers. Uses padding-top to clear the day-number strip. */}
      <div
        className="pointer-events-none absolute inset-x-0 grid grid-cols-7 gap-y-1 px-1"
        style={{ top: "26px" }}
      >
        {visibleBars.map((bar, i) => (
          <div
            key={`${bar.holiday.id}-${i}`}
            className="pointer-events-auto"
            style={{
              gridColumn: `${bar.startCol} / ${bar.endCol + 1}`,
              gridRow: bar.laneIdx + 1,
            }}
          >
            <HolidayBar bar={bar} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HolidayBar({ bar }: { bar: Bar }) {
  const palette = getPalette(bar.holiday.paletteIdx);
  const isMultiDay = bar.holiday.days > 1;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${bar.holiday.name}, ${fmtDMY(bar.holiday.fromDate)} to ${fmtDMY(bar.holiday.toDate)}`}
          className={cn(
            "flex h-5 w-full items-center gap-1 overflow-hidden border px-1.5 text-[10.5px] font-medium leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-violet-300",
            palette.bar,
            // Rounded caps only on the true start/end; continuation edges are
            // square so a spanning bar reads as one continuous block across
            // week rows.
            bar.continuesLeft ? "rounded-l-none" : "rounded-l-md",
            bar.continuesRight ? "rounded-r-none" : "rounded-r-md",
            isMultiDay && "font-semibold",
          )}
        >
          {/* Accent dot for a single-day holiday — helps them stand out
              against multi-day bars in the same row. */}
          {!isMultiDay && !bar.continuesLeft && (
            <span className={cn("h-2 w-2 shrink-0 rounded-full", palette.accent)} />
          )}
          <span className="truncate">
            {bar.continuesLeft && "… "}
            {bar.holiday.shortName?.trim() || bar.holiday.name}
            {bar.continuesRight && " …"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3 text-xs">
        <HolidayDetails holiday={bar.holiday} />
      </PopoverContent>
    </Popover>
  );
}

function DayOverflowPopover({
  day,
  holidays,
  count,
}: {
  day: Date;
  holidays: ParsedHoliday[];
  count: number;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 hover:bg-slate-300"
        >
          +{count} more
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 text-xs">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Holidays on {fmtDMY(day)}
        </div>
        <div className="max-h-72 divide-y divide-slate-100 overflow-auto">
          {holidays.map((h) => (
            <div key={h.id} className="px-3 py-2">
              <HolidayDetails holiday={h} compact />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HolidayDetails({ holiday, compact }: { holiday: ParsedHoliday; compact?: boolean }) {
  const palette = getPalette(holiday.paletteIdx);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 h-3 w-3 shrink-0 rounded-full", palette.accent)} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-900">{holiday.name}</div>
          {holiday.shortName?.trim() && (
            <div className="text-[11px] text-slate-500">{holiday.shortName}</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-[11px]">
        <div>
          <div className="text-slate-500">From</div>
          <div className="font-semibold tabular-nums text-slate-800">
            {fmtDMY(holiday.fromDate)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">To</div>
          <div className="font-semibold tabular-nums text-slate-800">{fmtDMY(holiday.toDate)}</div>
        </div>
        <div>
          <div className="text-slate-500">Days</div>
          <div className="font-semibold tabular-nums text-slate-800">{holiday.days}</div>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>Applies to classes</span>
          <span className="font-semibold tabular-nums text-slate-800">
            {holiday.applicableClassCount}
          </span>
        </div>
      )}
      {holiday.remarks?.trim() && (
        <div className="rounded-md bg-slate-50 px-2 py-1.5 text-[11px] italic text-slate-600">
          {holiday.remarks}
        </div>
      )}
    </div>
  );
}
