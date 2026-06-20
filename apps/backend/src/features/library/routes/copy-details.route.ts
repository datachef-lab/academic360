import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  bulkUploadCopyDetailsController,
  copyBulkUploadFileMiddleware,
  createCopyDetailsController,
  deleteCopyDetailsController,
  downloadCopyBulkUploadTemplateController,
  downloadCopyDetailsExcelController,
  getCopyDetailsByIdController,
  getCopyDetailsListController,
  getCopyDetailsMetaController,
  updateCopyDetailsController,
} from "@/features/library/controllers/copy-details.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/meta", getCopyDetailsMetaController);
router.get("/template", downloadCopyBulkUploadTemplateController);
router.get("/download", downloadCopyDetailsExcelController);
router.post(
  "/bulk-upload",
  copyBulkUploadFileMiddleware,
  bulkUploadCopyDetailsController,
);
router.get("/", getCopyDetailsListController);
router.get("/:id", getCopyDetailsByIdController);
router.post("/", createCopyDetailsController);
router.put("/:id", updateCopyDetailsController);
router.delete("/:id", deleteCopyDetailsController);

export default router;
