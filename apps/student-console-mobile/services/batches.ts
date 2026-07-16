import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

interface Paginated<T> {
  content: T[];
}

interface BatchStudentMapping {
  batch?: { classId?: number | null } | null;
}

/** Distinct class (semester) ids the student is actually enrolled in, from their
 * batch-student mappings. Used to scope papers to the student's real semesters. */
export async function fetchStudentClassIds(studentId: number): Promise<number[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<Paginated<BatchStudentMapping>>>(
      `/api/academics/batch-student-mappings/student/${studentId}`,
      { params: { page: 1, pageSize: 100 } },
    );
    const content = res.data.payload?.content ?? [];
    const ids = new Set<number>();
    for (const m of content) {
      const cid = m.batch?.classId;
      if (typeof cid === "number") ids.add(cid);
    }
    return Array.from(ids);
  } catch {
    return [];
  }
}
