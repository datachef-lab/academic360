import type { AcademicActivityDto } from "@repo/db/dtos/academics";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";
import { SEMESTER_FEE_PAYMENT_MASTER_NAME } from "../data/fees-domain";

export type AcademicActivityScopeDto = NonNullable<AcademicActivityDto["scopes"]>[number];

export type InProcessScopeEntry = {
  activity: AcademicActivityDto;
  scope: AcademicActivityScopeDto;
};

/** Inclusive end instant — midnight end dates count through that calendar day (IST from API). */
export function scopeBoundaryMs(
  value: string | Date | null | undefined,
  boundary: "start" | "end",
): number {
  if (!value) return boundary === "start" ? 0 : Number.POSITIVE_INFINITY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return boundary === "start" ? 0 : Number.POSITIVE_INFINITY;
  }
  if (
    boundary === "end" &&
    d.getHours() === 0 &&
    d.getMinutes() === 0 &&
    d.getSeconds() === 0 &&
    d.getMilliseconds() === 0
  ) {
    d.setHours(23, 59, 59, 999);
  }
  return d.getTime();
}

/** Scope is enabled and current time is within [startDate, endDate] — same as “Live” on academic activity UI. */
export function isScopeInProcess(scope: AcademicActivityScopeDto, at: Date = new Date()): boolean {
  if (!scope.isEnabled) return false;
  const now = at.getTime();
  const start = scopeBoundaryMs(scope.startDate, "start");
  const end = scopeBoundaryMs(scope.endDate, "end");
  return now >= start && now <= end;
}

export function isSemesterFeePaymentActivity(activity: AcademicActivityDto): boolean {
  return (
    Boolean(activity.master?.isActive) &&
    (activity.master?.name || "").trim().toLowerCase() === SEMESTER_FEE_PAYMENT_MASTER_NAME
  );
}

export function listInProcessSemesterFeeScopes(
  activities: AcademicActivityDto[],
  academicYearId?: number,
  at: Date = new Date(),
): InProcessScopeEntry[] {
  return activities
    .filter(isSemesterFeePaymentActivity)
    .filter((activity) =>
      academicYearId != null ? activity.academicYear?.id === academicYearId : true,
    )
    .flatMap((activity) =>
      (activity.scopes ?? [])
        .filter((scope) => isScopeInProcess(scope, at))
        .map((scope) => ({ activity, scope })),
    );
}

/** Program courses that match each in-process scope row (stream + activity dimensions). */
export function programCourseIdsForInProcessScopes(
  entries: InProcessScopeEntry[],
  programCourses: ProgramCourseDto[],
): number[] {
  const ids = new Set<number>();

  for (const { activity, scope } of entries) {
    const streamId = scope.stream?.id;
    if (streamId == null) continue;

    for (const pc of programCourses) {
      if (pc.id == null) continue;
      if (pc.stream?.id !== streamId) continue;
      if (
        activity.regulationType?.id != null &&
        pc.regulationType?.id != null &&
        pc.regulationType.id !== activity.regulationType.id
      ) {
        continue;
      }
      if (
        activity.affiliation?.id != null &&
        pc.affiliation?.id != null &&
        pc.affiliation.id !== activity.affiliation.id
      ) {
        continue;
      }
      if (
        activity.courseLevelId != null &&
        pc.courseLevel?.id != null &&
        pc.courseLevel.id !== activity.courseLevelId
      ) {
        continue;
      }
      ids.add(pc.id);
    }
  }

  return [...ids];
}

export function countInProcessSemesterFeeScopes(
  activities: AcademicActivityDto[],
  academicYearIds?: number[],
): number {
  if (!academicYearIds?.length) {
    return listInProcessSemesterFeeScopes(activities).length;
  }
  return academicYearIds.reduce(
    (sum, ayId) => sum + listInProcessSemesterFeeScopes(activities, ayId).length,
    0,
  );
}
