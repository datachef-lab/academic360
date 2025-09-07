import express from "express";
import {
  createCourseTypeHandler,
  deleteCourseTypeHandler,
  getAllCourseTypesHandler,
  getCourseTypeByIdHandler,
  updateCourseTypeHandler,
  bulkUploadCourseTypesHandler,
} from "../../course-design/controllers/course-type.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);

// Course Type routes
router.post("/", createCourseTypeHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadCourseTypesHandler,
);
router.get("/", getAllCourseTypesHandler);
router.get("/:id", getCourseTypeByIdHandler);
router.put("/:id", updateCourseTypeHandler);
router.delete("/:id", deleteCourseTypeHandler);

router.get("/query", (req, res, next) => {
  const { id } = req.query;
  if (id) {
    getCourseTypeByIdHandler(req, res, next);
  } else {
    getAllCourseTypesHandler(req, res, next);
  }
});
router.put("/query", updateCourseTypeHandler);
router.delete("/query", deleteCourseTypeHandler);

export default router;
