import { NextFunction, Request, Response } from "express";
import { processStudentsFromExcelBuffer } from "../services/refactor-old-migration.service.js";
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

export const getStudentByUid = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { uid } = req.params;

    const foundStudent = await studentService.findByUid(uid);

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

// Import students from Excel (UID column) and run legacy processStudent
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

    const summary = await processStudentsFromExcelBuffer(file.buffer);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", summary, "Import completed"));
  } catch (error) {
    handleError(error, res, next);
  }
};
