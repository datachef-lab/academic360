import { Router, Request, Response, NextFunction } from "express";
import { bulkDataUploadHandler } from "../controllers/bulk-data-upload.controller.js";
import { bulkDataUploadTemplateHandler } from "../controllers/bulk-data-upload-template.controller.js";
import { bulkDataUploadExportHandler } from "../controllers/bulk-data-upload-export.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(verifyJWT);

/** GET /api/v1/bulk-data-uploads/template?mode=cu-reg-roll|exam-form-fillup */
router.get("/template", asyncHandler(bulkDataUploadTemplateHandler));

/** GET /api/v1/bulk-data-uploads/export — filtered Excel of existing records (query: mode, affiliationId, regulationTypeId, academicYearId, classId?) */
router.get("/export", asyncHandler(bulkDataUploadExportHandler));

/** POST /api/v1/bulk-data-uploads?mode=exam-form-fillup — multipart field `file` + context fields; dryRun=true validates without writes */
router.post("/", uploadExcelMiddleware, asyncHandler(bulkDataUploadHandler));

export default router;
