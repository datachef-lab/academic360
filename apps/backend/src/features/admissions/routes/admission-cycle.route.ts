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
    const {
      sessionId: bodySessionId,
      year,
      status,
      startDate,
      lastDate,
    } = req.body;

    // Resolve the session: by id, else find-or-create by year (name "YYYY-YYYY").
    let sessionId = bodySessionId ? Number(bodySessionId) : null;
    if (!sessionId) {
      const y = Number(String(year ?? "").match(/\d{4}/)?.[0]);
      if (!y) {
        res
          .status(400)
          .json(new ApiError(400, "year (or sessionId) is required"));
        return;
      }
      const name = `${y}-${y + 1}`;
      const [existingSession] = await db
        .select()
        .from(sessionModel)
        .where(eq(sessionModel.name, name));
      if (existingSession) {
        sessionId = existingSession.id;
      } else {
        const [created] = await db
          .insert(sessionModel)
          .values({ name, from: `${y}-06-01`, to: `${y + 1}-05-31` })
          .returning();
        sessionId = created.id;
      }
    }

    // One admission cycle per session — return the existing one if present.
    const [existingAdmission] = await db
      .select()
      .from(admissionModel)
      .where(eq(admissionModel.sessionId, sessionId));
    if (existingAdmission) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            existingAdmission,
            "Admission cycle already exists.",
          ),
        );
      return;
    }

    const [row] = await db
      .insert(admissionModel)
      .values({
        sessionId,
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
