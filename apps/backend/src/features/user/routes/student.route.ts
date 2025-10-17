import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express, { Request, Response, NextFunction } from "express";
// import { createOldStudent } from "../controllers/oldStudent.controller.js";
import {
  deleteStudent,
  getAllStudents,
  getFilteredStudents,
  getSearchedStudents,
  getSearchedStudentsByRollNumber,
  getStudentById,
  getStudentByUid,
  updateStudent,
} from "../controllers/student.controller.js";

import { uploadMiddleware } from "../controllers/student-apaar-update.controller.js";
import { updateApaarIdsFromExcel } from "../controllers/student-apaar-update.controller.js";

const router = express.Router();

// router.use(verifyJWT);

// router.get("/old-data", createOldStudent);

router.get("/search", getSearchedStudents);

router.get("/search-rollno", getSearchedStudentsByRollNumber);
router.get("/filtered", getFilteredStudents);
router.get("/uid/:uid", getStudentByUid);
router.get("/query", (req: Request, res: Response, next: NextFunction) => {
  const { id, page, pageSize } = req.query;

  if (page || pageSize) {
    return getAllStudents(req, res, next);
  } else if (id) {
    return getStudentById(req, res, next);
  } else {
    next();
  }
});

router.put("/", updateStudent);

// POST /api/students/update-apaar-ids
// Upload Excel file and update APAAR IDs for students
router.post("/update-apaar-ids", uploadMiddleware, updateApaarIdsFromExcel);

router.delete("/", deleteStudent);

export default router;
