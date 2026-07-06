import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiSelectDropdown from "@/components/ui/MultiSelect";
import { useAppSelector } from "@/store/hooks";
import { selectAvailableAcademicYears } from "@/store/slices/academicYearSlice";
import { getAllClasses } from "@/services/classes.service";
import { getAllShifts } from "@/services/academic";
import {
  getAffiliations,
  getProgramCourseDtos,
  getRegulationTypes,
  getStreams,
} from "@/services/course-design.api";
import { formatSemesterClassOptionLabel } from "@/features/fees-dashboard/utils/semester-display";
import type { Class } from "@/types/academics/class";
import type { Shift } from "@/types/academics/shift";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";

export type DashboardUiFilters = {
  academicYearIds: string[];
  variants: string[];
  statuses: string[];
  userTypes: string[];
  streamIds: string[];
  affiliationIds: string[];
  regulationTypeIds: string[];
  programCourseIds: string[];
  classIds: string[];
  shiftIds: string[];
  range: string;
};

export const DEFAULT_DASH_FILTERS: DashboardUiFilters = {
  academicYearIds: [],
  variants: [],
  statuses: [],
  userTypes: [],
  streamIds: [],
  affiliationIds: [],
  regulationTypeIds: [],
  programCourseIds: [],
  classIds: [],
  shiftIds: [],
  range: "All time",
};

export const RANGES: { label: string; days?: number }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 365 days", days: 365 },
  { label: "All time" },
];

const USER_TYPES = ["ADMIN", "STUDENT", "FACULTY", "STAFF", "PARENTS"];
const VARIANTS = ["EMAIL", "WHATSAPP", "SMS", "WEB", "OTHER"];
const STATUSES = ["SENT", "PENDING", "FAILED"];

export function countActiveDashFilters(f: DashboardUiFilters): number {
  let n = 0;
  if (f.academicYearIds.length) n++;
  if (f.variants.length) n++;
  if (f.statuses.length) n++;
  if (f.userTypes.length) n++;
  if (f.streamIds.length) n++;
  if (f.affiliationIds.length) n++;
  if (f.regulationTypeIds.length) n++;
  if (f.programCourseIds.length) n++;
  if (f.classIds.length) n++;
  if (f.shiftIds.length) n++;
  if (f.range !== "All time") n++;
  return n;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DashboardUiFilters;
  onApply: (filters: DashboardUiFilters) => void;
};

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[#444]">{label}</label>
      {children}
    </div>
  );
}

