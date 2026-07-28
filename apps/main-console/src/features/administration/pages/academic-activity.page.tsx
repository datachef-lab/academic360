import * as React from "react";
import { Pencil, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import axiosInstance from "@/utils/api";
import { findAllClasses } from "@/services/class.service";
import {
  getAffiliations,
  getCourseLevels,
  getRegulationTypes,
  getStreams,
} from "@/services/course-design.api";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { getPromotionStatuses } from "@/services/promotion-status.api";

const SL = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;

const DEFAULT_AUDIENCE: Audience = "STUDENT";

/** Every date shown/entered on this page is India Standard Time (fixed +05:30, no DST). */
const IST_TZ = "Asia/Kolkata";
const IST_OFFSET = "+05:30";
const ALL_LEVELS = "ALL";

type ActivityType = "FINANCE" | "EXAMINATION" | "ADMISSION" | "ACADEMIC";
type Audience = "ALL" | "STUDENT" | "STAFF";

type ScopeDto = {
  id?: number;
  /** The API returns nested `stream`/`class` objects, not raw ids — see AcademicActivityScopeDto. */
  streamId?: number;
  classId?: number;
  startDate: string | null;
  endDate: string | null;
  isEnabled: boolean;
  stream?: { id: number; name: string; code?: string };
  class?: { id: number; name: string; sequence?: number | null };
};

type ActivityMasterDto = {
  id: number;
  type: ActivityType;
  name: string;
  description: string | null;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AcademicActivityApiDto = {
  id: number;
  audience: Audience;
  master: ActivityMasterDto;
  academicYear: { id: number; year: string };
  affiliation: { id: number; name: string; shortName?: string | null };
  regulationType: { id: number; name: string; shortName?: string | null };
  courseLevelId?: number | null;
  courseLevel?: { id: number; name: string; shortName?: string | null } | null;
  appearType: { id: number; name: string };
  scopes: ScopeDto[];
};

type ApiResponse<T> = { payload: T };

type ClassOption = {
  id: number;
  name: string;
  type?: string | null;
  sequence?: number | null;
  isActive?: boolean | null;
};
type StreamOption = { id: number; name: string; code?: string; sequence?: number | null };
type AcademicYearOption = { id: number; year: string; isCurrentYear?: boolean };
type AffiliationOption = { id: number; name: string; shortName?: string | null };
type RegulationOption = { id: number; name: string; shortName?: string | null };
type CourseLevelOption = { id: number; name: string; shortName?: string | null };
type PromotionStatusOption = { id: number; name: string };

/** Local (IST wall-clock) working copy of a scope, as bound to the dialog inputs. */
type ScopeDraft = {
  streamId: number;
  classId: number;
  startDate: string;
  endDate: string;
  isEnabled: boolean;
};

/** What the API accepts for a scope inside a create/replace payload. */
type ScopePayload = {
  streamId: number;
  classId: number;
  startDate: string | null;
  endDate: string | null;
  isEnabled: boolean;
};

type ScopeDialogState = {
  /** `add` = append a scope (creating the rule first if none matches the filters). */
  mode: "add" | "edit";
  ruleId: number | null;
  scopeId: number | null;
  /** "Now" as an IST `datetime-local`, captured when the dialog opened. */
  nowLocal: string;
  /**
   * The scope's persisted start as an IST `datetime-local` ("" in add mode).
   * Used to grandfather a start that is already in the past so existing rows
   * stay editable.
   */
  persistedStartLocal: string;
  draft: ScopeDraft;
};

type RuleFilters = {
  academicYearId: number | null;
  affiliationId: number | null;
  regulationTypeId: number | null;
  courseLevelId: number | null;
  appearTypeId: number | null;
};

type ProxyStudent = {
  uid: string;
  name: string;
  sem: number;
  dept: string;
  deptId: number;
  affId: number;
  photo: string;
};

/* ─── Date helpers — READ and WRITE are both anchored to IST ─── */

/** UTC ISO → `YYYY-MM-DDTHH:mm` rendered as IST wall-clock (for `<input type="datetime-local">`). */
function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Inverse of `toDateTimeLocal`: `YYYY-MM-DDTHH:mm` interpreted as IST → UTC ISO.
 * Deliberately does NOT use `new Date(local)`, which would parse in the browser's
 * timezone and disagree with what the field displayed.
 */
function fromDateTimeLocal(local: string): string | null {
  if (!local) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00${IST_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function localToMs(local: string): number | null {
  const iso = fromDateTimeLocal(local);
  return iso ? new Date(iso).getTime() : null;
}

/** "Now" as an IST `datetime-local` — the `min` boundary for the date inputs. */
function nowDateTimeLocal(): string {
  return toDateTimeLocal(new Date().toISOString());
}

function isoToMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** The single IST rendering path for display — `dd/mm/yyyy, hh:mm AM/PM`. */
function formatIst(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace(/\b(a|p)\.?m\.?\b/gi, (m) => m.replace(/\./g, "").toUpperCase());
}

/**
 * Display-only: "SEMESTER II" → "II". Falls back to the untouched name for any
 * class that doesn't follow that pattern — `semesterRows` unions in whatever
 * class a scope actually references, which need not be a SEMESTER-type class.
 * Never used for matching or persisted anywhere.
 */
function semesterLabel(name: string | null | undefined): string {
  if (!name) return "";
  const stripped = name.replace(/^\s*semesters?\b[\s._:-]*/i, "").trim();
  return stripped || name;
}

/* ─── Status helpers ─── */

type StatusChip = { label: string; cls: string };

function statusOf(isEnabled: boolean, startMs: number | null, endMs: number | null): StatusChip {
  if (!isEnabled) return { label: "Off", cls: "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]" };
  if (startMs == null && endMs == null)
    return { label: "No Dates", cls: "border-[#F0D888] bg-[#FDF4DC] text-[#A07010]" };
  const now = Date.now();
  const start = startMs ?? 0;
  const end = endMs ?? Number.POSITIVE_INFINITY;
  if (now < start)
    return { label: "Scheduled", cls: "border-[#9EC8F0] bg-[#EBF3FC] text-[#1A6BB5]" };
  if (now > end) return { label: "Closed", cls: "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]" };
  return { label: "Live", cls: "border-[#A0D8B8] bg-[#E8F5EE] text-[#1A7A4A]" };
}

/** Status of a draft being edited (dates are IST wall-clock strings). */
function scopeStatus(scope: ScopeDraft): StatusChip {
  return statusOf(scope.isEnabled, localToMs(scope.startDate), localToMs(scope.endDate));
}

/** Status of a persisted scope (dates are UTC ISO strings from the API). */
function scopeStatusFromDto(scope: ScopeDto): StatusChip {
  return statusOf(scope.isEnabled, isoToMs(scope.startDate), isoToMs(scope.endDate));
}

function activityStatus(act: AcademicActivityApiDto): {
  label: string;
  color: string;
  bg: string;
  bd: string;
  live?: boolean;
} {
  if (!act.master.isActive)
    return {
      label: "Disabled",
      color: "text-[#9AA0AE]",
      bg: "bg-[#F7F6F3]",
      bd: "border-[#E0DDD6]",
    };
  if (!act.scopes.length)
    return {
      label: "No Scopes",
      color: "text-[#A07010]",
      bg: "bg-[#FDF4DC]",
      bd: "border-[#F0D888]",
    };
  const enabledScopes = act.scopes.filter((s) => s.isEnabled);
  if (!enabledScopes.length)
    return {
      label: "All Off",
      color: "text-[#9AA0AE]",
      bg: "bg-[#F7F6F3]",
      bd: "border-[#E0DDD6]",
    };
  const now = Date.now();
  const live = enabledScopes.filter((s) => {
    const start = isoToMs(s.startDate) ?? 0;
    const end = isoToMs(s.endDate) ?? Number.POSITIVE_INFINITY;
    return now >= start && now <= end;
  });
  if (live.length > 0)
    return {
      label: `${live.length} Live`,
      color: "text-[#1A7A4A]",
      bg: "bg-[#E8F5EE]",
      bd: "border-[#A0D8B8]",
      live: true,
    };
  const scheduled = enabledScopes.filter((s) => now < (isoToMs(s.startDate) ?? 0));
  if (scheduled.length > 0)
    return {
      label: "Scheduled",
      color: "text-[#1A6BB5]",
      bg: "bg-[#EBF3FC]",
      bd: "border-[#9EC8F0]",
    };
  return { label: "Closed", color: "text-[#9AA0AE]", bg: "bg-[#F7F6F3]", bd: "border-[#E0DDD6]" };
}

function typeIcon(type: ActivityType): string {
  switch (type) {
    case "FINANCE":
      return "\u{1F4B3}";
    case "EXAMINATION":
      return "\u{1F4CB}";
    case "ADMISSION":
      return "\u{270D}\u{FE0F}";
    case "ACADEMIC":
      return "\u{1F4DA}";
    default:
      return "\u{1F4CC}";
  }
}

function scopeStreamId(s: ScopeDto): number {
  return s.streamId ?? s.stream?.id ?? 0;
}

function scopeClassId(s: ScopeDto): number {
  return s.classId ?? s.class?.id ?? 0;
}

/**
 * Serialise a persisted scope back into a replace-payload entry.
 * Dates are passed through as the server's own ISO strings — untouched siblings
 * therefore never round-trip through a local-time parse.
 */
function scopeToPayload(s: ScopeDto): ScopePayload {
  return {
    streamId: scopeStreamId(s),
    classId: scopeClassId(s),
    startDate: s.startDate ?? null,
    endDate: s.endDate ?? null,
    isEnabled: s.isEnabled,
  };
}

function draftToPayload(d: ScopeDraft): ScopePayload {
  return {
    streamId: d.streamId,
    classId: d.classId,
    startDate: fromDateTimeLocal(d.startDate),
    endDate: fromDateTimeLocal(d.endDate),
    isEnabled: d.isEnabled,
  };
}

function ruleCourseLevelId(a: AcademicActivityApiDto): number | null {
  return a.courseLevel?.id ?? a.courseLevelId ?? null;
}

export default function AcademicActivityPage() {
  const [masters, setMasters] = React.useState<ActivityMasterDto[]>([]);
  const [activities, setActivities] = React.useState<AcademicActivityApiDto[]>([]);
  const [classOptions, setClassOptions] = React.useState<ClassOption[]>([]);
  const [streams, setStreams] = React.useState<StreamOption[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYearOption[]>([]);
  const [affiliations, setAffiliations] = React.useState<AffiliationOption[]>([]);
  const [regulations, setRegulations] = React.useState<RegulationOption[]>([]);
  const [courseLevels, setCourseLevels] = React.useState<CourseLevelOption[]>([]);
  const [promotionStatuses, setPromotionStatuses] = React.useState<PromotionStatusOption[]>([]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [activeMasterId, setActiveMasterId] = React.useState<number | null>(null);
  const [filters, setFilters] = React.useState<RuleFilters>({
    academicYearId: null,
    affiliationId: null,
    regulationTypeId: null,
    courseLevelId: null,
    appearTypeId: null,
  });

  const [scopeDialog, setScopeDialog] = React.useState<ScopeDialogState | null>(null);
  /** Inline validation message for the scope dialog; keeps the dialog open. */
  const [scopeError, setScopeError] = React.useState<string | null>(null);

  const [proxyUID, setProxyUID] = React.useState("");
  const [proxyStudent, setProxyStudent] = React.useState<ProxyStudent | null>(null);
  const [proxyResolved, setProxyResolved] = React.useState(false);

  /**
   * Semesters, filtered the way the rest of the app does it (`type === "SEMESTER"`
   * and active) and ordered by sequence. `sequence` is null across the live class
   * catalogue, so name is the effective tiebreaker — and "SEMESTER I".."SEMESTER
   * VIII" happen to sort correctly lexicographically.
   */
  const activeClassOptions = React.useMemo(
    () =>
      classOptions
        .filter((c) => c.isActive !== false && c.type === "SEMESTER")
        .sort((a, b) => {
          const sa = a.sequence ?? Number.MAX_SAFE_INTEGER;
          const sb = b.sequence ?? Number.MAX_SAFE_INTEGER;
          if (sa !== sb) return sa - sb;
          return (a.name || "").localeCompare(b.name || "");
        }),
    [classOptions],
  );

  /** All streams become matrix columns — not just the ones that have scopes. */
  const streamColumns = React.useMemo(
    () =>
      [...streams].sort((a, b) => {
        const sa = a.sequence ?? Number.MAX_SAFE_INTEGER;
        const sb = b.sequence ?? Number.MAX_SAFE_INTEGER;
        if (sa !== sb) return sa - sb;
        return (a.name || "").localeCompare(b.name || "");
      }),
    [streams],
  );

  const loadData = React.useCallback(async () => {
    const [classesRes, streamsRes, ayRes, affRes, regRes, clRes, psRes, mastersRes, activitiesRes] =
      await Promise.all([
        findAllClasses(),
        getStreams(),
        getAllAcademicYears(),
        getAffiliations(),
        getRegulationTypes(),
        getCourseLevels(),
        getPromotionStatuses({ isActive: true }),
        axiosInstance.get<ApiResponse<ActivityMasterDto[]>>(
          "/api/academics/academic-activity-masters",
        ),
        axiosInstance.get<ApiResponse<AcademicActivityApiDto[]>>(
          "/api/academics/academic-activities",
        ),
      ]);

    setClassOptions(
      (classesRes?.payload ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        sequence: c.sequence,
        isActive: c.isActive,
      })),
    );
    setStreams(
      (streamsRes ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        sequence: s.sequence,
      })),
    );
    setAcademicYears(
      (ayRes?.payload ?? []).map((a: any) => ({
        id: a.id,
        year: a.year,
        isCurrentYear: a.isCurrentYear,
      })),
    );
    setAffiliations(
      (affRes ?? [])
        .filter((a: any) => a?.isActive !== false)
        .map((a: any) => ({ id: a.id, name: a.name, shortName: a.shortName })),
    );
    setRegulations(
      (regRes ?? [])
        .filter((r: any) => r?.isActive !== false)
        .map((r: any) => ({ id: r.id, name: r.name, shortName: r.shortName })),
    );
    setCourseLevels(
      (clRes ?? [])
        .filter((c: any) => c?.isActive !== false)
        .map((c: any) => ({ id: c.id, name: c.name, shortName: c.shortName })),
    );
    setPromotionStatuses((psRes ?? []).map((p: any) => ({ id: p.id, name: p.name })));
    setMasters(mastersRes.data?.payload ?? []);
    setActivities(activitiesRes.data?.payload ?? []);
  }, []);

  React.useEffect(() => {
    loadData().catch((err) => {
      console.error("Failed to load academic activities:", err);
      toast.error("Failed to load academic activities");
    });
  }, [loadData]);

  // First master becomes the default tab.
  React.useEffect(() => {
    if (activeMasterId == null && masters[0]) setActiveMasterId(masters[0].id);
  }, [masters, activeMasterId]);

  // When the tab changes, seed the filter bar from that master's first existing
  // rule so the table lands on real configuration instead of an empty combo.
  const seededFor = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (activeMasterId == null) return;
    if (seededFor.current === activeMasterId) return;
    if (!academicYears.length || !affiliations.length || !regulations.length) return;
    seededFor.current = activeMasterId;

    const firstRule = activities.find((a) => a.master.id === activeMasterId);
    if (firstRule) {
      setFilters({
        academicYearId: firstRule.academicYear.id,
        affiliationId: firstRule.affiliation.id,
        regulationTypeId: firstRule.regulationType.id,
        courseLevelId: ruleCourseLevelId(firstRule),
        appearTypeId: firstRule.appearType.id,
      });
      return;
    }
    const currentAy = academicYears.find((a) => a.isCurrentYear) ?? academicYears[0];
    setFilters({
      academicYearId: currentAy?.id ?? null,
      affiliationId: affiliations[0]?.id ?? null,
      regulationTypeId: regulations[0]?.id ?? null,
      courseLevelId: null,
      appearTypeId: promotionStatuses[0]?.id ?? null,
    });
  }, [activeMasterId, activities, academicYears, affiliations, regulations, promotionStatuses]);

  const activeMaster = React.useMemo(
    () => masters.find((m) => m.id === activeMasterId) ?? null,
    [masters, activeMasterId],
  );

  const filtersComplete =
    filters.academicYearId != null &&
    filters.affiliationId != null &&
    filters.regulationTypeId != null &&
    filters.appearTypeId != null;

  /**
   * All rules of the active master matching the exact filter combination.
   * NOTE: the schema does not enforce uniqueness on these five dimensions, and
   * live data does contain duplicates — so this is a list, not a single rule.
   */
  const matchingRules = React.useMemo(() => {
    if (activeMasterId == null || !filtersComplete) return [];
    return activities.filter(
      (a) =>
        a.master.id === activeMasterId &&
        a.academicYear.id === filters.academicYearId &&
        a.affiliation.id === filters.affiliationId &&
        a.regulationType.id === filters.regulationTypeId &&
        ruleCourseLevelId(a) === filters.courseLevelId &&
        a.appearType.id === filters.appearTypeId,
    );
  }, [activities, activeMasterId, filters, filtersComplete]);

  /** `class.sequence` is null across the live catalogue, so name is the real tiebreaker. */
  const classOrder = React.useCallback(
    (classId: number, fallbackName?: string | null) => {
      const c = classOptions.find((x) => x.id === classId);
      return {
        seq: c?.sequence ?? Number.MAX_SAFE_INTEGER,
        name: c?.name ?? fallbackName ?? "",
      };
    },
    [classOptions],
  );

  const scopeRows = React.useMemo(() => {
    const rows = matchingRules.flatMap((rule) =>
      rule.scopes.map((scope) => ({ ruleId: rule.id, scope })),
    );
    return rows.sort((a, b) => {
      const ca = classOrder(scopeClassId(a.scope), a.scope.class?.name);
      const cb = classOrder(scopeClassId(b.scope), b.scope.class?.name);
      if (ca.seq !== cb.seq) return ca.seq - cb.seq;
      if (ca.name !== cb.name) return ca.name.localeCompare(cb.name);
      return (a.scope.stream?.name ?? "").localeCompare(b.scope.stream?.name ?? "");
    });
  }, [matchingRules, classOrder]);

  /** The rule whose scopes a cell edits, and which `Add scope` appends to. */
  const primaryRuleId = matchingRules[0]?.id ?? null;

  /**
   * stream+semester → the scope shown in that cell. `matchingRules` is a list and
   * the live DB really does contain rules that are identical on all five
   * dimensions, so two scopes can land on the same cell. Nothing is dropped: the
   * cell renders the scope belonging to `primaryRuleId` (the same rule Add
   * targets, so click-to-edit is predictable) and reports `total` so the UI can
   * flag the collision.
   */
  type MatrixCell = { ruleId: number; scope: ScopeDto; total: number };
  const cellMap = React.useMemo(() => {
    const grouped = new Map<string, { ruleId: number; scope: ScopeDto }[]>();
    for (const row of scopeRows) {
      const key = `${scopeClassId(row.scope)}:${scopeStreamId(row.scope)}`;
      const list = grouped.get(key);
      if (list) list.push(row);
      else grouped.set(key, [row]);
    }
    const out = new Map<string, MatrixCell>();
    for (const [key, list] of grouped) {
      const primary = list.find((r) => r.ruleId === primaryRuleId) ?? list[0]!;
      out.set(key, { ruleId: primary.ruleId, scope: primary.scope, total: list.length });
    }
    return out;
  }, [scopeRows, primaryRuleId]);

  /**
   * Matrix rows. Every semester gets a row even with nothing configured — the
   * empty row is the whole point of the grid. Any class actually referenced by a
   * scope is unioned in, so a scope pointing at a non-SEMESTER class can never
   * become invisible.
   */
  const semesterRows = React.useMemo(() => {
    const byId = new Map<number, ClassOption>();
    for (const c of activeClassOptions) byId.set(c.id, c);
    for (const row of scopeRows) {
      const id = scopeClassId(row.scope);
      if (id && !byId.has(id)) {
        byId.set(id, {
          id,
          name: row.scope.class?.name ?? `Class #${id}`,
          sequence: row.scope.class?.sequence ?? null,
        });
      }
    }
    return [...byId.values()].sort((a, b) => {
      const sa = a.sequence ?? Number.MAX_SAFE_INTEGER;
      const sb = b.sequence ?? Number.MAX_SAFE_INTEGER;
      if (sa !== sb) return sa - sb;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [activeClassOptions, scopeRows]);

  /**
   * Only ever called from an empty grid cell, which supplies the stream and
   * semester — hence both are required and shown disabled in the dialog. Every
   * stream × semester pair is reachable as a cell, so the grid covers the whole
   * space a free-form "Add scope" button used to.
   */
  const openAddScope = (cell: { streamId: number; classId: number }) => {
    if (!filtersComplete) {
      toast.error("Pick an academic year, affiliation, regulation and appear type first");
      return;
    }
    setScopeError(null);
    setScopeDialog({
      mode: "add",
      ruleId: primaryRuleId,
      scopeId: null,
      nowLocal: nowDateTimeLocal(),
      // No persisted value in add mode — `min` is simply now, no exception.
      persistedStartLocal: "",
      draft: {
        streamId: cell.streamId,
        classId: cell.classId,
        startDate: "",
        endDate: "",
        isEnabled: true,
      },
    });
  };

  const openEditScope = (ruleId: number, scope: ScopeDto) => {
    const savedStart = toDateTimeLocal(scope.startDate);
    setScopeError(null);
    setScopeDialog({
      mode: "edit",
      ruleId,
      scopeId: scope.id ?? null,
      nowLocal: nowDateTimeLocal(),
      persistedStartLocal: savedStart,
      draft: {
        streamId: scopeStreamId(scope),
        classId: scopeClassId(scope),
        startDate: savedStart,
        endDate: toDateTimeLocal(scope.endDate),
        isEnabled: scope.isEnabled,
      },
    });
  };

  /** Authoritative sibling list, re-read immediately before we replace it. */
  const fetchRule = async (ruleId: number): Promise<AcademicActivityApiDto | null> => {
    const res = await axiosInstance.get<ApiResponse<AcademicActivityApiDto>>(
      `/api/academics/academic-activities/${ruleId}`,
    );
    return res.data?.payload ?? null;
  };

  const saveScope = async () => {
    if (!scopeDialog || activeMasterId == null || !filtersComplete) return;
    const { mode, ruleId, scopeId, draft, persistedStartLocal } = scopeDialog;
    if (!draft.streamId || !draft.classId) {
      setScopeError("Stream and semester are required.");
      return;
    }

    // Belt and braces: `min` on the inputs is trivially bypassable and some
    // browsers don't enforce it for typed input, so re-check both rules here.
    const startMs = localToMs(draft.startDate);
    const endMs = localToMs(draft.endDate);
    if (startMs != null && endMs != null && endMs <= startMs) {
      setScopeError("End date must be after the start date.");
      return;
    }
    // A start that was already in the past when the dialog opened is grandfathered:
    // only reject it if the admin actually changed it to a new past value.
    const startChanged = draft.startDate !== persistedStartLocal;
    if (startMs != null && startChanged && startMs < Date.now()) {
      setScopeError("Start date can't be in the past — pick a future date and time.");
      return;
    }
    setScopeError(null);

    setIsSaving(true);
    try {
      const payload = draftToPayload(draft);

      if (mode === "add" && ruleId == null) {
        // No rule exists for this exact combination yet — create it, carrying the
        // new scope in the same request.
        await axiosInstance.post("/api/academics/academic-activities", {
          academicActivityMasterId: activeMasterId,
          academicYearId: filters.academicYearId,
          affiliationId: filters.affiliationId,
          regulationTypeId: filters.regulationTypeId,
          courseLevelId: filters.courseLevelId,
          appearTypeId: filters.appearTypeId,
          audience: DEFAULT_AUDIENCE,
          scopes: [payload],
        });
        toast.success("Rule created with its first scope");
      } else {
        if (ruleId == null) throw new Error("Missing rule reference");
        // PUT { scopes } deletes and re-inserts EVERY scope of the rule, so the
        // request must carry the rule's complete, freshly-read scope list.
        const rule = await fetchRule(ruleId);
        if (!rule) {
          toast.error("That rule no longer exists — reloading");
          await loadData();
          return;
        }
        const siblings = rule.scopes;
        let nextScopes: ScopePayload[];
        if (mode === "add") {
          nextScopes = [...siblings.map(scopeToPayload), payload];
        } else {
          if (scopeId == null || !siblings.some((s) => s.id === scopeId)) {
            toast.error("That scope no longer exists — reloading");
            await loadData();
            return;
          }
          nextScopes = siblings.map((s) => (s.id === scopeId ? payload : scopeToPayload(s)));
        }
        await axiosInstance.put(`/api/academics/academic-activities/${ruleId}`, {
          scopes: nextScopes,
        });
        toast.success(mode === "add" ? "Scope added" : "Scope updated");
      }

      await loadData();
      setScopeDialog(null);
    } catch (err) {
      console.error("Failed to save scope:", err);
      toast.error("Failed to save the scope");
    } finally {
      setIsSaving(false);
    }
  };

  const loadStudent = async (uid: string) => {
    const t = uid.trim();
    setProxyUID(t);
    setProxyResolved(true);
    if (!t) {
      setProxyStudent(null);
      return;
    }
    try {
      const res = await axiosInstance.get<ApiResponse<any>>(
        `/api/students/uid/${encodeURIComponent(t)}`,
      );
      const p = res.data?.payload;
      if (!p?.uid) {
        setProxyStudent(null);
        return;
      }
      setProxyStudent({
        uid: String(p.uid),
        name: p?.personalDetails?.firstName || p?.name || "Student",
        sem: Number(p?.currentSemester || 1),
        dept: p?.programCourse?.name || p?.programCourse?.shortName || "Program",
        deptId: p?.programCourse?.id ?? 0,
        affId: p?.programCourse?.affiliationId ?? 0,
        photo: (p?.personalDetails?.firstName || p?.name || "S").slice(0, 2).toUpperCase(),
      });
    } catch {
      setProxyStudent(null);
    }
  };

  const patchDraft = (patch: Partial<ScopeDraft>) => {
    setScopeError(null);
    setScopeDialog((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));
  };

  /**
   * `min` boundaries for the two datetime-local inputs, in IST.
   * A saved start already in the past is grandfathered: `min` drops back to that
   * value so the row stays editable (its end date can be changed without being
   * forced to move the start).
   */
  const persistedStartIsPast = !!(
    scopeDialog?.persistedStartLocal &&
    (localToMs(scopeDialog.persistedStartLocal) ?? 0) < (localToMs(scopeDialog.nowLocal) ?? 0)
  );
  const startMin = scopeDialog
    ? persistedStartIsPast
      ? scopeDialog.persistedStartLocal
      : scopeDialog.nowLocal
    : "";
  // End must sit after the start as it is being edited; falls back to now.
  const endMin = scopeDialog ? scopeDialog.draft.startDate || scopeDialog.nowLocal : "";

  const filterSelectClass =
    "h-9 w-full rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white text-[12.5px] font-semibold";
  /** Same control, visibly inert — used for the rule context in the scope dialog. */
  const disabledSelectClass =
    "h-8 w-full rounded-[7px] border-[1.5px] border-[#E0DDD6] bg-[#F7F6F3] text-[11.5px] font-semibold text-[#5A6478] disabled:cursor-default disabled:opacity-100";

  return (
    <div className="min-h-full w-full min-w-0 max-w-none overflow-x-hidden bg-[#F0EEE9] px-4 py-6 font-['DM_Sans',system-ui,sans-serif] md:px-6 lg:px-8">
      <div className="w-full min-w-0">
        <div className="mb-6 min-w-0">
          <h1 className="font-['Sora',sans-serif] text-[22px] font-extrabold tracking-tight text-[#1B2B4B]">
            Academic Activity Control
          </h1>
        </div>

        <Tabs defaultValue="windows" className="w-full min-w-0">
          <TabsList className="h-auto w-full justify-start gap-0.5 rounded-none border-0 border-b-2 border-[#D0CCC3] bg-transparent p-0">
            <TabsTrigger
              value="windows"
              className="rounded-t-lg rounded-b-none border-b-2 border-transparent px-5 py-2 font-['Sora',sans-serif] text-[13px] data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-[#1B2B4B] data-[state=inactive]:text-[#9AA0AE]"
            >
              Activity Windows
            </TabsTrigger>
            <TabsTrigger
              value="proxy"
              className="rounded-t-lg rounded-b-none border-b-2 border-transparent px-5 py-2 font-['Sora',sans-serif] text-[13px] data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-[#1B2B4B] data-[state=inactive]:text-[#9AA0AE]"
            >
              Staff Proxy Portal
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="windows"
            className="mt-0 w-full min-w-0 overflow-hidden rounded-b-[14px] rounded-tr-[14px] border border-t-0 border-[#D0CCC3] bg-white p-4 shadow-sm sm:p-5"
          >
            {masters.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-[#9AA0AE]">
                No activities are defined yet.
              </div>
            ) : (
              <>
                {/* Activity + the five rule dimensions, applied directly on change. */}
                <div className="mb-3 flex flex-wrap items-end gap-2.5 border-b border-[#E0DDD6] pb-3">
                  <div className="min-w-[190px] flex-[1.4]">
                    <Label className="mb-1 block text-[11px] font-semibold text-[#5A6478]">
                      Activity
                    </Label>
                    <Select
                      value={activeMasterId != null ? String(activeMasterId) : ""}
                      onValueChange={(v) => setActiveMasterId(Number(v))}
                    >
                      <SelectTrigger className={filterSelectClass}>
                        <SelectValue placeholder="Select activity" />
                      </SelectTrigger>
                      <SelectContent>
                        {masters.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {typeIcon(m.type)} {m.name}
                            {/* Replaces the Off chip the tabs used to carry. */}
                            {m.isActive ? "" : " (Off)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[125px] flex-1">
                    <Label className="mb-1 block text-[11px] font-semibold text-[#5A6478]">
                      Academic year
                    </Label>
                    <Select
                      value={filters.academicYearId != null ? String(filters.academicYearId) : ""}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, academicYearId: Number(v) }))
                      }
                    >
                      <SelectTrigger className={filterSelectClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            <span className="flex items-center gap-2">
                              {a.year}
                              {/* Same green as the sidebar's year switcher, so
                                  "current" reads identically in both places. */}
                              {a.isCurrentYear === true && (
                                <Badge
                                  variant="outline"
                                  className="border-green-300 bg-green-100 px-1.5 py-0.5 text-[10px] leading-none text-green-800"
                                >
                                  Current
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[125px] flex-1">
                    <Label className="mb-1 block text-[11px] font-semibold text-[#5A6478]">
                      Affiliation
                    </Label>
                    <Select
                      value={filters.affiliationId != null ? String(filters.affiliationId) : ""}
                      onValueChange={(v) => setFilters((f) => ({ ...f, affiliationId: Number(v) }))}
                    >
                      <SelectTrigger className={filterSelectClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {affiliations.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.shortName || a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[125px] flex-1">
                    <Label className="mb-1 block text-[11px] font-semibold text-[#5A6478]">
                      Regulation
                    </Label>
                    <Select
                      value={
                        filters.regulationTypeId != null ? String(filters.regulationTypeId) : ""
                      }
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, regulationTypeId: Number(v) }))
                      }
                    >
                      <SelectTrigger className={filterSelectClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {regulations.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.shortName || r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[125px] flex-1">
                    <Label className="mb-1 block text-[11px] font-semibold text-[#5A6478]">
                      Course level
                    </Label>
                    <Select
                      value={
                        filters.courseLevelId != null ? String(filters.courseLevelId) : ALL_LEVELS
                      }
                      onValueChange={(v) =>
                        setFilters((f) => ({
                          ...f,
                          courseLevelId: v === ALL_LEVELS ? null : Number(v),
                        }))
                      }
                    >
                      <SelectTrigger className={filterSelectClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_LEVELS}>All levels</SelectItem>
                        {courseLevels.map((cl) => (
                          <SelectItem key={cl.id} value={String(cl.id)}>
                            {cl.shortName || cl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[125px] flex-1">
                    <Label className="mb-1 block text-[11px] font-semibold text-[#5A6478]">
                      Appear type
                    </Label>
                    <Select
                      value={filters.appearTypeId != null ? String(filters.appearTypeId) : ""}
                      onValueChange={(v) => setFilters((f) => ({ ...f, appearTypeId: Number(v) }))}
                    >
                      <SelectTrigger className={filterSelectClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {promotionStatuses.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mb-3 text-[11.5px] text-[#5A6478]">
                  {!filtersComplete ? (
                    "Choose every dimension above to identify a rule."
                  ) : matchingRules.length === 0 ? (
                    <span className="text-[#A07010]">
                      No rule exists for this combination yet &mdash;{" "}
                      <strong className="font-semibold">Add scope</strong> will create the rule
                      first, then add the scope to it.
                    </span>
                  ) : (
                    <>
                      {matchingRules.length} rule{matchingRules.length > 1 ? "s" : ""} matched
                      &middot; {scopeRows.length} scope{scopeRows.length === 1 ? "" : "s"}{" "}
                      configured on {matchingRules.length > 1 ? "them" : "it"}. New scopes are added
                      to rule #{matchingRules[0]?.id}.
                    </>
                  )}
                </div>
                {/* Empty-state notices. The matrix itself always renders — a
                        blank grid is the signal — so these explain WHY it is blank
                        instead of replacing it. */}
                {filtersComplete && scopeRows.length === 0 ? (
                  <div className="mb-2 rounded-md border border-slate-200 bg-[#F7F6F3] px-4 py-3 text-[13px] text-[#5A6478]">
                    Nothing is configured for this combination yet.
                    <br />
                    <span className="text-[12px] text-[#9AA0AE]">
                      Click any cell below, or use <strong>Add scope</strong>, to set a stream +
                      semester window
                      {matchingRules.length === 0 ? " (the rule will be created too)" : ""}.
                    </span>
                  </div>
                ) : null}

                {/* Stream matrix — a row per semester, a column per stream, so
                        missing configuration shows up as a visible gap. */}
                <Table
                  className="w-full border-separate border-spacing-0"
                  style={{ minWidth: 190 + streamColumns.length * 195 }}
                  containerClassName="w-full max-h-[min(60vh,calc(100vh-22rem))] overflow-auto rounded-md border border-slate-200 shadow-sm"
                >
                  <TableHeader className="sticky top-0 z-20 bg-slate-100 shadow-[inset_0_-1px_0_0_rgb(226_232_240)]">
                    <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                      <TableHead className="w-[70px] border border-slate-200 bg-slate-100 text-xs sm:text-sm">
                        Sr No
                      </TableHead>
                      <TableHead className="w-[110px] border border-slate-200 bg-slate-100 text-center text-xs sm:text-sm">
                        Semester
                      </TableHead>
                      {streamColumns.map((s) => (
                        <TableHead
                          key={s.id}
                          className="border border-slate-200 bg-slate-100 text-xs sm:text-sm"
                        >
                          {s.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semesterRows.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={2 + streamColumns.length}
                          className="border border-slate-200 px-4 py-10 text-center text-[13px] text-[#9AA0AE]"
                        >
                          No semesters found in the class catalogue.
                        </TableCell>
                      </TableRow>
                    ) : (
                      semesterRows.map((sem, index) => (
                        <TableRow key={sem.id} className=" hover:bg-transparent">
                          <TableCell className="border text-center border-slate-200 px-2 py-3 text-xs font-medium sm:px-4 sm:text-sm">
                            {index + 1}.
                          </TableCell>
                          <TableCell
                            title={sem.name}
                            className="border border-slate-200 px-2 py-3 text-center text-xs font-semibold text-slate-800 sm:px-4 sm:text-sm"
                          >
                            {semesterLabel(sem.name)}
                          </TableCell>
                          {streamColumns.map((stream) => {
                            const cell = cellMap.get(`${sem.id}:${stream.id}`);
                            return (
                              <MatrixCell
                                key={stream.id}
                                cell={cell}
                                streamName={stream.name}
                                semesterName={sem.name}
                                onActivate={() =>
                                  cell
                                    ? openEditScope(cell.ruleId, cell.scope)
                                    : openAddScope({ streamId: stream.id, classId: sem.id })
                                }
                              />
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <p className="mt-2 text-[11px] text-[#9AA0AE]">
                  All dates are shown and entered in IST (Asia/Kolkata).
                </p>
              </>
            )}
          </TabsContent>

          <TabsContent
            value="proxy"
            className="mt-0 w-full min-w-0 overflow-hidden rounded-b-[14px] rounded-tr-[14px] border border-t-0 border-[#D0CCC3] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-3.5 rounded-xl border-[1.5px] border-[#D0CCC3] bg-white p-4 shadow-sm">
              <div className="mb-2 font-['Sora',sans-serif] text-[10.5px] font-bold uppercase tracking-wider text-[#9AA0AE]">
                Staff Proxy — Enter Student UID
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    className="h-10 rounded-lg border-[#D0CCC3] bg-[#F7F6F3] pl-9 pr-3 text-[13px]"
                    placeholder="e.g. CU-SC-2022-001"
                    value={proxyUID}
                    onChange={(e) => setProxyUID(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadStudent(proxyUID);
                    }}
                  />
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA0AE]" />
                </div>
                <Button
                  type="button"
                  className="h-10 rounded-lg bg-[#1B2B4B] font-['Sora',sans-serif] font-bold hover:bg-[#2C3E63]"
                  onClick={() => loadStudent(proxyUID)}
                >
                  Load &rarr;
                </Button>
              </div>
              {proxyResolved && !proxyStudent ? (
                <p className="mt-2 text-xs text-[#C23B3B]">
                  &lsaquo; No student found with UID &quot;{proxyUID}&quot;.
                </p>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-xl border-[1.5px] border-[#D0CCC3] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E0DDD6] bg-[#F7F6F3] px-4 py-3">
                <div className="font-['Sora',sans-serif] text-[13px] font-bold text-[#1B2B4B]">
                  Student Activity Portal
                </div>
                {proxyStudent ? (
                  <div className="flex items-center gap-2">
                    <Badge className="border border-[#F0C97A] bg-[#FEF6E8] text-[11px] text-[#C8820A]">
                      {proxyStudent.name}
                    </Badge>
                    <Badge className="border border-[#9EC8F0] bg-[#EBF3FC] text-[11px] text-[#1A6BB5]">
                      {proxyStudent.dept} &middot; Sem {SL[proxyStudent.sem - 1]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-[#9AA0AE]"
                      onClick={() => {
                        setProxyStudent(null);
                        setProxyUID("");
                        setProxyResolved(false);
                      }}
                    >
                      Clear &times;
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className={proxyStudent ? "p-4" : ""}>
                {!proxyStudent ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mb-3 text-3xl">{"\u{1F50D}"}</div>
                    <div className="font-['Sora',sans-serif] text-sm font-bold text-[#1B2B4B]">
                      No student loaded
                    </div>
                    <p className="mt-1.5 text-xs text-[#9AA0AE]">
                      Enter a student UID to preview their activity portal.
                    </p>
                  </div>
                ) : (
                  <ProxyActivityGrid
                    activities={activities}
                    classOptions={activeClassOptions}
                    student={proxyStudent}
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Scope editor */}
      <Dialog
        open={!!scopeDialog}
        onOpenChange={(o) => {
          if (!o) {
            setScopeDialog(null);
            setScopeError(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-[900px] overflow-y-auto rounded-[14px] border-[#E0DDD6] p-0 font-['DM_Sans',system-ui,sans-serif] shadow-[0_2px_8px_rgba(27,43,75,.09),0_8px_32px_rgba(27,43,75,.09)] [&>button]:hidden">
          {scopeDialog ? (
            <>
              <div className="flex items-start justify-between border-b border-[#E0DDD6] px-5 pb-3 pt-4">
                <div>
                  <DialogTitle className="font-['Sora',sans-serif] text-left text-[15px] font-extrabold text-[#1B2B4B]">
                    {activeMaster?.name ?? "Activity"} &middot;{" "}
                    {scopeDialog.mode === "add" ? "Add scope" : "Edit scope"}
                  </DialogTitle>
                  {/* Kept: this is the only signal that saving will also create a rule. */}
                  {scopeDialog.mode === "add" && scopeDialog.ruleId == null ? (
                    <p className="mt-1 text-[11px] text-[#9AA0AE]">
                      No rule matches the selected combination &mdash; it will be created with this
                      scope.
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0 border-[#E0DDD6] text-[#9AA0AE]"
                  onClick={() => setScopeDialog(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex flex-col gap-3 px-5 py-4">
                {/* The rule this scope hangs off — shown as real controls, disabled,
                    because they are fixed by the page selection, not editable here. */}
                <div>
                  <div className="mb-1.5 font-['Sora',sans-serif] text-[11px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                    Applies to
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="min-w-[110px] flex-1">
                      <Label className="mb-1 block text-[12.5px] font-semibold text-[#9AA0AE]">
                        Academic year
                      </Label>
                      <Select
                        disabled
                        value={filters.academicYearId != null ? String(filters.academicYearId) : ""}
                      >
                        <SelectTrigger className={disabledSelectClass}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[110px] flex-1">
                      <Label className="mb-1 block text-[12.5px] font-semibold text-[#9AA0AE]">
                        Affiliation
                      </Label>
                      <Select
                        disabled
                        value={filters.affiliationId != null ? String(filters.affiliationId) : ""}
                      >
                        <SelectTrigger className={disabledSelectClass}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {affiliations.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.shortName || a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[110px] flex-1">
                      <Label className="mb-1 block text-[12.5px] font-semibold text-[#9AA0AE]">
                        Regulation
                      </Label>
                      <Select
                        disabled
                        value={
                          filters.regulationTypeId != null ? String(filters.regulationTypeId) : ""
                        }
                      >
                        <SelectTrigger className={disabledSelectClass}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {regulations.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.shortName || r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[110px] flex-1">
                      <Label className="mb-1 block text-[12.5px] font-semibold text-[#9AA0AE]">
                        Course level
                      </Label>
                      <Select
                        disabled
                        value={
                          filters.courseLevelId != null ? String(filters.courseLevelId) : ALL_LEVELS
                        }
                      >
                        <SelectTrigger className={disabledSelectClass}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_LEVELS}>All levels</SelectItem>
                          {courseLevels.map((cl) => (
                            <SelectItem key={cl.id} value={String(cl.id)}>
                              {cl.shortName || cl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[110px] flex-1">
                      <Label className="mb-1 block text-[12.5px] font-semibold text-[#9AA0AE]">
                        Appear type
                      </Label>
                      <Select
                        disabled
                        value={filters.appearTypeId != null ? String(filters.appearTypeId) : ""}
                      >
                        <SelectTrigger className={disabledSelectClass}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {promotionStatuses.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Fixed by the grid cell that was clicked — editable here would
                    silently retarget the window at a different stream/semester. */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-[13px] font-semibold text-[#5A6478]">
                      Stream
                    </Label>
                    <Select
                      disabled
                      value={scopeDialog.draft.streamId ? String(scopeDialog.draft.streamId) : ""}
                    >
                      <SelectTrigger className={disabledSelectClass}>
                        <SelectValue placeholder="Stream" />
                      </SelectTrigger>
                      <SelectContent>
                        {streamColumns.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-[13px] font-semibold text-[#5A6478]">
                      Semester
                    </Label>
                    <Select
                      disabled
                      value={scopeDialog.draft.classId ? String(scopeDialog.draft.classId) : ""}
                    >
                      <SelectTrigger className={disabledSelectClass}>
                        <SelectValue placeholder="Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* semesterRows, not activeClassOptions — it also carries any
                            non-SEMESTER class a scope actually references. */}
                        {semesterRows.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-[13px] font-semibold text-[#5A6478]">
                      Start date <span className="font-normal text-[#9AA0AE]">(IST)</span>
                    </Label>
                    <input
                      type="datetime-local"
                      min={startMin}
                      className="h-10 w-full rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white px-2 text-[13.5px] font-medium text-[#1B2B4B] outline-none"
                      value={scopeDialog.draft.startDate}
                      onChange={(e) => patchDraft({ startDate: e.target.value })}
                    />
                    <p className="mt-1 text-[12.5px] text-[#9AA0AE]">
                      Empty = open since always. Can&apos;t be in the past.
                      {persistedStartIsPast ? (
                        <span className="block text-[#A07010]">
                          This window already started &mdash; its saved start is kept and stays
                          selectable.
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <Label className="mb-1 block text-[13px] font-semibold text-[#5A6478]">
                      End date <span className="font-normal text-[#9AA0AE]">(IST)</span>
                    </Label>
                    <input
                      type="datetime-local"
                      min={endMin}
                      className="h-10 w-full rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white px-2 text-[13.5px] font-medium text-[#1B2B4B] outline-none"
                      value={scopeDialog.draft.endDate}
                      onChange={(e) => patchDraft({ endDate: e.target.value })}
                    />
                    <p className="mt-1 text-[12.5px] text-[#9AA0AE]">
                      Empty = never closes. Must be after the start date.
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between rounded-[9px] border-[1.5px] px-3.5 py-2.5",
                    scopeDialog.draft.isEnabled
                      ? "border-[#A0D8B8] bg-[#E8F5EE]"
                      : "border-[#E0DDD6] bg-[#F7F6F3]",
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        "font-['Sora',sans-serif] text-[12.5px] font-bold",
                        scopeDialog.draft.isEnabled ? "text-[#1A7A4A]" : "text-[#5A6478]",
                      )}
                    >
                      {scopeDialog.draft.isEnabled ? "Scope enabled" : "Scope disabled"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#9AA0AE]">
                      Current status:{" "}
                      <strong className="font-semibold">
                        {scopeStatus(scopeDialog.draft).label}
                      </strong>
                    </div>
                  </div>
                  <Switch
                    checked={scopeDialog.draft.isEnabled}
                    onCheckedChange={(v) => patchDraft({ isEnabled: v })}
                    className="data-[state=checked]:bg-[#1A7A4A]"
                  />
                </div>

                {scopeError ? (
                  <p
                    role="alert"
                    className="rounded-[8px] border-[1.5px] border-[#F5BFBF] bg-[#FEF0F0] px-3 py-2 text-[13.5px] font-semibold text-[#C23B3B]"
                  >
                    {scopeError}
                  </p>
                ) : null}
              </div>

              <div className="flex gap-2 rounded-b-[14px] border-t border-[#E0DDD6] bg-[#F7F6F3] px-5 py-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-[8px] border-[1.5px] border-[#D0CCC3] text-[13px] font-semibold text-[#5A6478]"
                  onClick={() => setScopeDialog(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-[2] rounded-[8px] bg-[#1B2B4B] font-['Sora',sans-serif] text-[13px] font-bold hover:bg-[#2C3E63]"
                  onClick={saveScope}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save scope →"}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Stream matrix cell ─── */
function MatrixCell({
  cell,
  streamName,
  semesterName,
  onActivate,
}: {
  cell: { ruleId: number; scope: ScopeDto; total: number } | undefined;
  streamName: string;
  semesterName: string;
  onActivate: () => void;
}) {
  const where = `${streamName} · ${semesterName}`;

  if (!cell) {
    return (
      <TableCell
        role="button"
        tabIndex={0}
        title={`No window for ${where} — click to add one`}
        aria-label={`Add a window for ${where}`}
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate();
          }
        }}
        className="group cursor-pointer border border-slate-200 px-2 py-2.5 align-top transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B2B4B] sm:px-3"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] leading-none text-slate-300">&mdash;</span>
          <span className="text-[10px] font-semibold text-slate-300 transition-colors group-hover:text-[#1A6BB5]">
            + add
          </span>
        </div>
      </TableCell>
    );
  }

  const st = scopeStatusFromDto(cell.scope);
  const off = !cell.scope.isEnabled;
  const startFull = cell.scope.startDate ? formatIst(cell.scope.startDate) : "open since always";
  const endFull = cell.scope.endDate ? formatIst(cell.scope.endDate) : "no end date";
  const dupNote =
    cell.total > 1
      ? `\n${cell.total} rules configure this combination — clicking edits the one on rule #${cell.ruleId}`
      : "";

  return (
    <TableCell
      role="button"
      tabIndex={0}
      title={`${where}\nStart: ${startFull}\nEnd: ${endFull}\nStatus: ${st.label}${dupNote}`}
      aria-label={`Edit the ${where} window. Starts ${startFull}, ends ${endFull}. Status ${st.label}.`}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      className={cn(
        "group cursor-pointer border border-slate-200 px-2 py-2.5 align-top transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B2B4B] sm:px-3",
        off ? "bg-[#FDF0F0] hover:bg-[#FBE3E3]" : "hover:bg-slate-50",
      )}
    >
      {/* Status on the left, start date on the right. The end date is deliberately
          not rendered here — it stays editable in the dialog and is still carried
          by this cell's title tooltip and aria-label. */}
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 flex-col items-start gap-1">
          {/* The tint is never the only signal — the state is always spelled out. */}
          {off ? (
            <span className="rounded-[3px] border border-[#F5BFBF] bg-white px-1 py-px text-[8.5px] font-bold uppercase tracking-wide text-[#C23B3B]">
              Off
            </span>
          ) : (
            <Badge
              variant="outline"
              className={cn("h-auto px-1 py-px text-[8.5px] font-bold uppercase", st.cls)}
            >
              {st.label}
            </Badge>
          )}
          {cell.total > 1 ? (
            <span className="rounded-[3px] border border-[#F0D888] bg-[#FDF4DC] px-1 py-px text-[8.5px] font-bold text-[#A07010]">
              {cell.total}&times;
            </span>
          ) : null}
        </div>
        {/* Same colour/weight/size as the Semester column value. */}
        <span className="min-w-0 flex-1 text-xs font-semibold leading-tight text-slate-800 sm:text-sm">
          {cell.scope.startDate ? formatIst(cell.scope.startDate) : "—"}
        </span>
        <Pencil className="h-3 w-3 shrink-0 text-slate-300 transition-colors group-hover:text-[#1B2B4B]" />
      </div>
    </TableCell>
  );
}

/* ─── Proxy Activity Grid ─── */
function ProxyActivityGrid({
  activities,
  classOptions,
  student,
}: {
  activities: AcademicActivityApiDto[];
  classOptions: ClassOption[];
  student: ProxyStudent;
}) {
  const visible = activities.filter((a) => a.master.isActive);
  if (visible.length === 0) {
    return (
      <div className="py-6 text-center text-[13px] text-[#9AA0AE]">
        No activities are currently enabled.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
      {visible.map((act) => {
        const st = activityStatus(act);
        const hasMatchingScope = act.scopes.some((s) => {
          if (!s.isEnabled) return false;
          const cls = classOptions.find((c) => c.id === scopeClassId(s));
          if (!cls) return false;
          return (cls.sequence ?? null) === student.sem;
        });
        const blocked = !hasMatchingScope;
        return (
          <div
            key={act.id}
            className={cn(
              "flex flex-col gap-2 rounded-[11px] border bg-white p-3.5 shadow-sm transition-all",
              blocked
                ? "border-[#E0DDD6] opacity-45"
                : "border-[#E0DDD6] hover:-translate-y-px hover:shadow-md",
            )}
          >
            <div className="flex gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base",
                  blocked ? "border-[#E0DDD6] bg-[#EFEDE8]" : "border-[#E0DDD6] bg-[#F7F6F3]",
                )}
              >
                {typeIcon(act.master.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "font-['Sora',sans-serif] text-[12.5px] font-bold leading-tight",
                    blocked ? "text-[#9AA0AE]" : "text-[#1B2B4B]",
                  )}
                >
                  {act.master.name}
                </div>
                <p className="mt-0.5 text-[10.5px] text-[#9AA0AE]">
                  {act.master.description || act.master.type}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#E0DDD6] pt-2">
              <span
                className={cn(
                  "text-[11.5px] font-semibold",
                  blocked ? "text-[#9AA0AE]" : st.live ? "text-[#1A7A4A]" : "text-[#5A6478]",
                )}
              >
                {blocked ? `Not available for Sem ${SL[student.sem - 1]}` : st.label}
              </span>
              {!blocked ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold",
                    st.bg,
                    st.color,
                    st.bd,
                  )}
                >
                  {st.live ? (
                    <span className="h-1 w-1 shrink-0 animate-pulse rounded-full bg-[#1A7A4A]" />
                  ) : null}
                  {st.label}
                </span>
              ) : (
                <span className="text-[11px] text-[#D0CCC3]">Locked</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
