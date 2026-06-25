import express from "express";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { admissionModel, sessionModel } from "@repo/db/schemas";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";

/**
 * Correct, session-based admission-cycle endpoints. The legacy /api/admissions
 * service uses a backend-local model with a non-existent academic_year_id_fk
 * column, so this dedicated route reads/writes the canonical (session-linked)
 * `admissions` table directly.
 */
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: admissionModel.id,
        sessionId: admissionModel.sessionId,
        status: admissionModel.status,
        isClosed: admissionModel.isClosed,
        startDate: admissionModel.startDate,
        lastDate: admissionModel.lastDate,
        sessionName: sessionModel.name,
      })
      .from(admissionModel)
      .leftJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
      .orderBy(admissionModel.id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Admission cycles fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { sessionId, status, startDate, lastDate } = req.body;
    if (!sessionId) {
      res.status(400).json(new ApiError(400, "sessionId is required"));
      return;
    }
    const [row] = await db
      .insert(admissionModel)
      .values({
        sessionId: Number(sessionId),
        status: status ?? "DRAFT",
        startDate: startDate || null,
        lastDate: lastDate || null,
      })
      .returning();
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", row, "Admission cycle created."));
  } catch (e) {
    handleError(e, res, next);
  }
});

export default router;
