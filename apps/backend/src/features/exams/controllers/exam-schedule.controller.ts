import * as XLSX from "xlsx";
import fs from "fs";

import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  allotExamRoomsAndStudents,
  checkDuplicateExam,
  countStudentsByPapers,
  countStudentsByPapersBreakdown,
  createExamAssignment,
  downloadAdmitCardTrackingByExamId,
  downloadAdmitCardsAsZip,
  downloadAttendanceSheetsByExamId,
  downloadExamCandidatesbyExamId,
  downloadSingleAdmitCard,
  findAll,
  findById,
  findByStudentId,
  findExamPapersByExamId,
  findExamsByStudentId,
  getEligibleRooms,
  getExamCandidatesByStudentIdAndExamId,
  getStudentsByPapers,
  sendExamAdmitCardEmails,
  deleteExamByIdIfUpcoming,
  updateExamAdmitCardDates,
  updateExamSubject,
} from "../services/exam-schedule.service.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import { ExamDto } from "@repo/db/dtos/exams";

export const countStudentsForExam = async (req: Request, res: Response) => {
  try {
    const {
      classId,
      programCourseIds,
      paperIds,
      academicYearIds,
      shiftIds,
      gender,
    } = req.body;

    console.log("[EXAM-SCHEDULE-CONTROLLER] Received request:", {
      classId,
      programCourseIds,
      paperIds,
      academicYearIds,
      shiftIds,
      gender,
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

    // Parse Excel file if provided (assuming multer middleware handles file upload and attaches to req.file)
    let excelStudents: { foil_number: string; uid: string }[] = [];
    if (req.file) {
      if (!req.file.mimetype || !req.file.mimetype.includes("spreadsheetml")) {
        console.warn("[EXAM-SCHEDULE-CONTROLLER] Invalid file type for Excel");
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "ERROR",
              null,
              "Invalid file type. Please upload a valid XLSX file.",
            ),
          );
      }

      const buffer = fs.readFileSync(req.file.path);

      const workbook = XLSX.read(buffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No sheets found in Excel file");
      }
      const sheet = workbook.Sheets[sheetName];
      excelStudents = XLSX.utils.sheet_to_json(sheet) as {
        foil_number: string;
        uid: string;
      }[];
    }

    const params = {
      classId: Number(classId),
      programCourseIds: programCourseIds.map((id: unknown) => Number(id)),
      paperIds: paperIds.map((id: unknown) => Number(id)),
      academicYearIds: academicYearIds.map((id: unknown) => Number(id)),
      shiftIds: shiftIds
        ? shiftIds.map((id: unknown) => Number(id))
        : undefined,
      gender,
      excelStudents,
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

export const countStudentsBreakdownForExam = async (
  req: Request,
  res: Response,
) => {
  try {
    // Log the raw body to debug FormData parsing
    console.log(
      "[EXAM-SCHEDULE-CONTROLLER] Raw req.body:",
      JSON.stringify(req.body, null, 2),
    );
    console.log(
      "[EXAM-SCHEDULE-CONTROLLER] req.body keys:",
      Object.keys(req.body || {}),
    );
    console.log(
      "[EXAM-SCHEDULE-CONTROLLER] Content-Type:",
      req.headers["content-type"],
    );

    // Handle both JSON and FormData requests
    // If Content-Type is application/json, body is already parsed
    // If Content-Type is multipart/form-data, multer has parsed it
    const classId = req.body.classId || req.body.classid;
    const paperIds = req.body.paperIds || req.body.paperids || [];
    const academicYearIds =
      req.body.academicYearIds || req.body.academicyearids || [];
    const combinations = req.body.combinations;
    const gender = req.body.gender;

    console.log("[EXAM-SCHEDULE-CONTROLLER] Received breakdown request:", {
      classId,
      paperIds,
      academicYearIds,
      combinations,
      combinationsType: typeof combinations,
      gender,
    });

    // Handle combinations - could be JSON string (from FormData) or array (from JSON body) or undefined
    let parsedCombinations: Array<{
      programCourseId: number;
      shiftId: number;
    }> = [];
    if (combinations !== undefined && combinations !== null) {
      if (typeof combinations === "string") {
        // If it's a JSON string (from FormData), parse it
        try {
          const parsed = JSON.parse(combinations);
          if (Array.isArray(parsed)) {
            parsedCombinations = parsed
              .map((combo: unknown) => {
                if (typeof combo === "object" && combo !== null) {
                  return {
                    programCourseId: Number(
                      (combo as { programCourseId: unknown }).programCourseId,
                    ),
                    shiftId: Number((combo as { shiftId: unknown }).shiftId),
                  };
                }
                return null;
              })
              .filter(
                (
                  combo,
                ): combo is { programCourseId: number; shiftId: number } =>
                  combo !== null,
              );
          }
        } catch (error) {
          console.error(
            "[EXAM-SCHEDULE-CONTROLLER] Error parsing combinations JSON:",
            error,
          );
        }
      } else if (Array.isArray(combinations)) {
        // If it's already an array (from JSON body)
        parsedCombinations = combinations
          .map((combo: unknown) => {
            if (typeof combo === "object" && combo !== null) {
              return {
                programCourseId: Number(
                  (combo as { programCourseId: unknown }).programCourseId,
                ),
                shiftId: Number((combo as { shiftId: unknown }).shiftId),
              };
            }
            return null;
          })
          .filter(
            (combo): combo is { programCourseId: number; shiftId: number } =>
              combo !== null,
          );
      }
    }

    // Validate required fields
    if (
      !classId ||
      !Array.isArray(paperIds) ||
      !Array.isArray(academicYearIds) ||
      parsedCombinations.length === 0
    ) {
      console.warn("[EXAM-SCHEDULE-CONTROLLER] Missing required fields:", {
        hasClassId: !!classId,
        isPaperIdsArray: Array.isArray(paperIds),
        isAcademicYearIdsArray: Array.isArray(academicYearIds),
        combinationsLength: parsedCombinations.length,
        rawCombinations: combinations,
      });
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "Missing required fields: classId, paperIds, academicYearIds, combinations",
          ),
        );
    }

    if (
      paperIds.length === 0 ||
      academicYearIds.length === 0 ||
      parsedCombinations.length === 0
    ) {
      console.log(
        "[EXAM-SCHEDULE-CONTROLLER] Empty arrays, returning empty breakdown",
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            { breakdown: [], total: 0 },
            "No students found",
          ),
        );
    }

    // Parse Excel file if provided
    let excelStudents: { foil_number: string; uid: string }[] = [];
    if (req.file) {
      if (!req.file.mimetype || !req.file.mimetype.includes("spreadsheetml")) {
        console.warn("[EXAM-SCHEDULE-CONTROLLER] Invalid file type for Excel");
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "ERROR",
              null,
              "Invalid file type. Please upload a valid XLSX file.",
            ),
          );
      }

      const buffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No sheets found in Excel file");
      }
      const sheet = workbook.Sheets[sheetName];
      excelStudents = XLSX.utils.sheet_to_json(sheet) as {
        foil_number: string;
        uid: string;
      }[];
    }

    const params = {
      classId: Number(classId),
      paperIds: paperIds.map((id: unknown) => Number(id)),
      academicYearIds: academicYearIds.map((id: unknown) => Number(id)),
      combinations: parsedCombinations,
      gender: gender || null,
      excelStudents,
    };

    console.log("[EXAM-SCHEDULE-CONTROLLER] Parsed params:", {
      ...params,
      combinationsCount: params.combinations.length,
      excelStudentsCount: params.excelStudents.length,
    });

    console.log(
      "[EXAM-SCHEDULE-CONTROLLER] Calling breakdown service with params:",
      params,
    );

    const result = await countStudentsByPapersBreakdown(params);

    console.log(
      "[EXAM-SCHEDULE-CONTROLLER] Service returned breakdown:",
      result,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Student count breakdown calculated successfully",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[EXAM-SCHEDULE-CONTROLLER] Error counting students breakdown:",
      error,
    );
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
      gender,
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

    // Parse Excel file if provided (assuming multer middleware handles file upload and attaches to req.file)
    let excelStudents: { foil_number: string; uid: string }[] = [];
    if (req.file) {
      if (!req.file.mimetype || !req.file.mimetype.includes("spreadsheetml")) {
        console.warn("[EXAM-SCHEDULE-CONTROLLER] Invalid file type for Excel");
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "ERROR",
              null,
              "Invalid file type. Please upload a valid XLSX file.",
            ),
          );
      }

      const buffer = fs.readFileSync(req.file.path);

      const workbook = XLSX.read(buffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No sheets found in Excel file");
      }
      const sheet = workbook.Sheets[sheetName];
      excelStudents = XLSX.utils.sheet_to_json(sheet) as {
        foil_number: string;
        uid: string;
      }[];
    }

    const params = {
      classId: Number(classId),
      programCourseIds: programCourseIds.map((id: unknown) => Number(id)),
      paperIds: paperIds.map((id: unknown) => Number(id)),
      academicYearIds: academicYearIds.map((id: unknown) => Number(id)),
      shiftIds: shiftIds
        ? shiftIds.map((id: unknown) => Number(id))
        : undefined,
      assignBy: assignBy as "CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER",
      gender,
      excelStudents,
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

export const updateExamSubjectHandler = async (req: Request, res: Response) => {
  try {
    const examSubject = await updateExamSubject(req.body.id, req.body);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          examSubject,
          "Updated exam-subject successfully",
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

    // Parse Excel file if provided (assuming multer middleware handles file upload and attaches to req.file)
    let excelStudents: { foil_number: string; uid: string }[] = [];
    if (req.file) {
      if (!req.file.mimetype || !req.file.mimetype.includes("spreadsheetml")) {
        console.warn("[EXAM-SCHEDULE-CONTROLLER] Invalid file type for Excel");
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "ERROR",
              null,
              "Invalid file type. Please upload a valid XLSX file.",
            ),
          );
      }

      const buffer = fs.readFileSync(req.file.path);

      const workbook = XLSX.read(buffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No sheets found in Excel file");
      }
      const sheet = workbook.Sheets[sheetName];
      excelStudents = XLSX.utils.sheet_to_json(sheet) as {
        foil_number: string;
        uid: string;
      }[];
    }

    const dto =
      typeof req.body.dto === "string"
        ? JSON.parse(req.body.dto)
        : req.body.dto;

    const userId = (req as any)?.user?.id as number | undefined;

    const students = await createExamAssignment(dto, excelStudents, userId);

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

export const downloadAdmitCardsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  console.log("[ADMIT-CARD-DOWNLOAD] Route hit", {
    path: req.path,
    query: req.query,
  });
  try {
    const { examId, uploadSessionId } = req.query;

    if (!examId) {
      res.status(400).json(new ApiError(400, "examId is required"));
      return;
    }

    const examIdNum = Number(examId);

    if (isNaN(examIdNum)) {
      res.status(400).json(new ApiError(400, "Invalid examId"));
      return;
    }

    console.info(`[ADMIT-CARD-DOWNLOAD] Starting download`, {
      examIdNum,
      uploadSessionId,
    });

    const result = await downloadAdmitCardsAsZip(
      examIdNum,
      (req as any)?.user!.id as number,
      uploadSessionId as string | undefined,
    );

    if (result.admitCardCount === 0) {
      console.warn(
        `[ADMIT-CARD-DOWNLOAD] No admit cards found for examId: ${examIdNum}`,
      );
      res
        .status(404)
        .json(new ApiError(404, "No admit cards found for this exam"));
      return;
    }

    // Ensure zipBuffer is a proper Buffer
    const zipBuffer = Buffer.isBuffer(result.zipBuffer)
      ? result.zipBuffer
      : Buffer.from(result.zipBuffer);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", zipBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam-${examId}-subject-admit-cards.zip"`,
    );

    res.send(zipBuffer);
  } catch (error) {
    console.error("[ADMIT-CARD-DOWNLOAD] Error:", error);
    handleError(error, res, next);
  }
};

export const downloadAttendanceSheetsByExamIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  console.log(req.query);
  try {
    const { examId, uploadSessionId } = req.query;

    if (!examId) {
      res
        .status(400)
        .json(new ApiError(400, "examId and examSubjectId are required"));
      return;
    }

    const examIdNum = Number(examId);

    if (isNaN(examIdNum)) {
      res.status(400).json(new ApiError(400, "Invalid examId"));
      return;
    }

    console.info(`[ATTENDANCE_SHEETS-DOWNLOAD] Starting download`, {
      examIdNum,
    });

    const result = await downloadAttendanceSheetsByExamId(
      examIdNum,
      (req as any)?.user!.id as number,
      uploadSessionId as string | undefined,
    );

    if (result.roomCount === 0) {
      res
        .status(404)
        .json(
          new ApiError(
            404,
            "No attendance sheets found for this exam. Students must be assigned to exam rooms before attendance sheets can be generated.",
          ),
        );
      return;
    }

    // Ensure zipBuffer is a proper Buffer
    const zipBuffer = Buffer.isBuffer(result.zipBuffer)
      ? result.zipBuffer
      : Buffer.from(result.zipBuffer);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", zipBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam-${examId}-attendance-dr-sheets.zip"`,
    );

    res.send(zipBuffer);
  } catch (error) {
    console.error("[ATTENDANCE_SHEETS-DOWNLOAD] Error:", error);
    handleError(error, res, next);
  }
};

