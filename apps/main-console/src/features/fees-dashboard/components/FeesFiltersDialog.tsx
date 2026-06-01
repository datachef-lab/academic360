import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultiSelectDropdown from "@/components/ui/MultiSelect";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { getAllClasses } from "@/services/classes.service";
import { getAllShifts } from "@/services/academic";
import {
  getAffiliations,
  getCourseLevels,
  getProgramCourseDtos,
  getRegulationTypes,
  getStreams,
} from "@/services/course-design.api";
import { getAllCategories } from "@/services/categories.service";
import { getAllReligions } from "@/services/religion.service";
import type { Class } from "@/types/academics/class";
import type { Shift } from "@/types/academics/shift";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";
import type { FeesDashboardFilters } from "../types/dashboard-api";
import { formatSemesterClassOptionLabel } from "../utils/semester-display";
import {
  DEFAULT_FILTER_LABELS,
  formFromApiFilters,
  formatDateRangeLabel,
  formatMultiSelectLabel,
  toApiFilters,
  type FeesDashboardFilterForm,
  type FeesDashboardFilterLabels,
} from "../utils/filter-utils";

type FeesFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FeesDashboardFilters;
  onApply: (filters: FeesDashboardFilters, labels: FeesDashboardFilterLabels) => void;
  onReset: () => void;
};

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

/** Fee mapping collection state (paid vs not fully paid) and failed online/cash attempts. */
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

function rowsWithId<T extends { id?: number | null }>(rows: T[]): Array<T & { id: number }> {
  return rows.filter((row): row is T & { id: number } => row.id != null);
}

