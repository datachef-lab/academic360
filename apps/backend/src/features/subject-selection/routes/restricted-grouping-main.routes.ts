import { Router, RequestHandler } from "express";
import {
  createRestrictedGroupingMainHandler,
  deleteRestrictedGroupingMainHandler,
  getAllRestrictedGroupingMainsHandler,
  getRestrictedGroupingMainByIdHandler,
  updateRestrictedGroupingMainHandler,
  bulkUploadRestrictedGroupingMainsHandler,
} from "../controllers/restricted-grouping-main.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post("/", createRestrictedGroupingMainHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadRestrictedGroupingMainsHandler as RequestHandler,
);
router.get("/", getAllRestrictedGroupingMainsHandler as RequestHandler);
router.get("/:id", getRestrictedGroupingMainByIdHandler as RequestHandler);
router.put("/:id", updateRestrictedGroupingMainHandler as RequestHandler);
router.delete("/:id", deleteRestrictedGroupingMainHandler as RequestHandler);

export default router;