export const downloadExamCandidatesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { examId } = req.query;

    if (!examId) {
      res.status(400).json(new ApiError(400, "examId is required"));
      return;
    }

    const examIdNum = Number(examId);
    if (isNaN(examIdNum)) {
      res.status(400).json(new ApiError(400, "Invalid examId"));
      return;
    }

    console.info("[EXAM-CANDIDATE-DOWNLOAD] Starting Excel download", {
      examId: examIdNum,
    });

    const excelBuffer = await downloadExamCandidatesbyExamId(examIdNum);

    // Ensure excelBuffer is a Buffer
    const buffer = Buffer.isBuffer(excelBuffer)
      ? excelBuffer
      : Buffer.from(excelBuffer as ArrayBuffer);

    // ✅ IMPORTANT HEADERS
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam-${examIdNum}-candidates.xlsx"`,
    );

    // 🚀 Send buffer
    res.send(buffer);
  } catch (error) {
    console.error("[EXAM-CANDIDATE-DOWNLOAD] Error:", error);
    // Don't call handleError if headers were already sent
    if (res.headersSent) {
      return next(error);
    }
    handleError(error, res, next);
  }
};

export const updateExamAdmitCardDatesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { examId } = req.params;
    const { admitCardStartDownloadDate, admitCardLastDownloadDate } = req.body;
    const userId = (req as any)?.user?.id as number | undefined;

    if (!examId) {
      res.status(400).json(new ApiError(400, "examId is required"));
      return;
    }

    const examIdNum = Number(examId);
    if (isNaN(examIdNum)) {
      res.status(400).json(new ApiError(400, "Invalid examId"));
      return;
    }

    console.info("[UPDATE-EXAM-ADMIT-CARD-DATES] Updating dates", {
      examId: examIdNum,
      admitCardStartDownloadDate,
      admitCardLastDownloadDate,
      userId,
    });

    const updatedExam = await updateExamAdmitCardDates(
      examIdNum,
      admitCardStartDownloadDate || null,
      admitCardLastDownloadDate || null,
      userId,
    );

    if (!updatedExam) {
      res.status(404).json(new ApiError(404, "Exam not found"));
      return;
    }

    res.json(
      new ApiResponse(
        200,
        "SUCCESS",
        updatedExam,
        "Admit card dates updated successfully",
      ),
    );
  } catch (error) {
    console.error("[UPDATE-EXAM-ADMIT-CARD-DATES] Error:", error);
    handleError(error, res, next);
  }
};

export const downloadAdmitCardTrackingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { examId } = req.query;

    if (!examId) {
      res.status(400).json(new ApiError(400, "examId is required"));
      return;
    }

    const examIdNum = Number(examId);
    if (isNaN(examIdNum)) {
      res.status(400).json(new ApiError(400, "Invalid examId"));
      return;
    }

    console.info("[ADMIT-CARD-TRACKING-DOWNLOAD] Starting Excel download", {
      examId: examIdNum,
    });

    const excelBuffer = await downloadAdmitCardTrackingByExamId(examIdNum);

    // ✅ IMPORTANT HEADERS
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam-${examIdNum}-admit-card-tracking.xlsx"`,
    );

    // 🚀 Send buffer
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error("[ADMIT-CARD-TRACKING-DOWNLOAD] Error:", error);
    handleError(error, res, next);
  }
};

export const triggerExamCandidatesEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { examId, uploadSessionId } = req.query;

    if (!examId) {
      res.status(400).json(new ApiError(400, "examId is required"));
      return;
    }

    const examIdNum = Number(examId);
    if (isNaN(examIdNum)) {
      res.status(400).json(new ApiError(400, "Invalid examId"));
      return;
    }

    console.info("[EXAM-ADMIT-CARD-EMAIL] Starting email send", {
      examId: examIdNum,
      uploadSessionId,
    });

    await sendExamAdmitCardEmails(
      examIdNum,
      (req as any)?.user.id,
      uploadSessionId! as string,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "OK",
          true,
          `Admit Card sent successfully to the students for the given exam id: ${examId}`,
        ),
      );
  } catch (error) {
    console.error("[EXAM-ADMIT-CARD-EMAIL] Error:", error);
    handleError(error, res, next);
  }
};