export function DashboardFiltersDialog({ open, onOpenChange, value, onApply }: Props) {
  const years = useAppSelector(selectAvailableAcademicYears);
  const [draft, setDraft] = useState<DashboardUiFilters>(value);

  const [classes, setClasses] = useState<Class[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [streams, setStreams] = useState<{ id: number; name: string }[]>([]);
  const [affiliations, setAffiliations] = useState<{ id: number; name: string }[]>([]);
  const [regulationTypes, setRegulationTypes] = useState<{ id: number; name: string }[]>([]);
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
        const [classRows, shiftRows, streamRows, affiliationRows, regulationRows, pcRows] =
          await Promise.all([
            getAllClasses(),
            getAllShifts(),
            getStreams(),
            getAffiliations(),
            getRegulationTypes(),
            getProgramCourseDtos(),
          ]);
        if (cancelled) return;
        const named = (rows: unknown) =>
          (Array.isArray(rows) ? (rows as { id?: number | null; name?: string | null }[]) : [])
            .filter((r) => r?.id != null && r?.name)
            .map((r) => ({ id: Number(r.id), name: String(r.name) }));
        setClasses((classRows ?? []).filter((c) => c.isActive !== false && c.type === "SEMESTER"));
        setShifts((shiftRows ?? []).filter((s) => !s.disabled));
        setStreams(named(streamRows));
        setAffiliations(named(affiliationRows));
        setRegulationTypes(named(regulationRows));
        setProgramCourses(Array.isArray(pcRows) ? pcRows : []);
        setOptionsLoaded(true);
      } catch {
        // options stay empty; filters still usable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, optionsLoaded]);

  const update = <K extends keyof DashboardUiFilters>(key: K, v: DashboardUiFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const academicYearOptions = years.map((y) => ({ value: String(y.id), label: String(y.year) }));
  const streamOptions = streams.map((s) => ({ value: String(s.id), label: s.name }));
  const affiliationOptions = affiliations.map((a) => ({ value: String(a.id), label: a.name }));
  const regulationOptions = regulationTypes.map((r) => ({ value: String(r.id), label: r.name }));

  // Cascade: program-course options narrow to the selected streams /
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

  // Drop selected program-courses that fell out of the narrowed option list.
  useEffect(() => {
    const valid = new Set(programCourseOptions.map((o) => o.value));
    setDraft((d) => {
      const pruned = d.programCourseIds.filter((id) => valid.has(id));
      return pruned.length === d.programCourseIds.length ? d : { ...d, programCourseIds: pruned };
    });
  }, [programCourseOptions]);
  const classOptions = classes.map((c) => ({
    value: String(c.id),
    label: formatSemesterClassOptionLabel(c.name),
  }));
  const shiftOptions = shifts.map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c3aed]">
            Notification
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FilterField label="Channels">
              <MultiSelectDropdown
                placeholder="All channels"
                options={VARIANTS.map((v) => ({ value: v, label: v }))}
                selectedOptions={draft.variants}
                onChange={(s) => update("variants", s)}
              />
            </FilterField>
            <FilterField label="Statuses">
              <MultiSelectDropdown
                placeholder="All statuses"
                options={STATUSES.map((s) => ({ value: s, label: s }))}
                selectedOptions={draft.statuses}
                onChange={(s) => update("statuses", s)}
              />
            </FilterField>
            <FilterField label="Time range">
              <Select value={draft.range} onValueChange={(v) => update("range", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGES.map((r) => (
                    <SelectItem key={r.label} value={r.label}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c3aed]">
            Recipient cohort
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FilterField label="Academic years">
              <MultiSelectDropdown
                placeholder="All academic years"
                options={academicYearOptions}
                selectedOptions={draft.academicYearIds}
                onChange={(s) => update("academicYearIds", s)}
                contentClassName="min-w-[260px]"
              />
            </FilterField>
            <FilterField label="User types">
              <MultiSelectDropdown
                placeholder="All user types"
                options={USER_TYPES.map((t) => ({ value: t, label: t }))}
                selectedOptions={draft.userTypes}
                onChange={(s) => update("userTypes", s)}
              />
            </FilterField>
            <FilterField label="Streams">
              <MultiSelectDropdown
                placeholder="All streams"
                options={streamOptions}
                selectedOptions={draft.streamIds}
                onChange={(s) => update("streamIds", s)}
              />
            </FilterField>
            <FilterField label="Affiliations">
              <MultiSelectDropdown
                placeholder="All affiliations"
                options={affiliationOptions}
                selectedOptions={draft.affiliationIds}
                onChange={(s) => update("affiliationIds", s)}
                contentClassName="min-w-[260px]"
              />
            </FilterField>
            <FilterField label="Regulations">
              <MultiSelectDropdown
                placeholder="All regulations"
                options={regulationOptions}
                selectedOptions={draft.regulationTypeIds}
                onChange={(s) => update("regulationTypeIds", s)}
                contentClassName="min-w-[240px]"
              />
            </FilterField>
            <FilterField label="Program courses">
              <MultiSelectDropdown
                placeholder="All program courses"
                options={programCourseOptions}
                selectedOptions={draft.programCourseIds}
                onChange={(s) => update("programCourseIds", s)}
                contentClassName="min-w-[320px] max-h-[280px] overflow-y-auto"
              />
            </FilterField>
            <FilterField label="Semesters">
              <MultiSelectDropdown
                placeholder="All semesters"
                options={classOptions}
                selectedOptions={draft.classIds}
                onChange={(s) => update("classIds", s)}
              />
            </FilterField>
            <FilterField label="Shifts">
              <MultiSelectDropdown
                placeholder="All shifts"
                options={shiftOptions}
                selectedOptions={draft.shiftIds}
                onChange={(s) => update("shiftIds", s)}
              />
            </FilterField>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => {
              onApply(DEFAULT_DASH_FILTERS);
              onOpenChange(false);
            }}
          >
            Reset
          </Button>
          <Button
            className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
