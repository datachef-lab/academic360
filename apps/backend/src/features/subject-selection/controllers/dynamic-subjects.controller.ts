import { Request, Response } from "express";
import { getDynamicSubjectsForStudent } from "../services/dynamic-subjects.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

/**
 * GET /api/subject-selection/dynamic-subjects/:studentId
 * Fetches dynamic subject data for a student including categories, selections, and mandatory subjects
 */
export async function getDynamicSubjectsHandler(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.studentId);

    if (!studentId || Number.isNaN(studentId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid studentId"));
    }

    console.log(
      `[DYNAMIC-SUBJECTS-CONTROLLER] Fetching dynamic subjects for student ${studentId}`,
    );

    const dynamicSubjects = await getDynamicSubjectsForStudent(studentId);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "OK",
          dynamicSubjects,
          "Dynamic subjects fetched successfully",
        ),
      );
  } catch (error: any) {
    console.error("[DYNAMIC-SUBJECTS-CONTROLLER] Error:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          "INTERNAL_SERVER_ERROR",
          null,
          error?.message || "Failed to fetch dynamic subjects",
        ),
      );
  }
}
