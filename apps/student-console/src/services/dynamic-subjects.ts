import { axiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";

export interface DynamicSubjectCategory {
  id: number;
  name: string;
  code: string;
  sequence: number;
  semesters: {
    [semester: string]: {
      studentSelections: Array<{
        id: number;
        name: string;
        code: string;
        isMandatory: boolean;
      }>;
      mandatorySubjects: Array<{
        id: number;
        name: string;
        code: string;
      }>;
    };
  };
}

export interface DynamicSubjectsResponse {
  categories: DynamicSubjectCategory[];
  hasStudentSelections: boolean;
  totalSelections: number;
}

/**
 * Fetches dynamic subject data for a student
 */
export async function fetchDynamicSubjects(studentId: number): Promise<DynamicSubjectsResponse> {
  try {
    const response = await api.get<ApiResponse<DynamicSubjectsResponse>>(
      `/api/subject-selection/dynamic-subjects/${studentId}`,
    );

    if (response.data.httpStatus !== "OK") {
      throw new Error(response.data.message || "Failed to fetch dynamic subjects");
    }

    return response.data.payload;
  } catch (error) {
    console.error("[DYNAMIC-SUBJECTS] Error fetching dynamic subjects:", error);
    throw error;
  }
}
