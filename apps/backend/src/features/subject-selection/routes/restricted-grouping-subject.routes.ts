import { Router, RequestHandler } from "express";
import {
  createRestrictedGroupingSubjectHandler,
  deleteRestrictedGroupingSubjectHandler,
  getAllRestrictedGroupingSubjectsHandler,
  getRestrictedGroupingSubjectByIdHandler,
  getRestrictedGroupingSubjectsByMainIdHandler,
  updateRestrictedGroupingSubjectHandler,
  bulkUploadRestrictedGroupingSubjectsHandler,
} from "../controllers/restricted-grouping-subject.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post("/", createRestrictedGroupingSubjectHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadRestrictedGroupingSubjectsHandler as RequestHandler,
);
router.get("/", getAllRestrictedGroupingSubjectsHandler as RequestHandler);
router.get(
  "/main/:mainId",
  getRestrictedGroupingSubjectsByMainIdHandler as RequestHandler,
);
router.get("/:id", getRestrictedGroupingSubjectByIdHandler as RequestHandler);
router.put("/:id", updateRestrictedGroupingSubjectHandler as RequestHandler);
router.delete("/:id", deleteRestrictedGroupingSubjectHandler as RequestHandler);

export default router;
