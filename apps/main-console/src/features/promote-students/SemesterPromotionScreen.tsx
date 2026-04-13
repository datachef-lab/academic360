import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  Loader2,
  Pause,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Affiliation, ProgramCourse, PromotionBuilderDto, RegulationType } from "@repo/db";
import type { AcademicYear } from "@repo/db/schemas";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPromotionBuilderByTarget } from "@/services/promotion-logic.api";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { getAllClasses } from "@/services/classes.service";
import {
  getAffiliations,
  getProgramCourses,
  getRegulationTypes,
} from "@/services/course-design.api";
import {
  bulkPromoteSemesterStudents,
  getPromotionRoster,
  getPromotionRosterBucketCounts,
  SEMESTER_PROMOTION_SOCKET_OP,
  type PromotionRosterBucket,
  type PromotionRosterRow,
  type PromotionRosterSort,
} from "@/services/promotion-roster.api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import type { ProgressUpdate } from "@/types/progress";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { findSessionsByAcademicYear } from "@/services/session.service";
import axiosInstance from "@/utils/api";
import { cn } from "@/lib/utils";
import type { Class } from "@/types/academics/class";
import type { Session } from "@/types/academics/session";
import type { Shift } from "@/types/academics/shift";

import "./semester-promotion.css";

async function loadShifts(): Promise<Shift[]> {
  const res = await axiosInstance.get<{ payload?: Shift[] } | Shift[]>("/api/v1/shifts");
  const d = res.data as { payload?: Shift[] };
  if (d && typeof d === "object" && "payload" in d && Array.isArray(d.payload)) return d.payload;
  return Array.isArray(res.data) ? res.data : [];
}

function classSeq(c: { sequence?: number | null; id?: number | null }): number {
  return c.sequence ?? c.id ?? 0;
}

/** Session is "active": flagged current, or today's date falls within [from, to]. */
function isSessionActive(s: Session): boolean {
  if (s.isCurrentSession) return true;
  try {
    const from = s.from != null ? new Date(s.from as unknown as string | Date) : null;
    const to = s.to != null ? new Date(s.to as unknown as string | Date) : null;
    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return false;
    }
    const now = new Date();
    return now >= from && now <= to;
  } catch {
    return false;
  }
}

const ROMAN_SEM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

function sequenceToRoman(seq: number | undefined | null): string {
  if (seq == null || seq < 1) return "—";
  if (seq <= ROMAN_SEM.length) return ROMAN_SEM[seq - 1]!;
  return String(seq);
}

function SemesterBox({ seq, size = 24 }: { seq: number | undefined | null; size?: number }) {
  const s = seq ?? 0;
  const odd = s % 2 !== 0;
  const label = sequenceToRoman(s);
  return (
    <div
      className={cn(
        "sp-sem-box border-[1.5px] font-extrabold leading-none",
        odd
          ? "border-[var(--sp-amber-bd)] bg-[var(--sp-amber-bg)] text-[var(--sp-amber)]"
          : "border-[var(--sp-teal-bd)] bg-[var(--sp-teal-bg)] text-[var(--sp-teal)]",
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.33),
      }}
    >
      {label}
    </div>
  );
}

/** Short label for condition row (matches product copy: "Semester I — Form Fill-up"). */
function clauseAccordionTitle(clauseName: string): string {
  const n = clauseName.trim();
  if (/form\s*fill-?up/i.test(n)) {
    return "Form Fill-up";
  }
  return n.replace(/_/g, " ");
}

type SemesterConditionRow = {
  key: string;
  semesterLabel: string;
  clauseTitle: string;
};

function flattenBuilderToSemesterRows(builder: PromotionBuilderDto): SemesterConditionRow[] {
  if (builder.logic !== "CONDITIONAL" || builder.rules.length === 0) return [];
  const out: SemesterConditionRow[] = [];
  for (const rule of builder.rules) {
    const clauseTitle = clauseAccordionTitle(rule.promotionClause.name);
    if (!rule.classes.length) {
      out.push({
        key: `r${rule.id}-src`,
        semesterLabel: "This source semester",
        clauseTitle,
      });
      continue;
    }
    for (const m of [...rule.classes].sort((a, b) => classSeq(a.class) - classSeq(b.class))) {
      out.push({
        key: `${rule.id}-c${m.class.id}`,
        semesterLabel: m.class.name,
        clauseTitle,
      });
    }
  }
  return out;
}

function StatusPill({ bucket }: { bucket: PromotionRosterRow["bucket"] }) {
  const { label, prefix } =
    bucket === "eligible"
      ? { label: "Eligible", prefix: "✓ " }
      : bucket === "ineligible"
        ? { label: "Not eligible", prefix: "✕ " }
        : bucket === "suspended"
          ? { label: "Suspended", prefix: "⏸ " }
          : { label: "Promoted", prefix: "✓ " };
  return (
    <span
      className={cn(
        "sp-pro-badge",
        bucket === "eligible" && "sp-pro-b-eligible",
        bucket === "ineligible" && "sp-pro-b-ineligible",
        bucket === "suspended" && "sp-pro-b-suspended",
        bucket === "promoted" && "sp-pro-b-promoted",
      )}
    >
      {prefix}
      {label}
    </span>
  );
}

