/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { NextFunction, Request, Response } from "express";
import {
  processStudentsFromExcelBuffer,
  precheckStudentsFromExcelBuffer,
  backfillStudentQuotaTypes,
} from "../services/refactor-old-migration.service.js";
// import { addStudent, findAllStudent, findStudentById, removeStudent, saveStudent, searchStudent, searchStudentsByRollNumber, findFilteredStudents } from "@/features/user/services/student.service.js";
import { StudentType } from "@/types/user/student.js";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { boolean } from "drizzle-orm/mysql-core";

import * as studentService from "@/features/user/services/student.service.js";
import {
  updateFamilyMemberTitles,
  bulkUpdateFamilyMemberTitles,
} from "../services/student.service.js";
import { readExcelFromBuffer } from "@/utils/readExcel.js";
import XLSX from "xlsx";
import { academicYearModel } from "@repo/db/index.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { socketService } from "@/services/socketService.js";
import { parseReportExportFilters } from "@/utils/report-export-filters.js";
import { exportEnrolmentMasterReportBuffer } from "../services/enrolment-master-export.service.js";
import {
  changeStudentShift,
  getStudentShiftChangePreview,
} from "../services/student-shift-change.service.js";
import { updateActivePromotionFields } from "../services/student-active-promotion-fields.service.js";
import {
  computeFileHash,
  createLegacyImportJob,
  markLegacyImportJobRunning,
  completeLegacyImportJob,
  failLegacyImportJob,
  getLegacyImportJob,
  getLegacyImportJobFile,
  findActiveJobByFileHash,
  downloadPathForJob,
  LegacyImportJobDuplicateError,
} from "../services/legacy-import-jobs.service.js";