export function FeesFiltersDialog({
  open,
  onOpenChange,
  value,
  onApply,
  onReset,
}: FeesFiltersDialogProps) {
  const { availableAcademicYears, loadAcademicYears } = useAcademicYear();
  const [form, setForm] = useState<FeesDashboardFilterForm>(() => formFromApiFilters(value));
  const [classes, setClasses] = useState<Class[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourseDto[]>([]);
  const [courseLevels, setCourseLevels] = useState<{ id: number; name: string }[]>([]);
  const [regulations, setRegulations] = useState<
    { id: number; name: string; shortName?: string | null }[]
  >([]);
  const [affiliations, setAffiliations] = useState<{ id: number; name: string }[]>([]);
  const [streams, setStreams] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [religions, setReligions] = useState<{ id: number; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) setForm(formFromApiFilters(value));
  }, [open, value]);

  useEffect(() => {
    if (availableAcademicYears.length === 0) void loadAcademicYears();
  }, [availableAcademicYears.length, loadAcademicYears]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingOptions(true);
    void Promise.all([
      getAllClasses(),
      getAllShifts(),
      getProgramCourseDtos(),
      getCourseLevels(),
      getRegulationTypes(),
      getAffiliations(),
      getStreams(),
      getAllCategories(),
      getAllReligions(),
    ])
      .then(
        ([
          classRows,
          shiftRows,
          courseRows,
          levelRows,
          regulationRows,
          affiliationRows,
          streamRows,
          categoryRows,
          religionRows,
        ]) => {
          if (cancelled) return;
          setClasses(classRows.filter((c) => !c.disabled && c.type === "SEMESTER"));
          setShifts(shiftRows.filter((s) => !s.disabled));
          setProgramCourses(Array.isArray(courseRows) ? courseRows : []);
          setCourseLevels(rowsWithId(Array.isArray(levelRows) ? levelRows : []));
          setRegulations(rowsWithId(Array.isArray(regulationRows) ? regulationRows : []));
          setAffiliations(rowsWithId(Array.isArray(affiliationRows) ? affiliationRows : []));
          setStreams(rowsWithId(Array.isArray(streamRows) ? streamRows : []));
          setCategories(rowsWithId(Array.isArray(categoryRows) ? categoryRows : []));
          setReligions(rowsWithId(Array.isArray(religionRows) ? religionRows : []));
        },
      )
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const academicYearOptions = availableAcademicYears.map((ay) => ({
    value: String(ay.id),
    label: `${ay.year}${ay.isCurrentYear ? " (current)" : ""}`,
  }));
  const courseLevelOptions = courseLevels.map((level) => ({
    value: String(level.id),
    label: level.name,
  }));
  const programCourseOptions = useMemo(() => {
    let list = programCourses.filter((pc) => pc.id != null);
    if (form.affiliationIds.length) {
      const allowed = new Set(form.affiliationIds.map(Number));
      list = list.filter((pc) => {
        const id = pc.affiliation?.id;
        return id != null && allowed.has(id);
      });
    }
    if (form.regulationTypeIds.length) {
      const allowed = new Set(form.regulationTypeIds.map(Number));
      list = list.filter((pc) => {
        const id = pc.regulationType?.id;
        return id != null && allowed.has(id);
      });
    }
    if (form.courseLevelIds.length) {
      const allowed = new Set(form.courseLevelIds.map(Number));
      list = list.filter((pc) => {
        const id = pc.courseLevel?.id;
        return id != null && allowed.has(id);
      });
    }
    if (form.streamIds.length) {
      const allowed = new Set(form.streamIds.map(Number));
      list = list.filter((pc) => {
        const id = pc.stream?.id;
        return id != null && allowed.has(id);
      });
    }
    return list.map((pc) => ({
      value: String(pc.id),
      label: pc.shortName?.trim() ? `${pc.shortName} · ${pc.name}` : (pc.name ?? "Program course"),
    }));
  }, [
    programCourses,
    form.affiliationIds,
    form.regulationTypeIds,
    form.courseLevelIds,
    form.streamIds,
  ]);

  useEffect(() => {
    if (!open) return;
    const allowed = new Set(programCourseOptions.map((o) => o.value));
    const pruned = form.programCourseIds.filter((id) => allowed.has(id));
    if (pruned.length !== form.programCourseIds.length) {
      setForm((prev) => ({ ...prev, programCourseIds: pruned }));
    }
  }, [open, programCourseOptions, form.programCourseIds]);
  const classOptions = classes.map((cls) => ({
    value: String(cls.id),
    label: formatSemesterClassOptionLabel(cls.name),
  }));
  const shiftOptions = shifts.map((shift) => ({
    value: String(shift.id),
    label: shift.name,
  }));
  const regulationOptions = regulations.map((r) => ({
    value: String(r.id),
    label: r.shortName?.trim() || r.name,
  }));
  const affiliationOptions = affiliations.map((a) => ({
    value: String(a.id),
    label: a.name,
  }));
  const streamOptions = streams.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));
  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  const religionOptions = religions.map((r) => ({
    value: String(r.id),
    label: r.name,
  }));

  const updateForm = <K extends keyof FeesDashboardFilterForm>(
    key: K,
    next: FeesDashboardFilterForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: next }));
  };

  const handleApply = () => {
    const filters = toApiFilters(form);
    const labels: FeesDashboardFilterLabels = {
      academicYear: formatMultiSelectLabel(
        form.academicYearIds,
        academicYearOptions,
        DEFAULT_FILTER_LABELS.academicYear,
      ),
      program: formatMultiSelectLabel(
        form.courseLevelIds,
        courseLevelOptions,
        DEFAULT_FILTER_LABELS.program,
      ),
      programCourse: formatMultiSelectLabel(
        form.programCourseIds,
        programCourseOptions,
        DEFAULT_FILTER_LABELS.programCourse,
      ),
      semester: formatMultiSelectLabel(form.classIds, classOptions, DEFAULT_FILTER_LABELS.semester),
      shift: formatMultiSelectLabel(form.shiftIds, shiftOptions, DEFAULT_FILTER_LABELS.shift),
      regulation: formatMultiSelectLabel(
        form.regulationTypeIds,
        regulationOptions,
        DEFAULT_FILTER_LABELS.regulation,
      ),
      affiliation: formatMultiSelectLabel(
        form.affiliationIds,
        affiliationOptions,
        DEFAULT_FILTER_LABELS.affiliation,
      ),
      stream: formatMultiSelectLabel(form.streamIds, streamOptions, DEFAULT_FILTER_LABELS.stream),
      category: formatMultiSelectLabel(
        form.categoryIds,
        categoryOptions,
        DEFAULT_FILTER_LABELS.category,
      ),
      religion: formatMultiSelectLabel(
        form.religionIds,
        religionOptions,
        DEFAULT_FILTER_LABELS.religion,
      ),
      gender: formatMultiSelectLabel(form.genders, GENDER_OPTIONS, DEFAULT_FILTER_LABELS.gender),
      paymentStatus: formatMultiSelectLabel(
        form.paymentStatuses,
        PAYMENT_STATUS_OPTIONS,
        DEFAULT_FILTER_LABELS.paymentStatus,
      ),
      paymentMode: formatMultiSelectLabel(
        form.paymentModes,
        PAYMENT_MODE_OPTIONS,
        DEFAULT_FILTER_LABELS.paymentMode,
      ),
      dateRange: formatDateRangeLabel(form.dateFrom, form.dateTo),
      studentSearch: form.studentSearch.trim(),
    };

    onApply(filters, labels);
    onOpenChange(false);
  };

  const handleReset = () => {
    setForm(formFromApiFilters({}));
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Dashboard filters</DialogTitle>
          <DialogDescription className="text-base">
            Segment analytics by academic scope, student attributes, and payment activity.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FilterField label="Academic year">
            <MultiSelectDropdown
              placeholder="All academic years"
              options={academicYearOptions}
              selectedOptions={form.academicYearIds}
              onChange={(selected) => updateForm("academicYearIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Course level">
            <MultiSelectDropdown
              placeholder="All course levels"
              options={courseLevelOptions}
              selectedOptions={form.courseLevelIds}
              onChange={(selected) => updateForm("courseLevelIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Regulation">
            <MultiSelectDropdown
              placeholder="All regulations"
              options={regulationOptions}
              selectedOptions={form.regulationTypeIds}
              onChange={(selected) => updateForm("regulationTypeIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Affiliation">
            <MultiSelectDropdown
              placeholder="All affiliations"
              options={affiliationOptions}
              selectedOptions={form.affiliationIds}
              onChange={(selected) => updateForm("affiliationIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Stream">
            <MultiSelectDropdown
              placeholder="All streams"
              options={streamOptions}
              selectedOptions={form.streamIds}
              onChange={(selected) => updateForm("streamIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Program course">
            <MultiSelectDropdown
              placeholder="All program courses"
              options={programCourseOptions}
              selectedOptions={form.programCourseIds}
              onChange={(selected) => updateForm("programCourseIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Semester / class">
            <MultiSelectDropdown
              placeholder="All semesters"
              options={classOptions}
              selectedOptions={form.classIds}
              onChange={(selected) => updateForm("classIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Shift">
            <MultiSelectDropdown
              placeholder="All shifts"
              options={shiftOptions}
              selectedOptions={form.shiftIds}
              onChange={(selected) => updateForm("shiftIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Category">
            <MultiSelectDropdown
              placeholder="All categories"
              options={categoryOptions}
              selectedOptions={form.categoryIds}
              onChange={(selected) => updateForm("categoryIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Religion">
            <MultiSelectDropdown
              placeholder="All religions"
              options={religionOptions}
              selectedOptions={form.religionIds}
              onChange={(selected) => updateForm("religionIds", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Gender">
            <MultiSelectDropdown
              placeholder="All genders"
              options={GENDER_OPTIONS}
              selectedOptions={form.genders}
              onChange={(selected) => updateForm("genders", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Payment status">
            <MultiSelectDropdown
              placeholder="All payment statuses"
              options={PAYMENT_STATUS_OPTIONS}
              selectedOptions={form.paymentStatuses}
              onChange={(selected) => updateForm("paymentStatuses", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Payment mode">
            <MultiSelectDropdown
              placeholder="All payment modes"
              options={PAYMENT_MODE_OPTIONS}
              selectedOptions={form.paymentModes}
              onChange={(selected) => updateForm("paymentModes", selected)}
              contentClassName="min-w-[280px]"
            />
          </FilterField>

          <FilterField label="Date from" className="sm:col-span-1">
            <Input
              type="date"
              className="h-10 text-base"
              value={form.dateFrom}
              onChange={(e) => updateForm("dateFrom", e.target.value)}
              disabled={loadingOptions}
            />
          </FilterField>

          <FilterField label="Date to" className="sm:col-span-1">
            <Input
              type="date"
              className="h-10 text-base"
              value={form.dateTo}
              onChange={(e) => updateForm("dateTo", e.target.value)}
              disabled={loadingOptions}
            />
          </FilterField>

          <FilterField
            label="Search student (UID / roll / name)"
            className="sm:col-span-2 lg:col-span-3"
          >
            <Input
              placeholder="UID, roll number, or student name…"
              className="h-10 text-base"
              value={form.studentSearch}
              onChange={(e) => updateForm("studentSearch", e.target.value)}
              disabled={loadingOptions}
            />
          </FilterField>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="text-base" onClick={handleReset}>
            Reset
          </Button>
          <Button className="text-base" onClick={handleApply} disabled={loadingOptions}>
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
