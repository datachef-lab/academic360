import type { StudentDto } from "@repo/db/dtos/user";
import { axiosInstance } from "@/lib/utils";

/**
 * Academic-activity gating for the student console.
 *
 * An activity is identified by its master's `name` (lowercased + trimmed) —
 * there is no `key` column on the master, so consumers match string literals
 * such as "subject selection" / "cu registration" / "exam form upload".
 *
 * Resolution is fail-closed: a feature stays hidden until an activity with a
 * matching, enabled, in-window scope exists for the student's academic year,
 * class and stream.
 */

export type AcademicActivityScopeDto = {
  stream: { id: number };
  class: { id: number };
  startDate: string | null;
  endDate: string | null;
  isEnabled: boolean;
};

export type AcademicActivityDto = {
  master: { isActive: boolean; name: string };
  academicYear: { id: number };
  courseLevelId?: number | null;
  scopes: AcademicActivityScopeDto[];
};

export type StudentActivityContext = {
  classId?: number;
  academicYearId?: number;
  /** null when the student's stream is unknown → the stream check is skipped. */
  streamId?: number | null;
};

/** Pulls the class / academic-year / stream a gate is resolved against. */
export function getStudentActivityContext(
  student: StudentDto | null | undefined,
): StudentActivityContext {
  const promotion = student?.currentPromotion;
  return {
    classId: promotion?.class?.id,
    academicYearId: promotion?.session?.academicYearId ?? undefined,
    streamId: student?.programCourse?.stream?.id ?? null,
  };
}

export async function fetchAcademicActivities(): Promise<AcademicActivityDto[]> {
  const { data } = await axiosInstance.get<{ payload: AcademicActivityDto[] }>(
    "/api/academics/academic-activities",
  );
  return Array.isArray(data?.payload) ? data.payload : [];
}

/**
 * True when `activityName` (already lowercased) is open right now for this
 * student. Any single matching scope opens the gate (pure OR).
 */
export function isActivityLive(
  activities: AcademicActivityDto[],
  activityName: string,
  { classId, academicYearId, streamId }: StudentActivityContext,
  now: number = Date.now(),
): boolean {
  const matched = activities.filter(
    (a) => a.master?.isActive && (a.master?.name ?? "").trim().toLowerCase() === activityName,
  );
  if (!matched.length || !classId || !academicYearId) return false;
  return matched.some((activity) => {
    if (activity.academicYear.id !== academicYearId) return false;
    return activity.scopes.some((scope) => {
      if (!scope.isEnabled) return false;
      if (scope.class.id !== classId) return false;
      if (streamId != null && scope.stream.id !== streamId) return false;
      const start = scope.startDate ? new Date(scope.startDate).getTime() : 0;
      const end = scope.endDate ? new Date(scope.endDate).getTime() : Infinity;
      return now >= start && now <= end;
    });
  });
}
