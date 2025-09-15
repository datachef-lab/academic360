import { Router, RequestHandler } from "express";
import {
  createRestrictedGroupingClassHandler,
  deleteRestrictedGroupingClassHandler,
  getAllRestrictedGroupingClassesHandler,
  getRestrictedGroupingClassByIdHandler,
  getRestrictedGroupingClassesByMainIdHandler,
  updateRestrictedGroupingClassHandler,
  bulkUploadRestrictedGroupingClassesHandler,
} from "../controllers/restricted-grouping-class.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post("/", createRestrictedGroupingClassHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadRestrictedGroupingClassesHandler as RequestHandler,
);
router.get("/", getAllRestrictedGroupingClassesHandler as RequestHandler);
router.get(
  "/main/:mainId",
  getRestrictedGroupingClassesByMainIdHandler as RequestHandler,
);
router.get("/:id", getRestrictedGroupingClassByIdHandler as RequestHandler);
router.put("/:id", updateRestrictedGroupingClassHandler as RequestHandler);
router.delete("/:id", deleteRestrictedGroupingClassHandler as RequestHandler);

export default router;