export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newStudent = await studentService.addStudent(req.body as StudentType);

    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", newStudent, "Student Created!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { page, pageSize } = req.query;

    if (!page) {
      page = "1";
    }

    if (!pageSize) {
      pageSize = "10";
    }

    const students = await studentService.findAllStudent(
      Number(page),
      Number(pageSize),
    );

    res
      .status(200)
      .json(new ApiResponse(201, "SUCCESS", students, "Students fetched!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSearchedStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { page, pageSize, searchText } = req.query;

    if (!page) {
      page = "1";
    }

    if (!pageSize) {
      pageSize = "10";
    }

    const students = await studentService.searchStudent(
      searchText as string,
      Number(page),
      Number(pageSize),
    );

    res
      .status(200)
      .json(new ApiResponse(201, "SUCCESS", students, "Students fetched!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSearchedStudentsByRollNumber = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { page, pageSize, searchText } = req.query;

    if (!page) {
      page = "1";
    }

    if (!pageSize) {
      pageSize = "10";
    }

    const students = await studentService.searchStudentsByRollNumber(
      searchText as string,
      Number(page),
      Number(pageSize),
    );

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", students, "Students fetched!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;

    const foundStudent = await studentService.findById(Number(id));

    if (!foundStudent) {
      res.status(404).json(new ApiError(404, `No student exist for id: ${id}`));
    }

    res
      .status(200)
      .json(new ApiResponse(201, "SUCCESS", foundStudent, "Student fetched!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

// GET /api/students/online
// Returns a lightweight list of currently online students based on active WebSocket connections
export const getOnlineStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userIds = socketService.getOnlineStudentUserIds();

    if (userIds.length === 0) {
      res
        .status(200)
        .json(new ApiResponse(200, "SUCCESS", [], "No students online"));
      return;
    }

    const students = await Promise.all(
      userIds.map(async (userId) => {
        try {
          return await studentService.findByUserId(userId);
        } catch (e) {
          console.error(
            "[getOnlineStudents] Failed to fetch student for userId",
            userId,
            e,
          );
          return null;
        }
      }),
    );

    // Filter out any nulls just in case
    const filtered = students.filter((s) => s !== null);

    const enriched = await Promise.all(
      filtered.map(async (student) => ({
        ...student,
        loginTime: socketService.getOnlineStudentLoginTime(student.userId),
        // Class/semester of the student's active promotion (end_date IS NULL).
        activeClassName: await studentService.getActiveClassNameForStudent(
          student.id as number,
        ),
      })),
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          enriched,
          `Fetched ${enriched.length} online students`,
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getStudentByUid = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { uid } = req.params;

    const foundStudent = await studentService.findByUid(uid as string);

    if (!foundStudent) {
      res
        .status(404)
        .json(new ApiError(404, `No student exist for UID: ${uid}`));
      return;
    }

    res
      .status(200)
      .json(new ApiResponse(201, "SUCCESS", foundStudent, "Student fetched!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const updatedStudent = await studentService.saveStudent(
      Number(id),
      req.body as StudentType,
    );

    if (!updateStudent) {
      res.status(404).json(new ApiError(404, `No student exist for id: ${id}`));
    }

    res
      .status(200)
      .json(
        new ApiResponse(201, "SUCCESS", updatedStudent, "Student Updated!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const deletedStudent = await studentService.removeStudent(Number(id));

    if (deletedStudent == null) {
      res.status(404).json(new ApiError(204, `No student exist for id: ${id}`));
      return;
    }

    if (!deletedStudent) {
      res
        .status(429)
        .json(new ApiError(204, `Unable to delete the student with id: ${id}`));
    }

    res
      .status(200)
      .json(
        new ApiResponse(201, "SUCCESS", deletedStudent, "Student Deleted!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getFilteredStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      stream,
      year,
      semester,
      framework,
      export: isExport,
    } = req.query;

    const result = await studentService.findFilteredStudents({
      page: Number(page),
      pageSize: Number(pageSize),
      stream: stream as string,
      year: Number(year),
      semester: Number(semester),
      framework: framework as "CCF" | "CBCS",
      export: isExport === "true" ? true : false,
    });

    res.json({
      success: true,
      message: "Students retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in getFilteredStudents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update student active/leaving info
export const updateStudentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const {
      active,
      leavingDate,
      leavingReason,
      statusOption,
      takenTransferCertificate,
      hasCancelledAdmission,
      cancelledAdmissionReason,
      cancelledAdmissionAt,
      cancelledAdmissionByUserId,
      alumni,
      rfidNumber,
      quotaTypeId,
      noShowRemarks,
    } = req.body as any;

    // If cancelled and no explicit user id provided, take from auth context
    // Ensure we always have a user ID when status is CANCELLED_ADMISSION
    const effectiveCancelledBy =
      statusOption === "CANCELLED_ADMISSION"
        ? typeof cancelledAdmissionByUserId === "number"
          ? cancelledAdmissionByUserId
          : (req as any)?.user?.id
            ? Number((req as any).user.id)
            : null
        : cancelledAdmissionByUserId;

    // Log for debugging
    if (statusOption === "CANCELLED_ADMISSION") {
      console.log("[UPDATE STUDENT STATUS] Cancelled Admission - User ID:", {
        provided: cancelledAdmissionByUserId,
        fromReq: (req as any)?.user?.id,
        effective: effectiveCancelledBy,
      });
    }

    const result = await studentService.updateStudentStatusById(Number(id), {
      active,
      leavingDate,
      leavingReason,
      statusOption,
      takenTransferCertificate,
      hasCancelledAdmission,
      cancelledAdmissionReason,
      cancelledAdmissionAt,
      cancelledAdmissionByUserId: effectiveCancelledBy,
      alumni,
      // Pass through RFID so service can persist it
      rfidNumber,
      // Pass through quota type so service can persist it
      quotaTypeId,
      // Registrar free-text captured when NO_SHOW is chosen.
      noShowRemarks,
    });

    if (!result) {
      res.status(404).json(new ApiError(404, `No student exist for id: ${id}`));
      return;
    }

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Student status updated!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update family member titles for a student
export const updateFamilyMemberTitlesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { uid } = req.params;
    const { fatherTitle, motherTitle, guardianTitle } = req.body;

    // Validate UID parameter
    if (!uid || typeof uid !== "string") {
      res.status(400).json(new ApiError(400, "Student UID is required"));
      return;
    }

    // Validate that at least one title is provided
    if (!fatherTitle && !motherTitle && !guardianTitle) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "At least one family member title must be provided",
          ),
        );
      return;
    }

    // Validate title values if provided
    const validTitles = [
      "MR.",
      "MRS.",
      "MS.",
      "DR.",
      "PROF.",
      "REV.",
      "OTHER.",
      "LATE",
      "MR",
      "MRS",
      "MS",
      "DR",
      "PROF",
      "REV",
      "OTHER",
    ];

    if (fatherTitle && !validTitles.includes(fatherTitle)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid father title. Must be one of: ${validTitles.join(", ")}`,
          ),
        );
      return;
    }

    if (motherTitle && !validTitles.includes(motherTitle)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid mother title. Must be one of: ${validTitles.join(", ")}`,
          ),
        );
      return;
    }

    if (guardianTitle && !validTitles.includes(guardianTitle)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid guardian title. Must be one of: ${validTitles.join(", ")}`,
          ),
        );
      return;
    }

    console.info("[FAMILY-TITLE-UPDATE] Starting family member title update", {
      uid,
      fatherTitle,
      motherTitle,
      guardianTitle,
    });

    // Call the service to update family member titles
    const result = await updateFamilyMemberTitles(uid, {
      fatherTitle,
      motherTitle,
      guardianTitle,
    });

    if (!result.success) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            result.error || "Failed to update family member titles",
          ),
        );
      return;
    }

    console.info(
      "[FAMILY-TITLE-UPDATE] Family member titles updated successfully",
      {
        uid,
        updatedMembers: result.updatedMembers,
      },
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          uid,
          updatedMembers: result.updatedMembers,
          updatedTitles: {
            fatherTitle: result.updatedTitles?.fatherTitle,
            motherTitle: result.updatedTitles?.motherTitle,
            guardianTitle: result.updatedTitles?.guardianTitle,
          },
        },
        "Family member titles updated successfully",
      ),
    );
  } catch (error) {
    console.error(
      "[FAMILY-TITLE-UPDATE] Error updating family member titles:",
      error,
    );
    handleError(error, res, next);
  }
};

export const exportStudentDetailedReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { academicYearId } = req.query;
    if (!academicYearId) {
      return res
        .status(400)
        .json(new ApiError(400, "academicYearId query parameter is required"));
    }

    const academicYearIdNumber = Number(academicYearId);
    if (Number.isNaN(academicYearIdNumber)) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid academicYearId parameter"));
    }

    console.log("[STUDENT-EXPORT] Starting detailed student export...");
    const filters = parseReportExportFilters(
      req.query as Record<string, unknown>,
    );
    const result = await studentService.exportStudentDetailedReport(
      academicYearIdNumber,
      filters,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`,
    );
    res.setHeader("Content-Length", result.buffer.length);

    res.status(200).send(result.buffer);
  } catch (error) {
    console.error(
      "[STUDENT-EXPORT] Failed to export detailed student report",
      error,
    );
    handleError(error, res, next);
  }
};

export const downloadStudentImagesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { academicYearId } = req.query;

    if (!academicYearId) {
      return res
        .status(400)
        .json(new ApiError(400, "academicYearId query parameter is required"));
    }

    const academicYearIdNumber = Number(academicYearId);
    if (Number.isNaN(academicYearIdNumber)) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid academicYearId parameter"));
    }

    const [academicYear] = await db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.id, academicYearIdNumber));

    const zipBuffer = await studentService.downloadStudentImages(
      academicYearIdNumber,
      (req as any).user?.id,
    );

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="student-images-${academicYear.year}.zip"`,
    );
    res.setHeader("Content-Length", zipBuffer.byteLength);

    return res.send(zipBuffer); // 👈 THIS WAS MISSING
  } catch (error) {
    console.error("[STUDENT-EXPORT] Failed to download student images", error);
    handleError(error, res, next);
  }
};

export const exportStudentAcademicSubjectsReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { academicYearId } = req.query;
    if (!academicYearId) {
      return res
        .status(400)
        .json(new ApiError(400, "academicYearId query parameter is required"));
    }

    const academicYearIdNumber = Number(academicYearId);
    if (Number.isNaN(academicYearIdNumber)) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid academicYearId parameter"));
    }

    console.log(
      "[STUDENT-EXPORT] Starting student academic subjects report export...",
    );
    const filters = parseReportExportFilters(
      req.query as Record<string, unknown>,
    );
    const result = await studentService.exportStudentAcademicSubjectsReport(
      academicYearIdNumber,
      filters,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`,
    );
    res.setHeader("Content-Length", result.buffer.length);

    res.status(200).send(result.buffer);
  } catch (error) {
    console.error(
      "[STUDENT-EXPORT] Failed to export student academic subjects report",
      error,
    );
    handleError(error, res, next);
  }
};

