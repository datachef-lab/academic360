import * as XLSX from "xlsx";
import fs from "fs";

import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  allotExamRoomsAndStudents,
  checkDuplicateExam,
  countStudentsByPapers,
  createExamAssignment,
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

    const students = await createExamAssignment(dto, excelStudents);

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
      res
        .status(400)
        .json(new ApiError(400, "Invalid examId or examSubjectId"));
      return;
    }

    console.info(`[ADMIT-CARD-DOWNLOAD] Starting download`, { examIdNum });

    const result = await downloadAdmitCardsAsZip(
      examIdNum,
      (req as any)?.user!.id as number,
      uploadSessionId as string | undefined,
    );

    if (result.admitCardCount === 0) {
      res.status(404).json(new ApiError(404, "No admit cards found"));
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam-${examId}-subject-admit-cards.zip"`,
    );

    res.send(result.zipBuffer);
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
      res.status(404).json(new ApiError(404, "No attendance dr sheet found"));
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam-${examId}-attendance-dr-sheets.zip"`,
    );

    res.send(result.zipBuffer);
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
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error("[EXAM-CANDIDATE-DOWNLOAD] Error:", error);
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

    console.info("[EXAM-CANDIDATE-DOWNLOAD] Starting Excel download", {
      examId: examIdNum,
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
    console.error("[EXAM-CANDIDATE-DOWNLOAD] Error:", error);
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
    const { page = "1", pageSize = "10" } = req.query;

    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);

    if (isNaN(pageNum) || isNaN(pageSizeNum)) {
      res
        .status(400)
        .json(new ApiError(400, "Invalid studentId, page or pageSize"));
      return;
    }

    const result = await findAll(pageNum, pageSizeNum);

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

    const result = await allotExamRoomsAndStudents(
      examIdNum,
      {
        locations,
        orderType: orderType as
          | "CU_ROLL_NUMBER"
          | "UID"
          | "CU_REGISTRATION_NUMBER",
        gender: gender || null,
      },
      excelStudents,
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
