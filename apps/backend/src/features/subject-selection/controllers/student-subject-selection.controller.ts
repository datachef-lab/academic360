import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createStudentSubjectSelectionsWithValidation,
  updateStudentSubjectSelectionsEfficiently,
  getStudentSubjectSelectionsPaginated,
  getStudentSubjectSelectionById,
  updateStudentSubjectSelectionsWithValidation,
  deleteStudentSubjectSelection,
  getSubjectSelectionMetaForStudent,
  getStudentSubjectSelectionVersionHistory,
  getCurrentActiveSelections,
  getSubjectSelectionAuditTrail,
  canStudentCreateSelections,
  getSelectionStatistics,
  exportStudentSubjectSelections,
  debugMinor3Conditions,
} from "../services/student-subject-selection.service.js";

// Get subject selection meta data for UI form
export async function getSubjectSelectionMetaHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = Number(req.params.studentId);
    if (!studentId || isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid student ID provided",
          ),
        );
      return;
    }

    const result = await getSubjectSelectionMetaForStudent(studentId);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Subject selection meta data fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Create multiple subject selections with validation (Student access)
export async function createStudentSubjectSelectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const selections = req.body;
    if (!Array.isArray(selections) || selections.length === 0) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid selections array provided",
          ),
        );
      return;
    }

    // Extract user info from request (assuming middleware sets req.user)
    const userId = (req as any).user?.id;
    const userType = (req as any).user?.type;

    // Debug logging
    console.log("🔍 Debug - User object:", (req as any).user);
    console.log("🔍 Debug - User ID:", userId);
    console.log("🔍 Debug - User Type:", userType);
    console.log(
      "🔍 Debug - User Type Check:",
      userType !== "STUDENT" && userType !== "ADMIN",
    );

    // Check if user is student or admin (students can create their own, admins can create on behalf of students)
    if (
      userType !== "STUDENT" &&
      userType !== "ADMIN" &&
      userType !== "STAFF"
    ) {
      res
        .status(403)
        .json(
          new ApiResponse(
            403,
            "FORBIDDEN",
            null,
            "Only students and admins can create subject selections",
          ),
        );
      return;
    }

    // Set appropriate change reason based on user type
    const changeReason =
      userType === "STUDENT"
        ? undefined // No change reason for initial student selections
        : "Admin created selection on behalf of student";

    const result = await createStudentSubjectSelectionsWithValidation(
      selections,
      userId,
      changeReason,
      userType,
    );

    if (!result.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            { errors: result.errors },
            "Validation failed for subject selections",
          ),
        );
      return;
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          result.data,
          "Subject selections created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Create multiple subject selections with validation (Admin access with audit trail)
export async function createAdminStudentSubjectSelectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const selections = req.body;
    if (!Array.isArray(selections) || selections.length === 0) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid selections array provided",
          ),
        );
      return;
    }

    // Extract user info from request (assuming middleware sets req.user)
    const userId = (req as any).user?.id;
    const userType = (req as any).user?.type;

    // Debug logging
    console.log("🔍 Admin Debug - User object:", (req as any).user);
    console.log("🔍 Admin Debug - User ID:", userId);
    console.log("🔍 Admin Debug - User Type:", userType);

    // Check if user is admin or staff (both can use this endpoint)
    if (userType !== "ADMIN" && userType !== "STAFF") {
      res
        .status(403)
        .json(
          new ApiResponse(
            403,
            "FORBIDDEN",
            null,
            "Only admins or staff can use this endpoint",
          ),
        );
      return;
    }

    // For admin selections, use the reason provided in the request body
    // or default to admin action
    const changeReason =
      selections[0]?.reason || "Admin/Staff created/updated selection";

    const result = await updateStudentSubjectSelectionsEfficiently(
      selections,
      userId,
      changeReason,
    );

    if (!result.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            { errors: result.errors },
            "Validation failed for subject selections",
          ),
        );
      return;
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          result.data,
          "Admin subject selections created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Update multiple subject selections with validation (Admin only - creates new version)
