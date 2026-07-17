import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export type AcademicActivityScope = {
  id: number;
  stream: { id: number; name: string };
  class: { id: number; name: string; sequence?: number | null };
  startDate: string | null;
  endDate: string | null;
  isEnabled: boolean;
};

export type AcademicActivity = {
  id: number;
  audience: "STUDENT" | "STAFF" | "ALL";
  master: { id: number; name: string; type: string; isActive: boolean };
  academicYear: { id: number; year: string };
  affiliation: { id: number; name: string };
  regulationType: { id: number; name: string };
  courseLevelId?: number | null;
  appearType: { id: number; name: string } | null;
  scopes: AcademicActivityScope[];
};

/** Name of the activity master that opens/closes the semester fee window. */
const SEMESTER_FEE_PAYMENT = "semester fee payment";

/** The live "Semester Fee Payment" windows. Mirrors the student-console web app,
 * which gates which fee cards a student may see on these. */
export async function fetchSemesterFeeActivities(): Promise<AcademicActivity[]> {
  const { data } = await axiosInstance.get<ApiResponse<AcademicActivity[]>>(
    "/api/academics/academic-activities",
  );
  const activities = Array.isArray(data?.payload) ? data.payload : [];
  return activities.filter(
    (a) =>
      a.master?.isActive && (a.master?.name || "").trim().toLowerCase() === SEMESTER_FEE_PAYMENT,
  );
}
