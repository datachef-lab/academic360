import jwt from "jsonwebtoken";
import { ApiResponse, handleError, verifyToken } from "@/utils";
import { NextFunction, Request, Response } from "express";
import {
  findPromotionByStudentIdAndClassId,
  markExamFormSubmission,
} from "../services/promotion.service";
import { User, userModel } from "@repo/db/schemas";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { exportPromotionStudentsReport } from "../services/promotion.service";
import { socketService } from "@/services/socketService.js";

export async function findPromotionByStudentIdAndClassIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const studentId = parseInt(req.params.studentId as string, 10);
    const classId = parseInt(req.params.classId as string, 10);

    if (Number.isNaN(studentId) || Number.isNaN(classId)) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid studentId or classId format",
          ),
        );
    }

    const promotion = await findPromotionByStudentIdAndClassId(
      studentId,
      classId,
    );

    if (!promotion) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Promotion not found for given studentId and classId",
          ),
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          promotion,
          "Promotion retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function markExamFormSubmissionHandler(
  req: Request,
  res: Response,
) {
  try {
    const promotionId = parseInt(req.params.promotionId as string, 10);
    // const adminStaffUser = await getAdminStaffUserId(req);

    const userId = (req.user as User)?.id!;

    if (Number.isNaN(promotionId)) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid promotionId format",
          ),
        );
    }

    const updatedPromotion = await markExamFormSubmission(
      promotionId,
      userId,
      undefined,
    );

    if (!updatedPromotion) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Promotion with ID ${promotionId} not found`,
          ),
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedPromotion,
          "Exam form submission marked successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export const getAdminStaffUserId = async (req: Request) => {
  try {
    let adminUser: User | null = null;

    // Check if admin token is provided in header (for simulation mode)
    const adminToken = req.headers["x-admin-bypass-token"] as string;
    if (adminToken) {
      // Verify admin token
      try {
        const decoded = await verifyToken(
          adminToken,
          process.env.ACCESS_TOKEN_SECRET!,
        );
        const [foundAdmin] = await db
          .select()
          .from(userModel)
          .where(eq(userModel.id, decoded.id));

        if (
          foundAdmin &&
          (foundAdmin.type === "ADMIN" || foundAdmin.type === "STAFF")
        ) {
          adminUser = foundAdmin;
          console.log("[ADMIN BYPASS OTP] Admin verified from header token");
        }
      } catch (err) {
        console.log("[ADMIN BYPASS OTP] Invalid admin token in header");
      }
    }

    // If no admin from header, check for admin JWT cookie (only in simulation mode)
    // Simulation mode = request coming from main console (iframe), not direct student console access
    if (!adminUser) {
      // Check for explicit simulation mode header first (most reliable)
      // Headers are case-insensitive in Express, but we check both lowercase and the actual header name
      const simulationHeader =
        (req.headers["x-simulation-mode"] as string) ||
        (req.headers["X-Simulation-Mode"] as string);
      const origin = req.get("origin") || "";
      const referer = req.get("referer") || "";

      // Check if request is from simulation mode (main console iframe)
      // 1. Explicit header (most reliable)
      // 2. Origin/referer check (fallback) - use CORS_ORIGIN for main-console
      let mainConsoleHost = "";
      let mainConsoleOrigin = "";

      try {
        // CORS_ORIGIN is the main-console URL
        const mainConsoleBase =
          process.env.CORS_ORIGIN || "http://localhost:5173";
        const mainConsoleUrl = new URL(mainConsoleBase);
        mainConsoleHost = mainConsoleUrl.hostname;
        mainConsoleOrigin = mainConsoleUrl.origin;
      } catch (e) {
        console.warn(
          "[ADMIN BYPASS OTP] Failed to parse CORS_ORIGIN, using fallback",
        );
        mainConsoleHost = "localhost";
        mainConsoleOrigin = "http://localhost:5173";
      }

      console.log("[ADMIN BYPASS OTP] Simulation mode check:", {
        simulationHeader,
        origin,
        referer,
        mainConsoleHost,
        mainConsoleOrigin,
        envCorsOrigin: process.env.CORS_ORIGIN || "not set (using default)",
        allHeaders: Object.keys(req.headers).filter((h) =>
          h.toLowerCase().includes("simulation"),
        ),
      });

      // Check if origin/referer matches main console (supports both dev and production)
      // Use exact origin matching to avoid false positives (e.g., localhost:3000 matching localhost:5173)
      const isFromMainConsole =
        (mainConsoleOrigin && origin === mainConsoleOrigin) ||
        (mainConsoleOrigin && referer.includes(mainConsoleOrigin)) ||
        referer.includes("/apps/student-console/simulation");

      const isSimulationMode =
        simulationHeader === "true" ||
        isFromMainConsole ||
        // Fallback for development (localhost) - only if env var not set
        (!process.env.CORS_ORIGIN &&
          (origin.includes("localhost:5173") ||
            referer.includes("localhost:5173")));

      console.log("[ADMIN BYPASS OTP] Is simulation mode:", isSimulationMode);

      if (isSimulationMode) {
        const adminJwtCookie = req.cookies["jwt"]; // Admin console uses "jwt" cookie
        if (adminJwtCookie) {
          try {
            // Verify the admin refresh token from cookie (synchronously)
            const decoded = jwt.verify(
              adminJwtCookie,
              process.env.REFRESH_TOKEN_SECRET!,
            ) as { id: number; type: string };

            if (decoded) {
              const [foundAdmin] = await db
                .select()
                .from(userModel)
                .where(eq(userModel.id, decoded.id));

              if (
                foundAdmin &&
                (foundAdmin.type === "ADMIN" || foundAdmin.type === "STAFF")
              ) {
                adminUser = foundAdmin;
                console.log(
                  "[ADMIN BYPASS OTP] Admin verified from jwt cookie (simulation mode detected)",
                );
              }
            }
          } catch (err) {
            console.log(
              "[ADMIN BYPASS OTP] Invalid or expired admin jwt cookie:",
              err,
            );
          }
        } else {
          console.log(
            "[ADMIN BYPASS OTP] Simulation mode detected but no admin cookie found",
          );
        }
      } else {
        console.log(
          "[ADMIN BYPASS OTP] Not in simulation mode (direct student console access), requiring OTP",
        );
      }
    }

    // Fallback to JWT middleware verified user
    if (!adminUser && req.user) {
      adminUser = req.user as User;
      console.log("[ADMIN BYPASS OTP] Admin verified from JWT middleware");
    }

    return adminUser;
  } catch (error) {
    console.error("[ADMIN BYPASS OTP] Error:", error);
    return null;
  }
};

export async function exportPromotionStudentsReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sessionIdParam = req.query.sessionId as string | undefined;
    const classIdParam = req.query.classId as string | undefined;

    const sessionId = sessionIdParam ? Number(sessionIdParam) : undefined;
    const classId = classIdParam ? Number(classIdParam) : undefined;

    if (
      (sessionIdParam && Number.isNaN(sessionId)) ||
      (classIdParam && Number.isNaN(classId))
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid sessionId or classId parameter",
          ),
        );
    }

    const userId = (req.user as User)?.id?.toString();
    if (userId) {
      const startUpdate = socketService.createExportProgressUpdate(
        userId,
        "Starting promotion students export",
        5,
        "started",
      );
      socketService.sendProgressUpdate(userId, startUpdate);
    }

    const result = await exportPromotionStudentsReport({ sessionId, classId });

    if (userId) {
      const midUpdate = socketService.createExportProgressUpdate(
        userId,
        "Preparing Excel workbook",
        60,
        "in_progress",
      );
      socketService.sendProgressUpdate(userId, midUpdate);
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`,
    );
    res.setHeader("Content-Length", result.buffer.length);

    if (userId) {
      const doneUpdate = socketService.createExportProgressUpdate(
        userId,
        "Promotion students report ready",
        100,
        "completed",
        result.fileName,
      );
      socketService.sendProgressUpdate(userId, doneUpdate);
    }

    return res.status(200).send(result.buffer);
  } catch (error: any) {
    const userId = (req.user as User)?.id?.toString();
    if (userId) {
      const errUpdate = socketService.createExportProgressUpdate(
        userId,
        "Failed to generate promotion students report",
        100,
        "error",
        undefined,
        undefined,
        error?.message ?? "Unknown error",
      );
      socketService.sendProgressUpdate(userId, errUpdate);
    }

    return handleError(error, res, next);
  }
}
