import type { AcademicActivityDto } from "@repo/db/dtos/academics";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";
import type { FeesDashboardFilters } from "../types/dashboard-api";
import {
  DEFAULT_FILTER_LABELS,
  formatMultiSelectLabel,
  type FeesDashboardFilterLabels,
} from "./filter-utils";
import {
  listInProcessSemesterFeeScopes,
  programCourseIdsForInProcessScopes,
} from "./academic-scope-utils";

export type DefaultDashboardFiltersResult = {
  filters: FeesDashboardFilters;
  labels: FeesDashboardFilterLabels;
};

function uniqueIds(values: Array<number | null | undefined>): number[] {
  return [...new Set(values.filter((id): id is number => id != null))];
}

function labelForMulti(labels: string[], countLabel: string, allLabel: string): string {
  if (labels.length === 1) return labels[0]!;
  if (labels.length > 1) return countLabel;
  return allLabel;
}

/**
 * When semester fee payment scopes are in process (enabled + within start/end window),
 * pre-select dashboard filters to match those scopes for the academic year.
 */
export function deriveDefaultFiltersFromInProcessScopes(
  activities: AcademicActivityDto[],
  academicYearId: number,
  academicYearLabel: string,
  programCourses: ProgramCourseDto[] = [],
): DefaultDashboardFiltersResult | null {
  const inProcessEntries = listInProcessSemesterFeeScopes(activities, academicYearId);
  if (!inProcessEntries.length) return null;

  const classIds = uniqueIds(inProcessEntries.map((e) => e.scope.class?.id));
  const streamIds = uniqueIds(inProcessEntries.map((e) => e.scope.stream?.id));
  const regulationTypeIds = uniqueIds(inProcessEntries.map((e) => e.activity.regulationType?.id));
  const affiliationIds = uniqueIds(inProcessEntries.map((e) => e.activity.affiliation?.id));
  const courseLevelIds = uniqueIds(inProcessEntries.map((e) => e.activity.courseLevelId));
  const programCourseIds = programCourseIdsForInProcessScopes(inProcessEntries, programCourses);

  const classLabels = [
    ...new Set(inProcessEntries.map((e) => e.scope.class?.name).filter(Boolean) as string[]),
  ];
  const streamLabels = [
    ...new Set(inProcessEntries.map((e) => e.scope.stream?.name).filter(Boolean) as string[]),
  ];
  const regulationLabels = [
    ...new Set(
      inProcessEntries
        .map((e) => e.activity.regulationType?.shortName ?? e.activity.regulationType?.name)
        .filter(Boolean) as string[],
    ),
  ];
  const affiliationLabels = [
    ...new Set(
      inProcessEntries.map((e) => e.activity.affiliation?.name).filter(Boolean) as string[],
    ),
  ];
  const courseLevelLabels = [
    ...new Set(
      courseLevelIds
        .map((id) => {
          const fromProgram = programCourses.find((pc) => pc.courseLevel?.id === id);
          return fromProgram?.courseLevel?.name ?? null;
        })
        .filter(Boolean) as string[],
    ),
  ];
  const programCourseLabels = programCourseIds
    .map((id) => {
      const pc = programCourses.find((row) => row.id === id);
      if (!pc) return null;
      const short = pc.shortName?.trim();
      return short ? `${short} · ${pc.name}` : (pc.name ?? null);
    })
    .filter(Boolean) as string[];

  const filters: FeesDashboardFilters = { academicYearIds: [academicYearId] };
  if (classIds.length) filters.classIds = classIds;
  if (streamIds.length) filters.streamIds = streamIds;
  if (regulationTypeIds.length) filters.regulationTypeIds = regulationTypeIds;
  if (affiliationIds.length) filters.affiliationIds = affiliationIds;
  if (courseLevelIds.length) filters.courseLevelIds = courseLevelIds;
  if (programCourseIds.length) filters.programCourseIds = programCourseIds;

  const labels: FeesDashboardFilterLabels = {
    ...DEFAULT_FILTER_LABELS,
    academicYear: academicYearLabel,
    program: labelForMulti(
      courseLevelLabels,
      `${courseLevelLabels.length} schemes (live scopes)`,
      DEFAULT_FILTER_LABELS.program,
    ),
    programCourse:
      programCourseLabels.length === 1
        ? programCourseLabels[0]!
        : programCourseLabels.length > 1
          ? formatMultiSelectLabel(
              programCourseIds.map(String),
              programCourseIds.map((id) => {
                const pc = programCourses.find((row) => row.id === id);
                const short = pc?.shortName?.trim();
                return {
                  value: String(id),
                  label: short ? `${short} · ${pc?.name}` : (pc?.name ?? String(id)),
                };
              }),
              DEFAULT_FILTER_LABELS.programCourse,
            )
          : DEFAULT_FILTER_LABELS.programCourse,
    semester: labelForMulti(
      classLabels,
      `${classLabels.length} semesters (live scopes)`,
      DEFAULT_FILTER_LABELS.semester,
    ),
    stream: labelForMulti(
      streamLabels,
      `${streamLabels.length} streams (live scopes)`,
      DEFAULT_FILTER_LABELS.stream,
    ),
    regulation: labelForMulti(
      regulationLabels,
      formatMultiSelectLabel(
        regulationTypeIds.map(String),
        regulationTypeIds.map((id, i) => ({
          value: String(id),
          label: regulationLabels[i] ?? String(id),
        })),
        DEFAULT_FILTER_LABELS.regulation,
      ),
      DEFAULT_FILTER_LABELS.regulation,
    ),
    affiliation: labelForMulti(
      affiliationLabels,
      `${affiliationLabels.length} affiliations (live scopes)`,
      DEFAULT_FILTER_LABELS.affiliation,
    ),
  };

  return { filters, labels };
}

/** @deprecated Use deriveDefaultFiltersFromInProcessScopes */
export const deriveDefaultFiltersFromOpenScopes = deriveDefaultFiltersFromInProcessScopes;
