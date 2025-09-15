import { Request, Response } from "express";
import { findSubjectsSelections } from "../services/student-subjects.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export async function getStudentSubjectSelections(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.studentId);
    if (!studentId || Number.isNaN(studentId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid studentId"));
    }

    const selections = await findSubjectsSelections(studentId);
    return res
      .status(200)
      .json(
        new ApiResponse(200, "OK", selections, "Fetched subject selections"),
      );
  } catch (error: any) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          "INTERNAL_SERVER_ERROR",
          null,
          error?.message || "Failed to fetch subject selections",
        ),
      );
  }
}
