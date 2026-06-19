import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  bulkTagRfidController,
  createCopyDetailsController,
  deleteCopyDetailsController,
  downloadCopyDetailsExcelController,
  getCopyDetailsByIdController,
  getCopyDetailsListController,
  getCopyDetailsMetaController,
  reconcileInventoryController,
  updateCopyDetailsController,
} from "@/features/library/controllers/copy-details.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/meta", getCopyDetailsMetaController);
router.get("/download", downloadCopyDetailsExcelController);
router.post("/bulk-tag", bulkTagRfidController);
router.post("/reconcile", reconcileInventoryController);
router.get("/", getCopyDetailsListController);
router.get("/:id", getCopyDetailsByIdController);
router.post("/", createCopyDetailsController);
router.put("/:id", updateCopyDetailsController);
router.delete("/:id", deleteCopyDetailsController);

export default router;
