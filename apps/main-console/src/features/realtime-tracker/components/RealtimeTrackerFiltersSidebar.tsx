import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultiSelectDropdown from "@/components/ui/MultiSelect";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import {
  formFromApiFilters,
  filterProgramCoursesForForm,
  PROGRAM_COURSE_CASCADE_KEYS,
  programCourseOptionsFromList,
  pruneProgramCourseIds,
  toApiFilters,
  type FeesDashboardFilterForm,
} from "@/features/fees-dashboard/utils/filter-utils";
import type { RealtimeTrackerFilters } from "../types/realtime-tracker-types";
import { realtimeTrackerFiltersKey } from "../utils/filters-key";
import { formatSemesterClassOptionLabel } from "@/features/fees-dashboard/utils/semester-display";
import { useRealtimeTrackerFilterOptions } from "../hooks/useRealtimeTrackerFilterOptions";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "PAID", label: "Paid (fully collected)" },
  { value: "UNPAID", label: "Unpaid / due" },
  { value: "FAILED", label: "Failed (payment attempt)" },
];

const PAYMENT_MODE_OPTIONS = [
  { value: "ONLINE", label: "Online" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
];

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

type Props = {
  value: RealtimeTrackerFilters;
  onChange: (filters: RealtimeTrackerFilters) => void;
  onReset: () => void;
  showPaymentFilters?: boolean;
};

function RealtimeTrackerFiltersSidebarInner({
  value,
  onChange,
  onReset,
  showPaymentFilters = true,
}: Props) {
  const { data: academicYears = [] } = useAcademicYears();
  const { data: filterOptions, isLoading: optionsLoading } = useRealtimeTrackerFilterOptions();
  const [form, setForm] = useState<FeesDashboardFilterForm>(() => formFromApiFilters(value));

  const classes = filterOptions?.classes ?? [];
  const shifts = filterOptions?.shifts ?? [];
  const programCourses = filterOptions?.programCourses ?? [];
  const courseLevels = filterOptions?.courseLevels ?? [];
  const regulations = filterOptions?.regulations ?? [];
  const affiliations = filterOptions?.affiliations ?? [];
  const streams = filterOptions?.streams ?? [];
  const categories = filterOptions?.categories ?? [];
  const religions = filterOptions?.religions ?? [];

  const valueKey = realtimeTrackerFiltersKey(value);
  useEffect(() => {
    setForm(formFromApiFilters(value));
  }, [valueKey, value]);

  const filteredProgramCourses = useMemo(
    () => filterProgramCoursesForForm(programCourses, form),
    [
      programCourses,
      form.affiliationIds,
      form.regulationTypeIds,
      form.courseLevelIds,
      form.streamIds,
    ],
  );

  const programCourseOptions = useMemo(
    () => programCourseOptionsFromList(filteredProgramCourses),
    [filteredProgramCourses],
  );

  useEffect(() => {
    setForm((current) => {
      const pruned = pruneProgramCourseIds(current.programCourseIds, programCourseOptions);
      if (pruned.length === current.programCourseIds.length) return current;
      const merged = { ...current, programCourseIds: pruned };
      const nextApi = toApiFilters(merged);
      if (realtimeTrackerFiltersKey(nextApi) !== valueKey) {
        onChange(nextApi);
      }
      return merged;
    });
  }, [programCourseOptions, valueKey, onChange]);

  const update = <K extends keyof FeesDashboardFilterForm>(
    key: K,
    next: FeesDashboardFilterForm[K],
  ) => {
    setForm((prev) => {
      let merged: FeesDashboardFilterForm = { ...prev, [key]: next };
      if ((PROGRAM_COURSE_CASCADE_KEYS as readonly string[]).includes(key as string)) {
        const options = programCourseOptionsFromList(
          filterProgramCoursesForForm(programCourses, merged),
        );
        merged = {
          ...merged,
          programCourseIds: pruneProgramCourseIds(merged.programCourseIds, options),
        };
      }
      onChange(toApiFilters(merged));
      return merged;
    });
  };

  const academicYearOptions = academicYears.map((ay) => ({
    value: String(ay.id),
    label: `${ay.year}${ay.isCurrentYear ? " (current)" : ""}`,
  }));

  if (optionsLoading && !filterOptions) {
    return <div className="p-3 text-xs text-muted-foreground">Loading filter options…</div>;
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-12rem)] pr-1">
        <FilterField label="Academic year">
          <MultiSelectDropdown
            placeholder="All academic years"
            options={academicYearOptions}
            selectedOptions={form.academicYearIds}
            onChange={(s) => update("academicYearIds", s)}
            contentClassName="min-w-[240px]"
          />
        </FilterField>
        <FilterField label="Course level">
          <MultiSelectDropdown
            placeholder="All course levels"
            options={courseLevels.map((l) => ({ value: String(l.id), label: l.name }))}
            selectedOptions={form.courseLevelIds}
            onChange={(s) => update("courseLevelIds", s)}
          />
        </FilterField>
        <FilterField label="Regulation">
          <MultiSelectDropdown
            placeholder="All regulations"
            options={regulations.map((r) => ({
              value: String(r.id),
              label: r.shortName?.trim() || r.name,
            }))}
            selectedOptions={form.regulationTypeIds}
            onChange={(s) => update("regulationTypeIds", s)}
          />
        </FilterField>
        <FilterField label="Affiliation">
          <MultiSelectDropdown
            placeholder="All affiliations"
            options={affiliations.map((a) => ({
              value: String(a.id),
              label: a.shortName?.trim() || a.name,
            }))}
            selectedOptions={form.affiliationIds}
            onChange={(s) => update("affiliationIds", s)}
          />
        </FilterField>
        <FilterField label="Stream">
          <MultiSelectDropdown
            placeholder="All streams"
            options={streams.map((s) => ({ value: String(s.id), label: s.name }))}
            selectedOptions={form.streamIds}
            onChange={(s) => update("streamIds", s)}
          />
        </FilterField>
        <FilterField label="Program course">
          <MultiSelectDropdown
            placeholder="All program courses"
            options={programCourseOptions}
            selectedOptions={form.programCourseIds}
            onChange={(s) => update("programCourseIds", s)}
          />
        </FilterField>
        <FilterField label="Semester / class">
          <MultiSelectDropdown
            placeholder="All semesters"
            options={classes.map((c) => ({
              value: String(c.id),
              label: formatSemesterClassOptionLabel(c.name),
            }))}
            selectedOptions={form.classIds}
            onChange={(s) => update("classIds", s)}
          />
        </FilterField>
        <FilterField label="Shift">
          <MultiSelectDropdown
            placeholder="All shifts"
            options={shifts.map((s) => ({ value: String(s.id), label: s.name }))}
            selectedOptions={form.shiftIds}
            onChange={(s) => update("shiftIds", s)}
          />
        </FilterField>
        <FilterField label="Category">
          <MultiSelectDropdown
            placeholder="All categories"
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            selectedOptions={form.categoryIds}
            onChange={(s) => update("categoryIds", s)}
          />
        </FilterField>
        <FilterField label="Religion">
          <MultiSelectDropdown
            placeholder="All religions"
            options={religions.map((r) => ({ value: String(r.id), label: r.name }))}
            selectedOptions={form.religionIds}
            onChange={(s) => update("religionIds", s)}
          />
        </FilterField>
        <FilterField label="Gender">
          <MultiSelectDropdown
            placeholder="All genders"
            options={GENDER_OPTIONS}
            selectedOptions={form.genders}
            onChange={(s) => update("genders", s)}
          />
        </FilterField>
        {showPaymentFilters ? (
          <>
            <FilterField label="Payment status">
              <MultiSelectDropdown
                placeholder="All payment statuses"
                options={PAYMENT_STATUS_OPTIONS}
                selectedOptions={form.paymentStatuses}
                onChange={(s) => update("paymentStatuses", s)}
              />
            </FilterField>
            <FilterField label="Payment mode">
              <MultiSelectDropdown
                placeholder="All payment modes"
                options={PAYMENT_MODE_OPTIONS}
                selectedOptions={form.paymentModes}
                onChange={(s) => update("paymentModes", s)}
              />
            </FilterField>
          </>
        ) : null}
        <FilterField label="Date from">
          <Input
            type="date"
            value={form.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
          />
        </FilterField>
        <FilterField label="Date to">
          <Input
            type="date"
            value={form.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
          />
        </FilterField>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}

export const RealtimeTrackerFiltersSidebar = memo(RealtimeTrackerFiltersSidebarInner);