function PromotionRowExpand({
  row,
  targetTitle,
  targetClassId,
}: {
  row: PromotionRosterRow;
  targetTitle: string;
  targetClassId: number;
}) {
  const okEligible = row.bucket === "eligible";
  const failIneligible = row.bucket === "ineligible";
  const isSuspended = row.bucket === "suspended";
  const isPromoted = row.bucket === "promoted";

  const [builder, setBuilder] = useState<PromotionBuilderDto | null | undefined>(undefined);
  const affiliationId = row.affiliationId;

  useEffect(() => {
    if (affiliationId == null || affiliationId < 1 || !targetClassId) {
      setBuilder(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const b = await getPromotionBuilderByTarget(affiliationId, targetClassId);
        if (!cancelled) setBuilder(b);
      } catch {
        if (!cancelled) setBuilder(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [affiliationId, targetClassId]);

  const expansionHeaderBadge = okEligible ? (
    <div className="sp-ep-head-badge sp-ep-head-badge--eligible">
      ✓ Eligible — select row to promote
    </div>
  ) : isPromoted ? (
    <div className="sp-ep-head-badge sp-ep-head-badge--promoted">✓ Promoted</div>
  ) : isSuspended ? (
    <div className="sp-ep-head-badge sp-ep-head-badge--ineligible">⏸ Suspended</div>
  ) : (
    <div className="sp-ep-head-badge sp-ep-head-badge--ineligible">✕ Not eligible</div>
  );

  return (
    <div className="sp-expand-panel">
      <div className="min-w-0">
        <div className="sp-ep-head-row mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="sp-ep-section-title min-w-0 flex-1">
            Promotion conditions — {targetTitle}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">{expansionHeaderBadge}</div>
        </div>

        <div className="mb-2 mt-1.5">
          {builder === undefined ? (
            <div className="flex items-center gap-2 text-[11px] text-[var(--sp-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading rules for {row.toClassName}…
            </div>
          ) : builder == null ? (
            <p className="text-[12px] leading-snug text-[var(--sp-ink2)]">
              <span className="font-semibold">No active promotion builder</span> for this
              affiliation and target class.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--sp-muted)]">
                Target: {builder.targetClass.name} ·{" "}
                {(builder.logic ?? "AUTO_PROMOTE").replace(/_/g, " ")}
              </div>
              <div className="sp-ep-sem-rows">
                {builder.logic === "AUTO_PROMOTE" ? (
                  <div className="rounded-md border border-[var(--sp-border)] bg-[var(--sp-surface2)] px-2.5 py-2 text-[12px] leading-snug text-[var(--sp-ink2)]">
                    <span className="font-semibold text-[var(--sp-teal)]">AUTO_PROMOTE</span>
                  </div>
                ) : builder.rules.length === 0 ? (
                  <div className="rounded-md border border-[var(--sp-border)] bg-[var(--sp-surface2)] px-2.5 py-2 text-[12px] text-[var(--sp-muted)]">
                    No per-semester rules on this CONDITIONAL builder.
                  </div>
                ) : (
                  flattenBuilderToSemesterRows(builder).map((sr) => (
                    <div
                      key={sr.key}
                      className={cn(
                        "sp-ep-sem-accord",
                        (failIneligible || isSuspended) && "sp-ep-sem-accord--fail",
                        (okEligible || isPromoted) && "sp-ep-sem-accord--ok",
                      )}
                    >
                      <span className="shrink-0 text-[13px] leading-none" aria-hidden>
                        {failIneligible || isSuspended ? "✕" : "✓"}
                      </span>
                      <span className="sp-ep-sem-accord-icon" aria-hidden>
                        <Pause className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </span>
                      <span className="sp-ep-sem-accord-label min-w-0 text-left">
                        {sr.semesterLabel}
                        <span className="sp-ep-sem-accord-emdash"> — </span>
                        {sr.clauseTitle}
                      </span>
                      {okEligible || isPromoted ? (
                        <span className="sp-ep-sem-accord-pill sp-ep-sem-accord-pill--filled">
                          ✓ Filled
                        </span>
                      ) : failIneligible || isSuspended ? (
                        <span className="sp-ep-sem-accord-pill sp-ep-sem-accord-pill--not-met">
                          ✕ Not met
                        </span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPromotionPagerPages(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 1) return last === 1 ? [1] : [];
  if (last <= 9) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const delta = 2;
  const set = new Set<number>();
  set.add(1);
  set.add(last);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= last) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(sorted[i]!);
  }
  return out;
}

function PromotionRosterPager({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  const last = Math.max(1, totalPages);
  const cur = totalItems === 0 ? 1 : currentPage;
  const pageItems = totalItems === 0 ? [] : getPromotionPagerPages(cur, last);
  const showFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showTo = totalItems === 0 ? 0 : Math.min(endIndex, totalItems);

  return (
    <div className="sp-roster-pager">
      <div className="sp-roster-pager-meta">
        {totalItems === 0 ? (
          "No entries"
        ) : (
          <>
            Showing <strong className="tabular-nums">{showFrom}</strong>–
            <strong className="tabular-nums">{showTo}</strong> of{" "}
            <strong className="tabular-nums">{totalItems.toLocaleString()}</strong>
          </>
        )}
      </div>
      <div className="sp-roster-pager-controls">
        <div className="sp-roster-rows-select">
          <span>Rows</span>
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {[20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
        <div className="sp-roster-pager-pages">
          <button
            type="button"
            className="sp-roster-page-btn gap-1 px-2"
            disabled={cur <= 1 || totalItems === 0}
            onClick={() => onPageChange(Math.max(1, cur - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="hidden sm:inline">Prev</span>
          </button>
          {totalItems === 0 ? (
            <button type="button" className="sp-roster-page-btn sp-active" disabled>
              1
            </button>
          ) : (
            pageItems.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`ellipsis-${i}`} className="sp-roster-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={cn("sp-roster-page-btn tabular-nums", cur === p && "sp-active")}
                  onClick={() => onPageChange(p)}
                  aria-label={`Page ${p}`}
                  aria-current={cur === p ? "page" : undefined}
                >
                  {p}
                </button>
              ),
            )
          )}
          <button
            type="button"
            className="sp-roster-page-btn gap-1 px-2"
            disabled={cur >= last || totalItems === 0}
            onClick={() => onPageChange(Math.min(last, cur + 1))}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

type FilterOption = { value: number; label: string };

function MultiFilterSelect({
  options,
  selected,
  onChange,
  placeholder,
  className,
}: {
  options: FilterOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabels = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return selected.map((id) => map.get(id) ?? String(id));
  }, [options, selected]);

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "sp-pro-select-trigger flex h-auto min-h-[38px] w-full items-center gap-1.5 rounded-md border bg-[var(--sp-surface)] px-3 py-1.5 text-left text-[13px] shadow-sm transition-colors hover:bg-[var(--sp-surface2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sp-navy2)] focus-visible:ring-offset-0",
            "border-[var(--sp-border)]",
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {selected.length === 0 ? (
              <span className="text-[var(--sp-muted)]">{placeholder}</span>
            ) : selected.length <= 2 ? (
              selectedLabels.map((l, i) => (
                <span
                  key={selected[i]}
                  className="inline-flex max-w-[140px] items-center gap-0.5 truncate rounded-md border border-purple-300 bg-purple-50 px-1.5 py-0.5 text-[11px] font-semibold text-purple-800"
                >
                  <span className="truncate">{l}</span>
                  <X
                    className="h-3 w-3 shrink-0 cursor-pointer text-purple-500 hover:text-purple-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(selected[i]!);
                    }}
                  />
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-1.5 py-0.5 text-[11px] font-semibold text-purple-800">
                {selected.length} selected
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-0"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="border-b px-2 py-1.5">
          <input
            ref={inputRef}
            className="w-full bg-transparent text-[13px] placeholder:text-muted-foreground outline-none"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[220px] overflow-auto p-1">
          {filtered.length === 0 && (
            <div className="py-3 text-center text-xs text-muted-foreground">No results</div>
          )}
          {filtered.length > 0 &&
            (() => {
              const allFilteredSelected = filtered.every((o) => selected.includes(o.value));
              return (
                <>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] font-medium hover:bg-accent",
                      allFilteredSelected && "bg-accent/50",
                    )}
                    onClick={() => {
                      if (allFilteredSelected) {
                        const removeSet = new Set(filtered.map((o) => o.value));
                        onChange(selected.filter((v) => !removeSet.has(v)));
                      } else {
                        const merged = new Set([...selected, ...filtered.map((o) => o.value)]);
                        onChange([...merged]);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px]",
                        allFilteredSelected
                          ? "border-purple-700 bg-purple-700 text-white"
                          : "border-gray-400 bg-white",
                      )}
                    >
                      {allFilteredSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </div>
                    <span>Select all</span>
                  </button>
                  <div className="my-1 border-b" />
                </>
              );
            })()}
          {filtered.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] hover:bg-accent",
                  checked && "bg-accent/50 font-medium",
                )}
                onClick={() => toggle(opt.value)}
              >
                <div
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px]",
                    checked
                      ? "border-purple-700 bg-purple-700 text-white"
                      : "border-gray-400 bg-white",
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </div>
                <span className="min-w-0 truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="border-t px-2 py-1.5">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function SemesterPromotionScreen() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);

  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [regulations, setRegulations] = useState<RegulationType[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [affiliationIds, setAffiliationIds] = useState<number[]>([]);
  const [regulationIds, setRegulationIds] = useState<number[]>([]);
  const [programCourseIds, setProgramCourseIds] = useState<number[]>([]);
  const [shiftIds, setShiftIds] = useState<number[]>([]);

  const [fromSessionId, setFromSessionId] = useState("");
  const [toSessionId, setToSessionId] = useState("");
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");

  const [bucket, setBucket] = useState<PromotionRosterBucket>("all");
  const [sortBy, setSortBy] = useState<PromotionRosterSort>("uid");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(() => new Set());

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [roster, setRoster] = useState<Awaited<ReturnType<typeof getPromotionRoster>> | null>(null);
  const [bucketCounts, setBucketCounts] = useState<Awaited<
    ReturnType<typeof getPromotionRosterBucketCounts>
  > | null>(null);
  const [bucketCountsLoading, setBucketCountsLoading] = useState(false);

  const [promoteProgressOpen, setPromoteProgressOpen] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [progressOperation, setProgressOperation] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();

  const handleProgressUpdate = useCallback(
    (data: ProgressUpdate) => {
      if (progressOperation && data?.meta?.operation && data.meta.operation !== progressOperation) {
        return;
      }
      setCurrentProgressUpdate(data);
    },
    [progressOperation],
  );

  useSocket({
    userId,
    onProgressUpdate: handleProgressUpdate,
  });

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    void (async () => {
      setOptionsLoading(true);
      try {
        const [yearsRes, aff, reg, pc, sh, cls] = await Promise.all([
          getAllAcademicYears(),
          getAffiliations(),
          getRegulationTypes(),
          getProgramCourses(),
          loadShifts(),
          getAllClasses(),
        ]);
        const years = yearsRes.payload ?? [];
        setAcademicYears(years);
        const current = years.find((y) => y.isCurrentYear);
        const pick = current?.id ?? years[0]?.id ?? null;
        setAcademicYearId(pick);
        setAffiliations(aff ?? []);
        setRegulations(reg ?? []);
        setProgramCourses(pc ?? []);
        setShifts(sh ?? []);
        setClasses(
          (cls ?? [])
            .filter((c) => c.type === "SEMESTER")
            .sort((a, b) => classSeq(a) - classSeq(b)),
        );
      } catch (e) {
        console.error(e);
        toast.error("Failed to load promotion filters.");
      } finally {
        setOptionsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!academicYearId) {
      setSessions([]);
      return;
    }
    void (async () => {
      try {
        const res = await findSessionsByAcademicYear(academicYearId);
        setSessions(res.payload ?? []);
      } catch {
        toast.error("Failed to load sessions for the selected academic year.");
        setSessions([]);
      }
    })();
  }, [academicYearId]);

  // No auto-selection — user must pick filters manually

  const activeToSessions = useMemo(() => sessions.filter(isSessionActive), [sessions]);

  useEffect(() => {
    if (activeToSessions.length === 0) {
      setToSessionId("");
      return;
    }
    if (!toSessionId) return;
    const ok = activeToSessions.some((s) => s.id != null && String(s.id) === toSessionId);
    if (!ok) setToSessionId("");
  }, [activeToSessions, toSessionId]);

  const semClasses = useMemo(() => classes.filter((c) => c.type === "SEMESTER"), [classes]);

  /** FROM: all semesters. TO: every semester except the selected source (cannot promote to the same class). */
  const fromSemesterOptions = semClasses;
  const toSemesterOptions = useMemo(
    () => (fromClassId ? semClasses.filter((c) => String(c.id) !== fromClassId) : semClasses),
    [semClasses, fromClassId],
  );

  useEffect(() => {
    if (!fromClassId || !toClassId) return;
    if (fromClassId !== toClassId) return;
    const from = semClasses.find((c) => String(c.id) === fromClassId);
    if (!from) return;
    const next = semClasses.find((c) => classSeq(c) === classSeq(from) + 1);
    if (next?.id && String(next.id) !== fromClassId) {
      setToClassId(String(next.id));
      return;
    }
    const other = semClasses.find((c) => String(c.id) !== fromClassId);
    if (other?.id) setToClassId(String(other.id));
  }, [fromClassId, toClassId, semClasses]);

  const fromClassObj = useMemo(
    () => semClasses.find((c) => String(c.id) === fromClassId),
    [semClasses, fromClassId],
  );
  const toClassObj = useMemo(
    () => semClasses.find((c) => String(c.id) === toClassId),
    [semClasses, toClassId],
  );
  const fromSemSeq = fromClassObj ? classSeq(fromClassObj) : 0;
  const toSemSeq = toClassObj ? classSeq(toClassObj) : 0;

  useEffect(() => {
    setExpandedRowKey(null);
    setSelectedStudentIds(new Set());
  }, [page, bucket, fromClassId, toClassId, fromSessionId, toSessionId, debouncedQ]);

  // No auto-selection of fromClassId — user must pick

  // No auto-selection of toClassId — user must pick

  const canQuery =
    academicYearId != null &&
    !!fromSessionId &&
    !!toSessionId &&
    activeToSessions.some((s) => s.id != null && String(s.id) === toSessionId) &&
    !!fromClassId &&
    !!toClassId &&
    Number(fromClassId) !== Number(toClassId);

  const fetchRoster = useCallback(async () => {
    if (!canQuery || !academicYearId) {
      setRoster(null);
      return;
    }
    setRosterLoading(true);
    try {
      const data = await getPromotionRoster({
        academicYearId,
        fromSessionId: Number(fromSessionId),
        toSessionId: Number(toSessionId),
        fromClassId: Number(fromClassId),
        toClassId: Number(toClassId),
        affiliationIds: affiliationIds.length > 0 ? affiliationIds : undefined,
        regulationTypeIds: regulationIds.length > 0 ? regulationIds : undefined,
        programCourseIds: programCourseIds.length > 0 ? programCourseIds : undefined,
        shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
        bucket,
        sortBy,
        sortDir: "asc",
        page,
        pageSize,
        q: debouncedQ || undefined,
      });
      setRoster(data);
    } catch (e) {
      console.error(e);
      toast.error("Could not load promotion roster. Check session/class range and try again.");
      setRoster(null);
    } finally {
      setRosterLoading(false);
    }
  }, [
    academicYearId,
    affiliationIds,
    bucket,
    canQuery,
    debouncedQ,
    fromClassId,
    fromSessionId,
    page,
    pageSize,
    programCourseIds,
    regulationIds,
    shiftIds,
    sortBy,
    toClassId,
    toSessionId,
  ]);

  useEffect(() => {
    void fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    if (!canQuery || !academicYearId) {
      setBucketCounts(null);
      setBucketCountsLoading(false);
      return;
    }
    let cancelled = false;
    setBucketCountsLoading(true);
    void (async () => {
      try {
        const c = await getPromotionRosterBucketCounts({
          academicYearId,
          fromSessionId: Number(fromSessionId),
          fromClassId: Number(fromClassId),
          toSessionId: Number(toSessionId),
          toClassId: Number(toClassId),
          affiliationIds: affiliationIds.length > 0 ? affiliationIds : undefined,
          regulationTypeIds: regulationIds.length > 0 ? regulationIds : undefined,
          programCourseIds: programCourseIds.length > 0 ? programCourseIds : undefined,
          shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
          q: debouncedQ || undefined,
        });
        if (!cancelled) setBucketCounts(c);
      } catch (e) {
        console.error(e);
        if (!cancelled) setBucketCounts(null);
      } finally {
        if (!cancelled) setBucketCountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    academicYearId,
    affiliationIds,
    canQuery,
    debouncedQ,
    fromClassId,
    fromSessionId,
    programCourseIds,
    regulationIds,
    shiftIds,
    toClassId,
    toSessionId,
  ]);

  const handleBulkPromote = useCallback(async () => {
    if (!canQuery || !academicYearId || selectedStudentIds.size === 0) return;
    setPromoteProgressOpen(true);
    setCurrentProgressUpdate(null);
    setProgressOperation(SEMESTER_PROMOTION_SOCKET_OP);
    setPromoting(true);
    try {
      const result = await bulkPromoteSemesterStudents({
        academicYearId,
        fromSessionId: Number(fromSessionId),
        fromClassId: Number(fromClassId),
        toSessionId: Number(toSessionId),
        toClassId: Number(toClassId),
        affiliationIds: affiliationIds.length > 0 ? affiliationIds : undefined,
        regulationTypeIds: regulationIds.length > 0 ? regulationIds : undefined,
        programCourseIds: programCourseIds.length > 0 ? programCourseIds : undefined,
        shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
        studentIds: [...selectedStudentIds],
      });
      const promoteSummary =
        result.updated > 0
          ? `${result.created} new, ${result.updated} updated`
          : `${result.created}`;
      setCurrentProgressUpdate({
        id: `semester_promo_${Date.now()}`,
        userId,
        type: "export_progress",
        message:
          result.skipped.length > 0
            ? `Promoted ${promoteSummary} student(s); ${result.skipped.length} skipped.`
            : `Promoted ${promoteSummary} student(s).`,
        progress: 100,
        status: "completed",
        createdAt: new Date(),
        meta: { operation: SEMESTER_PROMOTION_SOCKET_OP },
      });
      if (result.skipped.length > 0) {
        toast.message(
          `Promoted ${promoteSummary}; ${result.skipped.length} skipped (not eligible or already promoted).`,
        );
      } else {
        toast.success(`Promoted ${promoteSummary} student(s).`);
      }
      setSelectedStudentIds(new Set());
      await fetchRoster();
      try {
        const c = await getPromotionRosterBucketCounts({
          academicYearId,
          fromSessionId: Number(fromSessionId),
          fromClassId: Number(fromClassId),
          toSessionId: Number(toSessionId),
          toClassId: Number(toClassId),
          affiliationIds: affiliationIds.length > 0 ? affiliationIds : undefined,
          regulationTypeIds: regulationIds.length > 0 ? regulationIds : undefined,
          programCourseIds: programCourseIds.length > 0 ? programCourseIds : undefined,
          shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
          q: debouncedQ || undefined,
        });
        setBucketCounts(c);
      } catch (err) {
        console.error(err);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Promotion failed.");
      setCurrentProgressUpdate({
        id: `semester_promo_err_${Date.now()}`,
        userId,
        type: "export_progress",
        message: e instanceof Error ? e.message : "Promotion failed.",
        progress: 100,
        status: "error",
        error: e instanceof Error ? e.message : "Promotion failed.",
        createdAt: new Date(),
        meta: { operation: SEMESTER_PROMOTION_SOCKET_OP },
      });
    } finally {
      setPromoting(false);
      setProgressOperation(null);
    }
  }, [
    academicYearId,
    affiliationIds,
    canQuery,
    debouncedQ,
    fetchRoster,
    fromClassId,
    fromSessionId,
    programCourseIds,
    regulationIds,
    selectedStudentIds,
    shiftIds,
    toClassId,
    toSessionId,
    userId,
  ]);

  const filteredProgramCourses = useMemo(() => {
    return programCourses.filter((pc) => {
      if (affiliationIds.length > 0 && !affiliationIds.includes(pc.affiliationId as number))
        return false;
      if (regulationIds.length > 0 && !regulationIds.includes(pc.regulationTypeId as number))
        return false;
      return true;
    });
  }, [programCourses, affiliationIds, regulationIds]);

  const counts = bucketCounts ??
    roster?.counts ?? {
      all: 0,
      eligible: 0,
      ineligible: 0,
      suspended: 0,
      promoted: 0,
    };

  const startIndex = roster ? (roster.page - 1) * roster.pageSize : 0;
  const endIndex = roster ? startIndex + roster.content.length : 0;

  const eligibleOnPage = useMemo(
    () => roster?.content.filter((r) => r.bucket === "eligible") ?? [],
    [roster],
  );
  const allEligibleChecked =
    eligibleOnPage.length > 0 && eligibleOnPage.every((r) => selectedStudentIds.has(r.studentId));

  const expandPanelTitle = useMemo(() => {
    if (toSemSeq > 0) return `Semester ${sequenceToRoman(toSemSeq)}`;
    return toClassObj?.name ?? "Target class";
  }, [toSemSeq, toClassObj]);

  const exportCsv = () => {
    if (!roster?.content.length) {
      toast.message("No rows to export.");
      return;
    }
    const header =
      "UID,Roll number,Registration no.,Name,Affiliation,Regulation,Program,Shift,From class,To class,Status";
    const lines = roster.content.map(
      (r) =>
        `${r.uid},${r.rollNumber ?? ""},${r.registrationNumber ?? ""},"${r.studentName.replace(/"/g, '""')}","${(r.affiliationName ?? "").replace(/"/g, '""')}","${(r.regulationName ?? "").replace(/"/g, '""')}","${(r.programCourseName ?? "").replace(/"/g, '""')}",${r.shiftName},${r.fromClassName},${r.toClassName},${r.bucket}`,
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promotion_roster.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported current page to CSV");
  };

  const exportTsv = () => {
    if (!roster?.content.length) {
      toast.message("No rows to export.");
      return;
    }
    const header = [
      "UID",
      "Roll",
      "Reg no.",
      "Name",
      "Affiliation",
      "Regulation",
      "Program",
      "Shift",
      "From",
      "To",
      "Status",
    ].join("\t");
    const lines = roster.content.map((r) =>
      [
        r.uid,
        r.rollNumber ?? "",
        r.registrationNumber ?? "",
        r.studentName,
        r.affiliationName ?? "",
        r.regulationName ?? "",
        r.programCourseName ?? "",
        r.shiftName,
        r.fromClassName,
        r.toClassName,
        r.bucket,
      ].join("\t"),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promotion_roster.xls";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported current page");
  };

  const rangeReady = canQuery;
  const selectPro =
    "sp-pro-select-trigger h-auto min-h-[38px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sp-navy2)] focus-visible:ring-offset-0";

  return (
    <div className="sp-scope w-full min-w-0">
      <div className="sp-pro-main">
        <div className="sp-page-header">
          <div className="min-w-0 flex-1">
            <h1 className="sp-page-title">Semester Promotion</h1>
            <p className="sp-page-sub">
              Select filters and promotion range to load the roster. Eligibility follows the
              promotion builder (AUTO_PROMOTE vs CONDITIONAL).
            </p>
          </div>
          <div className="sp-field w-full min-w-[200px] max-w-[280px]">
            <label>Academic year</label>
            <Select
              value={academicYearId != null ? String(academicYearId) : ""}
              onValueChange={(v) => {
                setAcademicYearId(Number(v));
                setFromSessionId("");
                setToSessionId("");
                setPage(1);
              }}
              disabled={optionsLoading || academicYears.length === 0}
            >
              <SelectTrigger
                className={cn(selectPro, "border-[var(--sp-border)] bg-[var(--sp-surface)]")}
              >
                <SelectValue placeholder={optionsLoading ? "Loading…" : "Select year"} />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={String(y.id!)}>
                    {y.year}
                    {y.isCurrentYear ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {optionsLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--sp-border2)] p-8 text-sm text-[var(--sp-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading filters…
          </div>
        ) : !academicYearId ? (
          <div className="sp-placeholder-card">
            <div className="sp-page-sub">
              No academic year found. Create one in academics settings.
            </div>
          </div>
        ) : (
          <>
            <div className="sp-ufc">
              <div className="sp-ufc-section">
                <div className="sp-pro-step1-row">
                  <span className="sp-step-label shrink-0">Step 1</span>
                  <div className="sp-pro-filter">
                    <MultiFilterSelect
                      placeholder="Affiliation"
                      options={affiliations.map((a) => ({ value: a.id as number, label: a.name }))}
                      selected={affiliationIds}
                      onChange={setAffiliationIds}
                    />
                  </div>
                  <div className="sp-pro-filter">
                    <MultiFilterSelect
                      placeholder="Regulation"
                      options={regulations.map((r) => ({ value: r.id as number, label: r.name }))}
                      selected={regulationIds}
                      onChange={setRegulationIds}
                    />
                  </div>
                  <div className="sp-pro-filter">
                    <MultiFilterSelect
                      placeholder="Program course"
                      options={filteredProgramCourses.map((pc) => ({
                        value: pc.id as number,
                        label: pc.name ?? pc.shortName ?? `#${pc.id}`,
                      }))}
                      selected={programCourseIds}
                      onChange={setProgramCourseIds}
                    />
                  </div>
                  <div className="sp-pro-filter">
                    <MultiFilterSelect
                      placeholder="Shift"
                      options={shifts.map((s) => ({ value: s.id as number, label: s.name }))}
                      selected={shiftIds}
                      onChange={setShiftIds}
                    />
                  </div>
                  <div className="sp-pro-filter">
                    <Select
                      value={sortBy}
                      onValueChange={(v) => {
                        setSortBy(v as PromotionRosterSort);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          selectPro,
                          "w-full border-[var(--sp-border)] bg-[var(--sp-surface)]",
                        )}
                      >
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uid">UID</SelectItem>
                        <SelectItem value="rollNumber">Roll number</SelectItem>
                        <SelectItem value="registrationNumber">Registration number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative sp-pro-search">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sp-muted)]" />
                    <Input
                      className="sp-pro-search-input h-[38px] pl-9"
                      placeholder="Search name, UID, roll…"
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="sp-ufc-divider" />

              <div className="sp-ufc-section">
                <div className="mb-3 inline-flex items-center gap-2">
                  <span className="sp-step-label">Step 2</span>
                  <span className="text-[12px] text-[var(--sp-muted)]">Promotion range</span>
                </div>
                <div className="sp-pro-from-to">
                  <div className="sp-pro-ft-card sp-pro-ft-from min-w-0">
                    <div className="sp-ft-pill sp-ft-pill-from w-fit">Promoted from</div>
                    <div className="sp-pro-ft-fields">
                      <div className="sp-field min-w-0">
                        <label>Session</label>
                        <Select value={fromSessionId} onValueChange={setFromSessionId}>
                          <SelectTrigger
                            className={cn(
                              selectPro,
                              "w-full border-[var(--sp-border)] bg-[var(--sp-surface)]",
                            )}
                          >
                            <SelectValue placeholder="Session" />
                          </SelectTrigger>
                          <SelectContent>
                            {sessions.map((s) => (
                              <SelectItem key={s.id} value={String(s.id!)}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sp-field min-w-0">
                        <label>Semester (class)</label>
                        <Select value={fromClassId} onValueChange={setFromClassId}>
                          <SelectTrigger
                            className={cn(
                              selectPro,
                              "w-full border-[var(--sp-border)] bg-[var(--sp-surface)]",
                            )}
                          >
                            <SelectValue placeholder="Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {fromSemesterOptions.map((c) => (
                              <SelectItem key={c.id} value={String(c.id!)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div
                    className="sp-pro-from-to-arrow flex items-center justify-center self-center py-2"
                    aria-hidden
                  >
                    <ArrowRight
                      className="h-[22px] w-[22px] shrink-0 text-[var(--sp-border2)]"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="sp-pro-ft-card sp-pro-ft-to min-w-0">
                    <div className="sp-ft-pill sp-ft-pill-to w-fit">Promoted to</div>
                    <div className="sp-pro-ft-fields">
                      <div className="sp-field min-w-0">
                        <label>Session (active only)</label>
                        <Select
                          value={toSessionId}
                          onValueChange={setToSessionId}
                          disabled={activeToSessions.length === 0}
                        >
                          <SelectTrigger
                            className={cn(
                              selectPro,
                              "w-full border-[var(--sp-navy)] bg-[var(--sp-surface)]",
                            )}
                          >
                            <SelectValue
                              placeholder={
                                activeToSessions.length === 0 ? "No active session" : "Session"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {activeToSessions.map((s) => (
                              <SelectItem key={s.id} value={String(s.id!)}>
                                {s.name}
                                {s.isCurrentSession ? " (current)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sp-field min-w-0">
                        <label>Semester (class)</label>
                        <Select value={toClassId} onValueChange={setToClassId}>
                          <SelectTrigger
                            className={cn(
                              selectPro,
                              "w-full border-[var(--sp-navy)] bg-[var(--sp-surface)]",
                            )}
                          >
                            <SelectValue placeholder="Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {toSemesterOptions.map((c) => (
                              <SelectItem key={c.id} value={String(c.id!)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {rangeReady ? (
              <>
                <div className="sp-datacards">
                  {(
                    [
                      {
                        k: "all" as const,
                        label: "Total",
                        n: counts.all,
                        Icon: Users,
                        cls: "sp-dc-total",
                      },
                      {
                        k: "eligible",
                        label: "Eligible",
                        n: counts.eligible,
                        Icon: CheckCircle2,
                        cls: "sp-dc-eligible",
                      },
                      {
                        k: "ineligible",
                        label: "Not eligible",
                        n: counts.ineligible,
                        Icon: Ban,
                        cls: "sp-dc-ineligible",
                      },
                      {
                        k: "suspended",
                        label: "Suspended",
                        n: counts.suspended,
                        Icon: Pause,
                        cls: "sp-dc-suspended",
                      },
                      {
                        k: "promoted",
                        label: "Promoted",
                        n: counts.promoted,
                        Icon: TrendingUp,
                        cls: "sp-dc-promoted",
                      },
                    ] as const
                  ).map(({ k, label, n, Icon, cls }, i) => (
                    <button
                      key={k}
                      type="button"
                      className={cn("sp-dc text-left", cls, bucket === k && "sp-active")}
                      style={{ animationDelay: `${i * 45}ms` }}
                      onClick={() => {
                        setBucket(k);
                        setPage(1);
                      }}
                    >
                      <div className="sp-dc-icon flex items-center justify-center">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      </div>
                      <div className="sp-dc-count">
                        {bucketCountsLoading ? "…" : n.toLocaleString()}
                      </div>
                      <div className="sp-dc-label">{label}</div>
                      <span className="sp-dc-peek">
                        View list
                        <ChevronRight className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                      </span>
                    </button>
                  ))}
                </div>

                <div className="sp-table-container">
                  <div className="border-b border-[var(--sp-border)] bg-[var(--sp-surface2)] px-3 py-2 text-[11.5px] text-[var(--sp-muted)]">
                    {rosterLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
                      </span>
                    ) : (
                      <span className="tabular-nums">
                        {roster && roster.totalElements > 0
                          ? `${roster.totalElements.toLocaleString()} record${roster.totalElements === 1 ? "" : "s"} in this view`
                          : "—"}
                      </span>
                    )}
                  </div>
                  <div className="relative max-h-[min(520px,60vh)] overflow-auto">
                    <div className="w-full min-w-[1360px]">
                      <div className="sp-t-header sticky top-0 z-10 shadow-sm">
                        <div
                          className="flex items-center !pl-0"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={allEligibleChecked}
                            disabled={rosterLoading || eligibleOnPage.length === 0}
                            className="border-[var(--sp-navy)] data-[state=checked]:bg-[var(--sp-navy)]"
                            onCheckedChange={(c) => {
                              const on = c === true;
                              setSelectedStudentIds((prev) => {
                                const next = new Set(prev);
                                if (on) eligibleOnPage.forEach((row) => next.add(row.studentId));
                                else eligibleOnPage.forEach((row) => next.delete(row.studentId));
                                return next;
                              });
                            }}
                            aria-label="Select all eligible on this page"
                          />
                        </div>
                        <div className="leading-snug">Student / Reg No.</div>
                        <div className="leading-snug">UId / Roll Number</div>
                        <div>Affiliation</div>
                        <div>Regulation</div>
                        <div>Program course</div>
                        <div>Shift</div>
                        <div className="leading-snug">Current → Next</div>
                        <div className="text-[var(--sp-navy)]">Status</div>
                        <div
                          className="flex min-w-[46px] items-center justify-center text-[var(--sp-muted)]"
                          title="Row details"
                          aria-hidden
                        >
                          <ChevronDown className="h-3 w-3 opacity-45" strokeWidth={1.5} />
                        </div>
                      </div>

                      {rosterLoading && (
                        <div className="flex items-center justify-center py-14 text-[var(--sp-muted)]">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                      {!rosterLoading && roster?.content.length === 0 && (
                        <div className="py-14 text-center text-[var(--sp-muted)]">
                          No rows for this view.
                        </div>
                      )}
                      {!rosterLoading &&
                        roster?.content.map((r) => {
                          const rowKey = `${r.studentId}-${r.promotionId}`;
                          const expanded = expandedRowKey === rowKey;
                          return (
                            <div key={rowKey} className="sp-t-row-wrap">
                              <div
                                role="button"
                                tabIndex={0}
                                className={cn("sp-t-row", expanded && "sp-expanded")}
                                onClick={() =>
                                  setExpandedRowKey((k) => (k === rowKey ? null : rowKey))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setExpandedRowKey((k) => (k === rowKey ? null : rowKey));
                                  }
                                }}
                              >
                                <div
                                  className="sp-t-cell flex items-center !pl-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {r.bucket === "eligible" ? (
                                    <Checkbox
                                      checked={selectedStudentIds.has(r.studentId)}
                                      className="border-[var(--sp-navy)] data-[state=checked]:bg-[var(--sp-navy)]"
                                      onCheckedChange={(c) => {
                                        const on = c === true;
                                        setSelectedStudentIds((prev) => {
                                          const next = new Set(prev);
                                          if (on) next.add(r.studentId);
                                          else next.delete(r.studentId);
                                          return next;
                                        });
                                      }}
                                      aria-label={`Select ${r.studentName}`}
                                    />
                                  ) : (
                                    <div
                                      className="h-4 w-4 rounded-sm bg-[var(--sp-border)] opacity-40"
                                      aria-hidden
                                    />
                                  )}
                                </div>
                                <div className="sp-t-cell min-w-0">
                                  <div className="font-sans font-bold leading-tight text-[var(--sp-navy)]">
                                    {r.studentName}
                                  </div>
                                  <div className="mt-0.5 font-mono text-[10.5px] text-[var(--sp-muted)]">
                                    {r.registrationNumber ?? "—"}
                                  </div>
                                </div>
                                <div className="sp-t-cell min-w-0 font-mono text-[11px] text-[var(--sp-ink2)]">
                                  <div className="whitespace-nowrap">{r.uid}</div>
                                  <div className="mt-0.5 whitespace-nowrap text-[11px]">
                                    {r.rollNumber ?? "—"}
                                  </div>
                                </div>
                                <div
                                  className="sp-t-cell min-w-0 truncate text-[13px]"
                                  title={r.affiliationName ?? ""}
                                >
                                  {r.affiliationName ?? "—"}
                                </div>
                                <div
                                  className="sp-t-cell min-w-0 truncate text-[13px]"
                                  title={r.regulationName ?? ""}
                                >
                                  {r.regulationName ?? "—"}
                                </div>
                                <div
                                  className="sp-t-cell min-w-0 truncate"
                                  title={r.programCourseName ?? ""}
                                >
                                  {r.programCourseName ?? "—"}
                                </div>
                                <div className="sp-t-cell">{r.shiftName}</div>
                                <div className="sp-t-cell flex min-w-0 shrink-0 items-center gap-1.5">
                                  <SemesterBox seq={fromSemSeq} size={26} />
                                  <span className="shrink-0 text-[12px] text-[var(--sp-muted)]">
                                    →
                                  </span>
                                  <SemesterBox seq={toSemSeq} size={26} />
                                </div>
                                <div className="sp-t-cell flex min-w-0 flex-wrap items-center gap-2">
                                  <StatusPill bucket={r.bucket} />
                                </div>
                                <div className="sp-t-cell flex justify-center !pr-0">
                                  <ChevronDown
                                    className={cn(
                                      "h-[13px] w-[13px] shrink-0 text-[var(--sp-ink2)] opacity-50 transition-transform duration-200",
                                      expanded && "rotate-180",
                                    )}
                                    strokeWidth={1.4}
                                    aria-hidden
                                  />
                                </div>
                              </div>
                              {expanded ? (
                                <PromotionRowExpand
                                  row={r}
                                  targetTitle={expandPanelTitle}
                                  targetClassId={Number(toClassId)}
                                />
                              ) : null}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  {roster && roster.totalElements > 0 ? (
                    <div className="border-t border-[var(--sp-border)] bg-[var(--sp-surface2)]">
                      <PromotionRosterPager
                        currentPage={roster.page}
                        totalPages={roster.totalPages}
                        totalItems={roster.totalElements}
                        pageSize={roster.pageSize}
                        startIndex={startIndex}
                        endIndex={endIndex}
                        onPageChange={setPage}
                        onPageSizeChange={(n) => {
                          setPageSize(n);
                          setPage(1);
                        }}
                      />
                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--sp-border)] px-4 py-3">
                        <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
                          <Download className="h-4 w-4" />
                          Export CSV
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={exportTsv}>
                          <FileSpreadsheet className="h-4 w-4" />
                          Export XLS
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="sp-placeholder-card">
                <div className="mb-2 text-2xl">📋</div>
                <div className="mb-1 font-sans text-[13.5px] font-bold text-[var(--sp-ink2)]">
                  Select filters &amp; promotion range
                </div>
                <div className="text-xs text-[var(--sp-muted)]">
                  Pick source and target sessions and semesters above to load the roster. Source and
                  target classes must differ.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedStudentIds.size > 0 ? (
        <div className="sp-sel-bar">
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sp-amber-bd)]" />
            <div className="sp-sel-text">
              <span className="text-[var(--sp-amber-bd)]">{selectedStudentIds.size}</span> student
              {selectedStudentIds.size === 1 ? "" : "s"} selected
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="border border-white/20 text-[12px] text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setSelectedStudentIds(new Set())}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={promoting || rosterLoading}
              className="bg-[var(--sp-green)] font-sans text-[12px] font-bold text-white hover:bg-[var(--sp-green-dk)]"
              onClick={() => void handleBulkPromote()}
            >
              {promoting ? "Promoting…" : "Promote selected →"}
            </Button>
          </div>
        </div>
      ) : null}

      <ExportProgressDialog
        isOpen={promoteProgressOpen}
        onClose={() => setPromoteProgressOpen(false)}
        progressUpdate={currentProgressUpdate}
      />
    </div>
  );
}
