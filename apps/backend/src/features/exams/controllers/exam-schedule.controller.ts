import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  countStudentsByPapers,
  createExamAssignment,
  getStudentsByPapers,
} from "../services/exam-schedule.service.js";

export const countStudentsForExam = async (req: Request, res: Response) => {
  try {
    const { classId, programCourseIds, paperIds, academicYearIds, shiftIds } =
      req.body;

    console.log("[EXAM-SCHEDULE-CONTROLLER] Received request:", {
      classId,
      programCourseIds,
      paperIds,
      academicYearIds,
      shiftIds,
    });

    if (
      !classId ||
      !Array.isArray(programCourseIds) ||
      !Array.isArray(paperIds) ||
      !Array.isArray(academicYearIds)
    ) {
      console.warn("[EXAM-SCHEDULE-CONTROLLER] Missing required fields");
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "Missing required fields: classId, programCourseIds, paperIds, academicYearIds",
          ),
        );
    }

    if (
      programCourseIds.length === 0 ||
      paperIds.length === 0 ||
      academicYearIds.length === 0
    ) {
      console.log("[EXAM-SCHEDULE-CONTROLLER] Empty arrays, returning 0");
      return res
        .status(200)
        .json(
          new ApiResponse(200, "SUCCESS", { count: 0 }, "No students found"),
        );
    }

    const params = {
      classId: Number(classId),
      programCourseIds: programCourseIds.map((id: unknown) => Number(id)),
      paperIds: paperIds.map((id: unknown) => Number(id)),
      academicYearIds: academicYearIds.map((id: unknown) => Number(id)),
      shiftIds: shiftIds
        ? shiftIds.map((id: unknown) => Number(id))
        : undefined,
    };

    console.log(
      "[EXAM-SCHEDULE-CONTROLLER] Calling service with params:",
      params,
    );

    const count = await countStudentsByPapers(params);

    console.log("[EXAM-SCHEDULE-CONTROLLER] Service returned count:", count);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { count },
          "Student count calculated successfully",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[EXAM-SCHEDULE-CONTROLLER] Error counting students:", error);
    return res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const getStudentsForExam = async (req: Request, res: Response) => {
  try {
    const {
      classId,
      programCourseIds,
      paperIds,
      academicYearIds,
      shiftIds,
      assignBy,
      roomAssignments,
    } = req.body;

    console.log("[EXAM-SCHEDULE-CONTROLLER] Received get students request:", {
      classId,
      programCourseIds,
      paperIds,
      academicYearIds,
      shiftIds,
      assignBy,
      roomAssignmentsCount: roomAssignments?.length,
    });

    if (
      !classId ||
      !Array.isArray(programCourseIds) ||
      !Array.isArray(paperIds) ||
      !Array.isArray(academicYearIds) ||
      !assignBy ||
      !Array.isArray(roomAssignments)
    ) {
      console.warn("[EXAM-SCHEDULE-CONTROLLER] Missing required fields");
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "Missing required fields: classId, programCourseIds, paperIds, academicYearIds, assignBy, roomAssignments",
          ),
        );
    }

    if (
      programCourseIds.length === 0 ||
      paperIds.length === 0 ||
      academicYearIds.length === 0 ||
      roomAssignments.length === 0
    ) {
      console.log(
        "[EXAM-SCHEDULE-CONTROLLER] Empty arrays, returning empty array",
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            { students: [] },
            "No students found",
          ),
        );
    }

    const params = {
      classId: Number(classId),
      programCourseIds: programCourseIds.map((id: unknown) => Number(id)),
      paperIds: paperIds.map((id: unknown) => Number(id)),
      academicYearIds: academicYearIds.map((id: unknown) => Number(id)),
      shiftIds: shiftIds
        ? shiftIds.map((id: unknown) => Number(id))
        : undefined,
      assignBy: assignBy as "UID" | "CU Reg. No.",
    };

    const students = await getStudentsByPapers(params, roomAssignments);

    console.log(
      "[EXAM-SCHEDULE-CONTROLLER] Service returned students:",
      students.length,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { students },
          "Students fetched successfully",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[EXAM-SCHEDULE-CONTROLLER] Error fetching students:", error);
    return res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

export const createExamAssignmenthandler = async (
  req: Request,
  res: Response,
) => {
  try {
    // console.log("[EXAM-SCHEDULE-CONTROLLER] Received get students request:", {
    //   classId,
    //   programCourseIds,
    //   paperIds,
    //   academicYearIds,
    //   shiftIds,
    //   assignBy,
    //   roomAssignmentsCount: roomAssignments?.length,
    // });

    // if (
    //   !classId ||
    //   !Array.isArray(programCourseIds) ||
    //   !Array.isArray(paperIds) ||
    //   !Array.isArray(academicYearIds) ||
    //   !assignBy ||
    //   !Array.isArray(roomAssignments)
    // ) {
    //   console.warn("[EXAM-SCHEDULE-CONTROLLER] Missing required fields");
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(
    //         400,
    //         "ERROR",
    //         null,
    //         "Missing required fields: classId, programCourseIds, paperIds, academicYearIds, assignBy, roomAssignments",
    //       ),
    //     );
    // }

    // if (
    //   programCourseIds.length === 0 ||
    //   paperIds.length === 0 ||
    //   academicYearIds.length === 0 ||
    //   roomAssignments.length === 0
    // ) {
    //   console.log(
    //     "[EXAM-SCHEDULE-CONTROLLER] Empty arrays, returning empty array",
    //   );
    //   return res
    //     .status(200)
    //     .json(
    //       new ApiResponse(
    //         200,
    //         "SUCCESS",
    //         { students: [] },
    //         "No students found",
    //       ),
    //     );
    // }

    // const params = {
    //   classId: Number(classId),
    //   programCourseIds: programCourseIds.map((id: unknown) => Number(id)),
    //   paperIds: paperIds.map((id: unknown) => Number(id)),
    //   academicYearIds: academicYearIds.map((id: unknown) => Number(id)),
    //   shiftIds: shiftIds
    //     ? shiftIds.map((id: unknown) => Number(id))
    //     : undefined,
    //   assignBy: assignBy as "UID" | "CU Reg. No.",
    // };

    const students = await createExamAssignment(req.body);

    // console.log(
    //     "[EXAM-SCHEDULE-CONTROLLER] Service returned students:",
    //     students.length,
    // );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { students },
          "Students fetched successfully",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[EXAM-SCHEDULE-CONTROLLER] Error fetching students:", error);
    return res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};
