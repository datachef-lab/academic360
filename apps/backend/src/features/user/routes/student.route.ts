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
  getOnlineStudents,
  updateStudent,
  updateStudentStatus,
  updateFamilyMemberTitlesController,
  bulkUpdateFamilyMemberTitlesController,
  importStudentsFromExcelController,
  checkExistingStudentUidsController,
  exportStudentDetailedReportController,
  exportStudentAcademicSubjectsReportController,
  downloadStudentImagesController,
} from "../controllers/student.controller.js";

import { uploadMiddleware } from "../controllers/student-apaar-update.controller.js";
import { updateApaarIdsFromExcel } from "../controllers/student-apaar-update.controller.js";
import { updateCuRollAndRegistrationFromExcel } from "../controllers/student-cu-roll-reg-update.controller.js";

const router = express.Router();

router.use(verifyJWT);

// router.get("/old-data", createOldStudent);

router.get("/search", getSearchedStudents);

router.get("/search-rollno", getSearchedStudentsByRollNumber);
router.get("/filtered", getFilteredStudents);
router.get("/uid/:uid", getStudentByUid);
router.get("/online", getOnlineStudents);
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
router.put("/:id/status", updateStudentStatus);

// POST /api/students/uids/check-existing
// Check if any of the given UIDs already exist (prevents importing/updating existing students)
router.post("/uids/check-existing", checkExistingStudentUidsController);

// POST /api/students/update-apaar-ids
// Upload Excel file and update APAAR IDs for students
router.post("/update-apaar-ids", uploadMiddleware, updateApaarIdsFromExcel);

// POST /api/students/update-cu-roll-reg
// Upload Excel file and update CU Roll Number + CU Registration Number for students (matched by UID)
router.post(
  "/update-cu-roll-reg",
  uploadMiddleware,
  updateCuRollAndRegistrationFromExcel,
);

// POST /api/students/bulk-update-family-titles
// Upload Excel file and bulk update family member titles
router.post(
  "/bulk-update-family-titles",
  uploadMiddleware,
  bulkUpdateFamilyMemberTitlesController,
);

// POST /api/students/import-legacy-students
// Upload Excel file with a UID column and import/process legacy students
router.post(
  "/import-legacy-students",
  uploadMiddleware,
  importStudentsFromExcelController,
);

// PUT /api/students/:uid/family-titles
// Update family member titles (father, mother, guardian) for a student
router.put("/:uid/family-titles", updateFamilyMemberTitlesController);

router.get("/export/detailed-report", exportStudentDetailedReportController);
router.get(
  "/export/academic-subjects",
  exportStudentAcademicSubjectsReportController,
);

router.delete("/", deleteStudent);

router.get("/export/images", downloadStudentImagesController);

export default router;