export const exportEnrolmentMasterReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { academicYearId } = req.query;
    if (!academicYearId) {
      return res
        .status(400)
        .json(new ApiError(400, "academicYearId query parameter is required"));
    }
    const academicYearIdNumber = Number(academicYearId);
    if (Number.isNaN(academicYearIdNumber)) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid academicYearId parameter"));
    }
    const buffer = await exportEnrolmentMasterReportBuffer(
      academicYearIdNumber,
      parseReportExportFilters(req.query as Record<string, unknown>),
    );
    const fileName = `enrolment-master-${academicYearIdNumber}-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (error) {
    handleError(error, res, next);
  }
};

// Bulk update family member titles from Excel file
export const bulkUpdateFamilyMemberTitlesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json(new ApiError(400, "Excel file is required"));
      return;
    }

    console.info(`[FAMILY-TITLE-BULK] Processing file: ${file.originalname}`);

    // Read Excel file from buffer
    const titleRows = readExcelFromBuffer<{
      UID: string;
      "Father Title": string;
      "Mother Title": string;
      "Guardian Title": string;
    }>(file.buffer);

    if (!titleRows || titleRows.length === 0) {
      res.status(400).json(new ApiError(400, "No data found in Excel file"));
      return;
    }

    console.info(
      `[FAMILY-TITLE-BULK] Found ${titleRows.length} rows in Excel file`,
    );

    // Validate required columns
    const requiredColumns = [
      "UID",
      "Father Title",
      "Mother Title",
      "Guardian Title",
    ];
    const firstRow = titleRows[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Missing required columns: ${missingColumns.join(", ")}`,
          ),
        );
      return;
    }

    // Process bulk update
    const result = await bulkUpdateFamilyMemberTitles(titleRows);

    console.info(
      `[FAMILY-TITLE-BULK] Completed: ${result.updated} updated, ${result.errors.length} errors, ${result.notFound.length} not found`,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          `Bulk update completed: ${result.updated}/${result.total} updated successfully`,
        ),
      );
  } catch (error) {
    console.error("[FAMILY-TITLE-BULK] Error processing bulk update:", error);
    handleError(error, res, next);
  }
};

