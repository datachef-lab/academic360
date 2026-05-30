import type { FeesDashboardFilters } from "../types/dashboard-api";

export function hasDashboardScope(filters?: FeesDashboardFilters | null): boolean {
  const f = filters ?? {};
  return Boolean(
    f.academicYearIds?.length ||
    f.programCourseIds?.length ||
    f.classIds?.length ||
    f.shiftIds?.length ||
    f.streamIds?.length ||
    f.courseLevelIds?.length ||
    f.regulationTypeIds?.length ||
    f.affiliationIds?.length ||
    f.categoryIds?.length ||
    f.religionIds?.length ||
    f.genders?.length ||
    f.paymentStatuses?.length ||
    f.paymentModes?.length ||
    f.transactionStatuses?.length ||
    f.dateFrom ||
    f.dateTo ||
    f.studentSearch?.trim(),
  );
}

export type FeesDashboardFilterLabels = {
  academicYear: string;
  program: string;
  programCourse: string;
  semester: string;
  shift: string;
  regulation: string;
  affiliation: string;
  stream: string;
  category: string;
  religion: string;
  gender: string;
  paymentStatus: string;
  paymentMode: string;
  transactionStatus: string;
  dateRange: string;
  studentSearch: string;
};

export const DEFAULT_FILTER_LABELS: FeesDashboardFilterLabels = {
  academicYear: "All academic years",
  program: "All programs",
  programCourse: "All courses",
  semester: "All semesters",
  shift: "All shifts",
  regulation: "All regulations",
  affiliation: "All affiliations",
  stream: "All streams",
  category: "All categories",
  religion: "All religions",
  gender: "All genders",
  paymentStatus: "All payment statuses",
  paymentMode: "All payment modes",
  transactionStatus: "All transaction statuses",
  dateRange: "Any date",
  studentSearch: "",
};

export const FILTER_DIMENSION_LABELS: Record<keyof FeesDashboardFilterLabels, string> = {
  academicYear: "Academic year",
  program: "Program",
  programCourse: "Course",
  semester: "Semester",
  shift: "Shift",
  regulation: "Regulation",
  affiliation: "Affiliation",
  stream: "Stream",
  category: "Category",
  religion: "Religion",
  gender: "Gender",
  paymentStatus: "Payment status",
  paymentMode: "Payment mode",
  transactionStatus: "Transaction status",
  dateRange: "Date range",
  studentSearch: "Student search",
};

export type ActiveFilterChip = {
  key: keyof FeesDashboardFilterLabels;
  label: string;
  value: string;
};

export function buildActiveFilterChips(labels: FeesDashboardFilterLabels): ActiveFilterChip[] {
  return (Object.keys(labels) as Array<keyof FeesDashboardFilterLabels>)
    .filter((key) => {
      const value = labels[key];
      if (key === "studentSearch") return Boolean(value?.trim());
      const defaultValue = DEFAULT_FILTER_LABELS[key];
      return defaultValue != null && value !== defaultValue;
    })
    .map((key) => ({
      key,
      label: FILTER_DIMENSION_LABELS[key],
      value: labels[key],
    }));
}

export function buildFilterChips(labels: FeesDashboardFilterLabels): string[] {
  return buildActiveFilterChips(labels).map((chip) => chip.value);
}

export type FeesDashboardFilterForm = {
  academicYearIds: string[];
  courseLevelIds: string[];
  programCourseIds: string[];
  classIds: string[];
  shiftIds: string[];
  regulationTypeIds: string[];
  affiliationIds: string[];
  streamIds: string[];
  categoryIds: string[];
  religionIds: string[];
  genders: string[];
  paymentStatuses: string[];
  paymentModes: string[];
  transactionStatuses: string[];
  dateFrom: string;
  dateTo: string;
  studentSearch: string;
};

export function formFromApiFilters(filters?: FeesDashboardFilters | null): FeesDashboardFilterForm {
  const f = filters ?? {};
  return {
    academicYearIds: (f.academicYearIds ?? []).map(String),
    courseLevelIds: (f.courseLevelIds ?? []).map(String),
    programCourseIds: (f.programCourseIds ?? []).map(String),
    classIds: (f.classIds ?? []).map(String),
    shiftIds: (f.shiftIds ?? []).map(String),
    regulationTypeIds: (f.regulationTypeIds ?? []).map(String),
    affiliationIds: (f.affiliationIds ?? []).map(String),
    streamIds: (f.streamIds ?? []).map(String),
    categoryIds: (f.categoryIds ?? []).map(String),
    religionIds: (f.religionIds ?? []).map(String),
    genders: f.genders ?? [],
    paymentStatuses: f.paymentStatuses ?? [],
    paymentModes: f.paymentModes ?? [],
    transactionStatuses: f.transactionStatuses ?? [],
    dateFrom: f.dateFrom ?? "",
    dateTo: f.dateTo ?? "",
    studentSearch: f.studentSearch ?? "",
  };
}

function toNums(ids: string[]) {
  return ids.map((id) => Number(id)).filter((n) => Number.isFinite(n));
}

export function toApiFilters(form: FeesDashboardFilterForm): FeesDashboardFilters {
  const filters: FeesDashboardFilters = {};
  const assignIds = (key: keyof FeesDashboardFilters, ids: string[]) => {
    const nums = toNums(ids);
    if (nums.length) (filters[key] as number[] | undefined) = nums;
  };

  assignIds("academicYearIds", form.academicYearIds);
  assignIds("courseLevelIds", form.courseLevelIds);
  assignIds("programCourseIds", form.programCourseIds);
  assignIds("classIds", form.classIds);
  assignIds("shiftIds", form.shiftIds);
  assignIds("regulationTypeIds", form.regulationTypeIds);
  assignIds("affiliationIds", form.affiliationIds);
  assignIds("streamIds", form.streamIds);
  assignIds("categoryIds", form.categoryIds);
  assignIds("religionIds", form.religionIds);

  if (form.genders.length) filters.genders = form.genders;
  if (form.paymentStatuses.length) filters.paymentStatuses = form.paymentStatuses;
  if (form.paymentModes.length) filters.paymentModes = form.paymentModes;
  if (form.transactionStatuses.length) filters.transactionStatuses = form.transactionStatuses;
  if (form.dateFrom) filters.dateFrom = form.dateFrom;
  if (form.dateTo) filters.dateTo = form.dateTo;
  if (form.studentSearch.trim()) filters.studentSearch = form.studentSearch.trim();

  return filters;
}

export function formatMultiSelectLabel(
  selectedIds: string[],
  options: { value: string; label: string }[],
  allLabel: string,
): string {
  if (selectedIds.length === 0) return allLabel;
  if (selectedIds.length === 1) {
    return options.find((o) => o.value === selectedIds[0])?.label ?? allLabel;
  }
  return `${selectedIds.length} selected`;
}

export function formatDateRangeLabel(from: string, to: string): string {
  if (from && to) return `${from} → ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return DEFAULT_FILTER_LABELS.dateRange;
}