export async function updateStudentSubjectSelectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = Number(req.params.studentId);
    const sessionId = Number(req.params.sessionId);
    const selections = req.body;
    const changeReason = req.body.changeReason || "Admin update";

    if (!studentId || isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid student ID provided",
          ),
        );
      return;
    }

    if (!sessionId || isNaN(sessionId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid session ID provided",
          ),
        );
      return;
    }

    if (!Array.isArray(selections)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid selections array provided",
          ),
        );
      return;
    }

    // Extract user info from request (assuming middleware sets req.user)
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Check if user is admin or staff (only they can update selections)
    if (!["admin", "staff"].includes(userRole)) {
      res
        .status(403)
        .json(
          new ApiResponse(
            403,
            "FORBIDDEN",
            null,
            "Only admin and staff can update student subject selections",
          ),
        );
      return;
    }

    const result = await updateStudentSubjectSelectionsWithValidation(
      studentId,
      sessionId,
      selections,
      userId,
      changeReason,
    );

    if (!result.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            { errors: result.errors },
            "Validation failed for subject selections",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result.data,
          "Subject selections updated successfully (new version created)",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Get paginated student subject selections
export async function getStudentSubjectSelectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const studentId = req.query.studentId
      ? Number(req.query.studentId)
      : undefined;
    const sessionId = req.query.sessionId
      ? Number(req.query.sessionId)
      : undefined;

    const result = await getStudentSubjectSelectionsPaginated({
      page,
      pageSize,
      studentId,
      sessionId,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Student subject selections fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Get student subject selection by ID
export async function getStudentSubjectSelectionByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid ID provided"));
      return;
    }

    const result = await getStudentSubjectSelectionById(id);
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Student subject selection not found",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Student subject selection fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Delete student subject selection
export async function deleteStudentSubjectSelectionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid ID provided"));
      return;
    }

    const result = await deleteStudentSubjectSelection(id);
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Student subject selection not found",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Student subject selection deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// -- Version History and Audit Trail Endpoints --

// Get version history for a student's subject selections
export async function getVersionHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = Number(req.params.studentId);
    const sessionId = req.query.sessionId
      ? Number(req.query.sessionId)
      : undefined;

    if (!studentId || isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid student ID provided",
          ),
        );
      return;
    }

    const result = await getStudentSubjectSelectionVersionHistory(
      studentId,
      sessionId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Version history fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Get current active selections for a student
export async function getCurrentActiveSelectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = Number(req.params.studentId);
    const sessionId = req.query.sessionId
      ? Number(req.query.sessionId)
      : undefined;

    if (!studentId || isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid student ID provided",
          ),
        );
      return;
    }

    const result = await getCurrentActiveSelections(studentId, sessionId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Current active selections fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Get audit trail for a specific subject selection
export async function getAuditTrailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const subjectSelectionMetaId = Number(req.params.subjectSelectionMetaId);
    const studentId = Number(req.params.studentId);

    if (!subjectSelectionMetaId || isNaN(subjectSelectionMetaId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid subject selection meta ID provided",
          ),
        );
      return;
    }

    if (!studentId || isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid student ID provided",
          ),
        );
      return;
    }

    const result = await getSubjectSelectionAuditTrail(
      subjectSelectionMetaId,
      studentId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Audit trail fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Check if student can create new selections
export async function canCreateSelectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = Number(req.params.studentId);
    const sessionId = Number(req.params.sessionId);

    if (!studentId || isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid student ID provided",
          ),
        );
      return;
    }

    if (!sessionId || isNaN(sessionId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid session ID provided",
          ),
        );
      return;
    }

    const canCreate = await canStudentCreateSelections(studentId, sessionId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { canCreate },
          "Student creation eligibility checked successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Get selection statistics for reporting
export async function getSelectionStatisticsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = Number(req.params.studentId);

    if (!studentId || isNaN(studentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid student ID provided",
          ),
        );
      return;
    }

    const result = await getSelectionStatistics(studentId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Selection statistics fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

// Export student subject selections to Excel
export async function exportStudentSubjectSelectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const subjectSelectionMetaId = Number(req.params.subjectSelectionMetaId);

    if (!subjectSelectionMetaId || isNaN(subjectSelectionMetaId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid subject selection meta ID provided",
          ),
        );
      return;
    }

    console.log(
      `Starting export for subject selection meta ID: ${subjectSelectionMetaId}`,
    );

    // Get user ID from request (assuming it's available in req.user or similar)
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const exportResult = await exportStudentSubjectSelections(
      subjectSelectionMetaId,
      userId,
    );

    // Check if there was an error in the service
    if (exportResult.error) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, exportResult.error));
      return;
    }

    // Check if no data was found
    if (!exportResult.buffer) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "No data found for the specified subject selection meta ID",
          ),
        );
      return;
    }

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportResult.fileName}"`,
    );
    res.setHeader("Content-Length", exportResult.buffer.length);

    console.log(
      `Export completed. Total records: ${exportResult.totalRecords}`,
    );

    // Send the Excel buffer as response
    res.status(200).send(exportResult.buffer);
  } catch (error) {
    console.error("Export error:", error);
    handleError(error, res, next);
  }
}

// Debug handler for Minor 3 conditions
export async function debugMinor3ConditionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await debugMinor3Conditions();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Debug information logged to console. Check server logs for details.",
        ),
      );
  } catch (error) {
    console.error("Debug error:", error);
    handleError(error, res, next);
  }
}