// Pre-check an import Excel: which UIDs already exist vs new (read-only)
export const precheckImportStudentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file || !file.buffer) {
      res
        .status(400)
        .json(
          new ApiError(400, "Excel file is required under field name 'file'"),
        );
      return;
    }
    const summary = await precheckStudentsFromExcelBuffer(file.buffer);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", summary, "Pre-check completed"));
  } catch (error) {
    handleError(error, res, next);
  }
};

// Import students from Excel (UID column) and run legacy processStudent
//
// Multi-instance shape (ADR 0030): the job is a `legacy_import_jobs` row in
// Postgres — createed here, updated by the orchestrator, terminal-stated on
// completion / failure. Socket carries live progress; the status endpoint
// (`GET /status/:jobId`) is the poll-fallback served by ANY instance; the
// error-report download reads the `bytea` column (also any instance). All
// three used to live in per-process memory + local disk and 404'd behind
// the ALB.
export const importStudentsFromExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file || !file.buffer) {
      res
        .status(400)
        .json(
          new ApiError(400, "Excel file is required under field name 'file'"),
        );
      return;
    }

    const uploaderUserIdRaw = (req as any).user?.id ?? null;
    const uploaderUserId =
      typeof uploaderUserIdRaw === "number"
        ? uploaderUserIdRaw
        : uploaderUserIdRaw != null && !Number.isNaN(Number(uploaderUserIdRaw))
          ? Number(uploaderUserIdRaw)
          : null;
    const progressUserId =
      uploaderUserIdRaw != null ? String(uploaderUserIdRaw) : undefined;
    // Shown to OTHER uploaders who hit the same UID while this import runs.
    const uploaderName = (req as any).user?.name
      ? String((req as any).user.name)
      : (req as any).user?.email
        ? String((req as any).user.email)
        : null;

    // Dedupe double-submit (accidental double-click on the Import button OR
    // the same file uploaded from two different tabs / machines): if a row
    // for the same file bytes is already `queued`/`running` we reject with
    // 409 pointing at the in-flight job instead of spawning a rival run.
    // The Postgres row is the multi-instance-safe lock.
    const fileHash = computeFileHash(file.buffer);
    const active = await findActiveJobByFileHash(fileHash);
    if (active) {
      res.status(409).json(
        new ApiResponse(
          409,
          "ALREADY_IN_PROGRESS",
          {
            jobId: active.jobId,
            status: active.status,
            startedAt: active.startedAt,
            uploaderName: active.uploaderName,
          },
          `This file is already being imported by ${active.uploaderName ?? "another user"} (started ${active.startedAt}). Refresh to see progress.`,
        ),
      );
      return;
    }

    let job;
    try {
      job = await createLegacyImportJob({
        uploaderUserId,
        uploaderName,
        fileName: file.originalname ?? null,
        fileHash,
        totalUids: 0, // set after parse inside processStudentsFromExcelBuffer
      });
    } catch (e) {
      // Rival instance won the race between our findActiveJobByFileHash
      // check and INSERT — the UNIQUE partial index on file_hash caught
      // it. Same 409 shape as the pre-check path.
      if (e instanceof LegacyImportJobDuplicateError) {
        res.status(409).json(
          new ApiResponse(
            409,
            "ALREADY_IN_PROGRESS",
            {
              jobId: e.winner.jobId,
              status: e.winner.status,
              startedAt: e.winner.startedAt,
              uploaderName: e.winner.uploaderName,
            },
            `This file is already being imported by ${e.winner.uploaderName ?? "another user"} (started ${e.winner.startedAt}). Refresh to see progress.`,
          ),
        );
        return;
      }
      throw e;
    }

    // Run the import in the BACKGROUND and respond immediately: the ALB cuts
    // idle HTTP connections (~60s) long before a big import finishes.
    // Per-student progress: socket to the uploader. Terminal state: written
    // to the job row so any instance can serve status + error-report
    // download (multi-instance behind the ALB, no sticky sessions).
    const operation = "student_import_legacy_students";
    void (async () => {
      try {
        await markLegacyImportJobRunning(job.jobId);
        const summary = await processStudentsFromExcelBuffer(file.buffer, {
          progressUserId,
          uploaderName,
          jobId: job.jobId,
        });
        // Failed / not-found UIDs must survive the popup: build the XLSX
        // IN-MEMORY and persist as `bytea` on the job row. The old flow
        // wrote it under `logs/import-error-reports/` and 404'd when the
        // download landed on a sibling instance.
        let errorReport: { name: string; bytes: Buffer } | null = null;
        if (summary.errors.length > 0 || summary.notFoundUids.length > 0) {
          try {
            errorReport = buildImportErrorReport(summary);
          } catch (e) {
            console.error(
              "[import-legacy-students] error report build failed:",
              (e as Error)?.message,
            );
          }
        }
        await completeLegacyImportJob(job.jobId, summary, errorReport);

        if (!progressUserId) return;
        socketService.sendProgressUpdate(
          progressUserId,
          socketService.createExportProgressUpdate(
            progressUserId,
            `Import completed: ${summary.processed} processed, ${summary.errors.length} error(s)`,
            100,
            "completed",
            undefined,
            undefined,
            undefined,
            {
              operation,
              // Deliberately NOT named `jobId` — the main-console progress
              // handler treats `meta.jobId` as the active REPORT-download
              // identifier (activeJobIdRef.current), and would drop events
              // whose jobId doesn't match. Legacy-import uses its own key.
              importJobId: job.jobId,
              summary,
              errorReportAvailable: Boolean(errorReport),
              errorReportUrl: errorReport
                ? downloadPathForJob(job.jobId)
                : null,
            },
          ),
        );
      } catch (error) {
        console.error(
          "[import-legacy-students] background import failed:",
          error,
        );
        await failLegacyImportJob(
          job.jobId,
          (error as Error)?.message || "Import failed",
        );
        if (!progressUserId) return;
        socketService.sendProgressUpdate(
          progressUserId,
          socketService.createExportProgressUpdate(
            progressUserId,
            "Import failed",
            100,
            "error",
            undefined,
            undefined,
            (error as Error)?.message,
            { operation, importJobId: job.jobId },
          ),
        );
      }
    })();
    res
      .status(202)
      .json(
        new ApiResponse(
          202,
          "SUCCESS",
          { jobId: job.jobId, status: "queued" },
          "Import started; progress and the final summary arrive via socket",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * Build the failed / not-found error report as an in-memory XLSX Buffer.
 * The buffer is persisted to `legacy_import_jobs.error_report_bytes` and
 * served from any instance — replaces the old local-disk write under
 * `logs/import-error-reports/` which 404'd behind the ALB.
 */
function buildImportErrorReport(summary: {
  processed: number;
  notFound: number;
  notFoundUids: string[];
  errors: Array<{ uid: string; error: string }>;
}): { name: string; bytes: Buffer } {
  const rows = [
    ...summary.errors.map((e) => ({
      UID: e.uid,
      Status: "error",
      Reason: e.error,
    })),
    ...summary.notFoundUids.map((uid) => ({
      UID: uid,
      Status: "not found",
      Reason: "uid not found in legacy DB",
    })),
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 11 }, { wch: 80 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Import Errors");
  const name = `import-errors-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
  const bytes = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return { name, bytes };
}

// GET /api/students/import-legacy-students/error-report/:jobId
//   Streams the error-report XLSX from `legacy_import_jobs.error_report_bytes`.
//   Any instance can serve it — no local-disk dependency, no 404s behind
//   the ALB. (The old route path `:fileName` is intentionally the same
//   segment so an existing bookmark hitting an old-format name will 400
//   cleanly at the UUID check rather than opening a filesystem lookup.)
export const downloadImportErrorReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = String(req.params.jobId || req.params.fileName || "");
    if (!/^[0-9a-fA-F-]{36}$/.test(jobId)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Invalid job id — the error-report URL is now keyed on the import jobId (uuid). Please re-run the import to get a fresh URL.",
          ),
        );
      return;
    }
    const file = await getLegacyImportJobFile(jobId);
    if (!file) {
      res.status(404).json(new ApiError(404, "Report not found or expired"));
      return;
    }
    const filename = file.name ?? `import-errors-${jobId}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(file.bytes);
  } catch (error) {
    handleError(error, res, next);
  }
};

// GET /api/students/import-legacy-students/status/:jobId
//   Fallback for the socket stream — if the user's browser missed the
//   completion event (drop / reconnect on a different instance), the UI
//   polls this to reach a terminal state. Served by ANY instance.
export const getImportJobStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = String(req.params.jobId || "");
    if (!/^[0-9a-fA-F-]{36}$/.test(jobId)) {
      res.status(400).json(new ApiError(400, "Invalid job id"));
      return;
    }
    const job = await getLegacyImportJob(jobId);
    if (!job) {
      res.status(404).json(new ApiError(404, "Job not found or expired"));
      return;
    }
    res.status(200).json(
      new ApiResponse(200, "SUCCESS", {
        jobId: job.jobId,
        status: job.status,
        totalUids: job.totalUids,
        processed: job.processed,
        notFound: job.notFound,
        errorCount: job.errorCount,
        uploaderName: job.uploaderName,
        startedAt: job.startedAt,
        updatedAt: job.updatedAt,
        finishedAt: job.finishedAt,
        summary: job.summary,
        errorReportAvailable: job.hasErrorReport,
        errorReportUrl: job.hasErrorReport
          ? downloadPathForJob(job.jobId)
          : null,
      }),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const backfillStudentQuotaTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const summary = await backfillStudentQuotaTypes();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          summary,
          "Quota type backfill completed",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const changeStudentShiftController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = Number(req.params.id);
    const { newShiftId } = req.body as { newShiftId?: number };

    if (!Number.isInteger(studentId) || studentId <= 0) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Valid student id is required"),
        );
      return;
    }

    if (!Number.isInteger(newShiftId) || (newShiftId ?? 0) <= 0) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Valid newShiftId is required"),
        );
      return;
    }

    const result = await changeStudentShift(studentId, newShiftId!);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          result.feesPaid
            ? "Shift changed; existing fee mappings and payments retained"
            : "Shift changed; fee mappings recreated for the new shift",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateActivePromotionFieldsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = Number(req.params.id);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Valid student id is required"),
        );
      return;
    }
    const body = (req.body ?? {}) as {
      sectionId?: number | null;
      classRollNumber?: string | null;
    };
    const result = await updateActivePromotionFields(studentId, {
      sectionId:
        body.sectionId == null || body.sectionId === undefined
          ? null
          : Number(body.sectionId),
      classRollNumber:
        body.classRollNumber == null || body.classRollNumber === undefined
          ? null
          : String(body.classRollNumber),
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          `Updated ${result.promotionIdsUpdated.length} active promotion(s).`,
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const changeStudentShiftPreviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = Number(req.params.id);
    const newShiftId = Number(req.query.newShiftId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Valid student id is required"),
        );
      return;
    }

    if (!Number.isInteger(newShiftId) || newShiftId <= 0) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "Valid newShiftId query param is required",
          ),
        );
      return;
    }

    const preview = await getStudentShiftChangePreview(studentId, newShiftId);

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", preview, "Shift change preview"));
  } catch (error) {
    handleError(error, res, next);
  }
};