export const downloadSingleAdmitCardController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { examId, studentId } = req.query;

    if (!examId || !studentId) {
      res
        .status(400)
        .json(new ApiError(400, "examId and studentId are required"));
      return;
    }

    const examIdNum = Number(examId);
    const studentIdNum = Number(studentId);

    if (isNaN(examIdNum) || isNaN(studentIdNum)) {
      res.status(400).json(new ApiError(400, "Invalid examId or studentId"));
      return;
    }

    const pdfBuffer = await downloadSingleAdmitCard(examIdNum, studentIdNum);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="admit-card-${studentIdNum}.pdf"`,
    );

    res.send(pdfBuffer);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getExamsByStudentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { page = "1", pageSize = "10" } = req.query;

    if (!studentId) {
      res.status(400).json(new ApiError(400, "studentId is required"));
      return;
    }

    const studentIdNum = Number(studentId);
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);

    if (isNaN(studentIdNum) || isNaN(pageNum) || isNaN(pageSizeNum)) {
      res
        .status(400)
        .json(new ApiError(400, "Invalid studentId, page or pageSize"));
      return;
    }

    const result = await findExamsByStudentId(
      studentIdNum,
      pageNum,
      pageSizeNum,
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Exams fetched successfully"),
      );
  } catch (error) {
    console.error("[GET-STUDENT-EXAMS] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamCandiatesByStudentIdAndExamIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId, examId } = req.query;

    console.log(req.query);

    if (!studentId || !examId) {
      res
        .status(400)
        .json(new ApiError(400, "studentId and examId both are required"));
      return;
    }

    const studentIdNum = Number(studentId);
    const examIdNum = Number(examId);

    if (isNaN(studentIdNum) || isNaN(examIdNum)) {
      res
        .status(400)
        .json(new ApiError(400, "Invalid studentId, page or pageSize"));
      return;
    }

    const result = await getExamCandidatesByStudentIdAndExamId(
      studentIdNum,
      examIdNum,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Exams Candidates fetched successfully",
        ),
      );
  } catch (error) {
    console.error("[GET-STUDENT-EXAMS] Error:", error);
    handleError(error, res, next);
  }
};

export const getAllExamsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      page = "1",
      pageSize = "10",
      examTypeId,
      classId,
      academicYearId,
      affiliationId,
      regulationTypeId,
      dateFrom,
      dateTo,
      status,
    } = req.query;

    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);

    if (isNaN(pageNum) || isNaN(pageSizeNum)) {
      res.status(400).json(new ApiError(400, "Invalid page or pageSize"));
      return;
    }

    // Parse filters
    const filters = {
      examTypeId: examTypeId ? Number(examTypeId) : null,
      classId: classId ? Number(classId) : null,
      academicYearId: academicYearId ? Number(academicYearId) : null,
      affiliationId: affiliationId ? Number(affiliationId) : null,
      regulationTypeId: regulationTypeId ? Number(regulationTypeId) : null,
      dateFrom: dateFrom ? String(dateFrom) : null,
      dateTo: dateTo ? String(dateTo) : null,
      status:
        status && ["upcoming", "recent", "previous"].includes(String(status))
          ? (String(status) as "upcoming" | "recent" | "previous")
          : null,
    };

    const result = await findAll(pageNum, pageSizeNum, filters);

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Exams fetched successfully"),
      );
  } catch (error) {
    console.error("[GET-ALL-EXAMS] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    console.log("in getExamByIdController()", id);
    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid exam id"));
      return;
    }

    const result = await findById(id);

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Exams fetched successfully"),
      );
  } catch (error) {
    console.error("[GET-STUDENT-EXAMS] Error:", error);
    handleError(error, res, next);
  }
};

/**
 * Delete an exam (and related rows) if the exam has not started yet.
 *
 * Rule: deletion allowed only if earliest exam_subjects.startTime > now.
 */
export const deleteExamByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid exam id"));
      return;
    }

    const userId = (req as any)?.user?.id as number | undefined;
    const result = await deleteExamByIdIfUpcoming(id, userId);

    if (result === null) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Exam not found."));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          { examId: result.deletedExamId },
          "Exam deleted successfully",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (
      message.toLowerCase().includes("cannot be deleted") ||
      message.toLowerCase().includes("deletion is allowed")
    ) {
      res.status(400).json(new ApiResponse(400, "ERROR", null, message));
      return;
    }
    console.error("[DELETE-EXAM] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamsByStudentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    console.log("in getExamsByStudentIdController()");
    if (isNaN(studentId)) {
      res.status(400).json(new ApiError(400, "Invalid exam id"));
      return;
    }

    const result = await findByStudentId(studentId);

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Exams fetched successfully"),
      );
  } catch (error) {
    console.error("[GET-STUDENT-EXAMS] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamPapersByExamIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    console.log("in getExamPapersByExamIdController()");

    if (isNaN(id)) {
      res.status(400).json(new ApiError(400, "Invalid exam id"));
      return;
    }

    const result = await findExamPapersByExamId(id);

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Exams fetched successfully"),
      );
  } catch (error) {
    console.error("[GET-STUDENT-EXAMS] Error:", error);
    handleError(error, res, next);
  }
};

/**
 * Check if an exam with the same configuration already exists
 */
export const checkDuplicateExamController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = req.body as ExamDto;
    const result = await checkDuplicateExam(dto);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          result.isDuplicate
            ? "Duplicate exam found"
            : "No duplicate exam found",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CHECK-DUPLICATE-EXAM] Error:", error);
    return res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

/**
 * Get eligible rooms based on exam schedule (date and time)
 */
export const getEligibleRoomsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { examSubjects } = req.body as {
      examSubjects: Array<{
        subjectId: number;
        startTime: string | Date;
        endTime: string | Date;
      }>;
    };

    if (!examSubjects || !Array.isArray(examSubjects)) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "examSubjects array is required"),
        );
    }

    const eligibleRooms = await getEligibleRooms(examSubjects);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { rooms: eligibleRooms },
          "Eligible rooms fetched successfully",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[GET-ELIGIBLE-ROOMS] Error:", error);
    return res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};

/**
 * Allot rooms and students to an existing exam
 */
export const allotExamRoomsAndStudentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { examId } = req.params;

    // Parse locations from FormData (it comes as JSON string)
    let locations: any;
    if (typeof req.body.locations === "string") {
      try {
        locations = JSON.parse(req.body.locations);
      } catch (e) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "ERROR",
              null,
              "Invalid locations format. Expected JSON array.",
            ),
          );
      }
    } else {
      locations = req.body.locations;
    }

    const orderType = req.body.orderType;
    // Handle gender - convert empty string to null
    const gender =
      req.body.gender === "" || req.body.gender === undefined
        ? null
        : req.body.gender;
    // Handle admit card dates - convert empty string to null
    const admitCardStartDownloadDate =
      req.body.admitCardStartDownloadDate === "" ||
      req.body.admitCardStartDownloadDate === undefined
        ? null
        : req.body.admitCardStartDownloadDate;
    const admitCardLastDownloadDate =
      req.body.admitCardLastDownloadDate === "" ||
      req.body.admitCardLastDownloadDate === undefined
        ? null
        : req.body.admitCardLastDownloadDate;

    if (!examId) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "examId is required"));
    }

    const examIdNum = Number(examId);
    if (isNaN(examIdNum)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid examId"));
    }

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "locations array is required and must not be empty",
          ),
        );
    }

    if (!orderType) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "orderType is required"));
    }

    // Parse Excel file if provided
    let excelStudents: { foil_number: string; uid: string }[] = [];
    if (req.file) {
      if (!req.file.mimetype || !req.file.mimetype.includes("spreadsheetml")) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "ERROR",
              null,
              "Invalid file type. Please upload a valid XLSX file.",
            ),
          );
      }

      const buffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No sheets found in Excel file");
      }
      const sheet = workbook.Sheets[sheetName];
      excelStudents = XLSX.utils.sheet_to_json(sheet) as {
        foil_number: string;
        uid: string;
      }[];
    }

    const userId = (req as any)?.user?.id as number | undefined;

    const result = await allotExamRoomsAndStudents(
      examIdNum,
      {
        locations,
        orderType: orderType as
          | "CU_ROLL_NUMBER"
          | "UID"
          | "CU_REGISTRATION_NUMBER",
        gender: gender || null,
        admitCardStartDownloadDate: admitCardStartDownloadDate || null,
        admitCardLastDownloadDate: admitCardLastDownloadDate || null,
      },
      excelStudents,
      userId,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Rooms and students allotted successfully",
        ),
      );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ALLOT-EXAM] Error:", error);
    return res.status(500).json(new ApiResponse(500, "ERROR", null, message));
  }
};
