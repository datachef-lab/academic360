import express from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { getAdmissionDashboard } from "@/features/admissions/services/admission-dashboard.service.js";

/**
 * Admission Home dashboard stats. Canonical (session-linked) schema only.
 * GET /api/admissions/dashboard?academicYearId=&level=&formStatus=
 */
const router = express.Router();

const numOrNull = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

router.get("/", async (req, res, next) => {
  try {
    const data = await getAdmissionDashboard({
      academicYearId: numOrNull(req.query.academicYearId),
      level: (req.query.level as string) || null,
      formStatus: (req.query.formStatus as string) || null,
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", data, "Admission dashboard fetched."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});

export default router;
