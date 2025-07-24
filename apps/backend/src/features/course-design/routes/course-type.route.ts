import express from "express";
import { createCourseTypeHandler, deleteCourseTypeHandler, getAllCourseTypesHandler, getCourseTypeByIdHandler, updateCourseTypeHandler } from "../../course-design/controllers/course-type.controller.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createCourseTypeHandler);
router.get("/", getAllCourseTypesHandler);
router.get("/query", (req, res, next) => {
    const { id } = req.query;
    if (id) {
        getCourseTypeByIdHandler(req, res, next);
    } else {
        getAllCourseTypesHandler(req, res, next);
    }
});
// router.put("/query", updateCourseTypeHandler);
// router.delete("/query", deleteCourseTypeHandler);

export default router; 