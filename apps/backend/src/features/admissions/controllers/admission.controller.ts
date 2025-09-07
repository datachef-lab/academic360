import { Router, Request, Response, NextFunction } from "express";
import * as admissionService from "../services/admission.service.js";
import * as additionalInfoService from "../services/admission-additional-info.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";

const router = Router();

// --- Place summary and stats-summary routes first ---
// GET /stats-summary - returns Stats type
router.get("/stats-summary", async (req, res, next) => {
  try {
    const stats = await admissionService.admissionStats();
    // Only return the Stats shape
    res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      data: stats,
      message: "Stats summary fetched successfully!",
    });
  } catch (error) {
    handleError(error, res, next);
  }
});

// GET /summary - returns AdmissionSummary[]
router.get("/summary", async (req, res, next) => {
  try {
    const admissions = await admissionService.findAllAdmissionSummary();
    // Map to AdmissionSummary shape

    res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      data: admissions,
      message: "Admission summaries fetched successfully!",
    });
  } catch (error) {
    handleError(error, res, next);
  }
});
// --- End: Place summary and stats-summary routes first ---

// Admissions CRUD
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await admissionService.createAdmission(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          result,
          "Admission created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await admissionService.findAdmissionById(
      Number(req.params.id),
    );
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Admission with ID ${req.params.id} not found`,
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
          "Admission fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
});

router.get(
  "/year/:year",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await admissionService.findAdmissionByYear(
        Number(req.params.year),
      );
      if (!result) {
        res
          .status(404)
          .json(
            new ApiResponse(
              404,
              "NOT_FOUND",
              null,
              `Admission for year ${req.params.year} not found`,
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
            "Admission fetched successfully!",
          ),
        );
    } catch (error) {
      handleError(error, res, next);
    }
  },
);

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await admissionService.updateAdmission(
      Number(req.params.id),
      req.body,
    );
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Admission with ID ${req.params.id} not found`,
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          result,
          `Admission with ID ${req.params.id} updated successfully!`,
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
});

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await admissionService.deleteAdmission(
        Number(req.params.id),
      );
      if (!result) {
        res
          .status(404)
          .json(
            new ApiResponse(
              404,
              "NOT_FOUND",
              null,
              `Admission with ID ${req.params.id} not found`,
            ),
          );
        return;
      }
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "DELETED",
            result,
            `Admission with ID ${req.params.id} deleted successfully!`,
          ),
        );
    } catch (error) {
      handleError(error, res, next);
    }
  },
);

// Additional Info CRUD
router.post("/additional-info", async (req: Request, res: Response) => {
  const result = await additionalInfoService.createAdmissionAdditionalInfo(
    req.body,
  );
  res.json(result);
});

router.get("/additional-info/:id", async (req: Request, res: Response) => {
  const result = await additionalInfoService.findAdditionalInfoById(
    Number(req.params.id),
  );
  res.json(result);
});

router.get(
  "/additional-info/application-form/:applicationFormId",
  async (req: Request, res: Response) => {
    const result =
      await additionalInfoService.findAdditionalInfoByApplicationFormId(
        Number(req.params.applicationFormId),
      );
    res.json(result);
  },
);

router.put("/additional-info/:id", async (req: Request, res: Response) => {
  const result = await additionalInfoService.updateAdmissionAdditionalInfo({
    ...req.body,
    id: Number(req.params.id),
  });
  res.json(result);
});

router.delete("/additional-info/:id", async (req: Request, res: Response) => {
  const result = await additionalInfoService.deleteAdmissionAdditionalInfo(
    Number(req.params.id),
  );
  res.json({ success: result });
});

// List all admissions
router.get("/", async (req, res, next) => {
  try {
    const result = await admissionService.findAllAdmissions();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Admissions fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
});

// Get admissions stats
router.get("/stats", async (req, res, next) => {
  try {
    const result = await admissionService.admissionStats();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Stats fetched successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
});

// Get all applications for an admission
router.get("/:year/applications", async (req, res, next) => {
  try {
    const { page = 1, size = 10, ...filters } = req.query;
    const result = await admissionService.getApplicationFormsByAdmissionYear(
      Number(req.params.year),
      Number(page),
      Number(size),
      filters,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Applications fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
});

export default router;
