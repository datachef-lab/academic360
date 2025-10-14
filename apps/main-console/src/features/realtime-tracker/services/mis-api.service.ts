import api from "@/utils/api";
import { MisTableData, MisFilters } from "../types/mis-types";

export class MisApiService {
  private static baseUrl = "/api/subject-selection/student-subject-selection/metrics/table";

  /**
   * Fetch MIS table data with optional filters
   */
  static async getMisTableData(filters: MisFilters = {}): Promise<MisTableData> {
    try {
      const params = new URLSearchParams();

      if (filters.sessionId) {
        params.append("sessionId", filters.sessionId.toString());
      }

      if (filters.classId) {
        params.append("classId", filters.classId.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const response = await api.get(url);

      if (response.data?.httpStatusCode === 200 && response.data?.payload) {
        return response.data.payload;
      }

      throw new Error(response.data?.message || "Failed to fetch MIS data");
    } catch (error) {
      console.error("[MisApiService] Error fetching MIS data:", error);
      throw error;
    }
  }

  /**
   * Calculate statistics from MIS data
   */
  static calculateStats(data: MisTableData) {
    const totalRow = data.data.find((row) => row.programCourseName === "Total");

    if (!totalRow) {
      return {
        totalAdmitted: 0,
        totalSubjectSelectionDone: 0,
        completionPercentage: 0,
        lastUpdated: data.updatedAt,
      };
    }

    const completionPercentage =
      totalRow.admitted > 0 ? Math.round((totalRow.subjectSelectionDone / totalRow.admitted) * 100) : 0;

    return {
      totalAdmitted: totalRow.admitted,
      totalSubjectSelectionDone: totalRow.subjectSelectionDone,
      completionPercentage,
      lastUpdated: data.updatedAt,
    };
  }
}
