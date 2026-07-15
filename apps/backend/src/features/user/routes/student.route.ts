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
  precheckImportStudentsController,
  backfillStudentQuotaTypesController,
  exportStudentDetailedReportController,
  exportStudentAcademicSubjectsReportController,
  downloadStudentImagesController,
  exportEnrolmentMasterReportController,
  changeStudentShiftController,
  changeStudentShiftPreviewController,
  updateActivePromotionFieldsController,
} from "../controllers/student.controller.js";

import { uploadMiddleware } from "../controllers/student-apaar-update.controller.js";
import { updateApaarIdsFromExcel } from "../controllers/student-apaar-update.controller.js";
import { updateCuRollAndRegistrationFromExcel } from "../controllers/student-cu-roll-reg-update.controller.js";
import { getStudentAvatarController } from "../controllers/student-avatar.controller.js";

const router = express.Router();

// Publicly resolvable: the avatar resolver itself only ever returns the same
// bytes you'd get from the existing public besc.academic360.app image URL.
// Browsers cannot attach a JWT to <img> tags, so this must sit before the
// verifyJWT guard.
router.get("/uid/:uid/avatar", getStudentAvatarController);

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
router.get("/:id/shift-change/preview", changeStudentShiftPreviewController);
router.post("/:id/shift-change", changeStudentShiftController);
router.patch(
  "/:id/active-promotion-fields",
  updateActivePromotionFieldsController,
);

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

// POST /api/students/import-legacy-students/precheck
// Read-only: report which UIDs in the Excel already exist vs are new
router.post(
  "/import-legacy-students/precheck",
  uploadMiddleware,
  precheckImportStudentsController,
);

// POST /api/students/import-legacy-students
// Upload Excel file with a UID column and import/process legacy students
router.post(
  "/import-legacy-students",
  uploadMiddleware,
  importStudentsFromExcelController,
);

// POST /api/students/backfill-quota-types
// Backfill quota type for already-imported students whose quotaTypeId is unset
router.post("/backfill-quota-types", backfillStudentQuotaTypesController);

// PUT /api/students/:uid/family-titles
// Update family member titles (father, mother, guardian) for a student
router.put("/:uid/family-titles", updateFamilyMemberTitlesController);

router.get("/export/detailed-report", exportStudentDetailedReportController);
router.get(
  "/export/academic-subjects",
  exportStudentAcademicSubjectsReportController,
);

router.get("/export/enrolment-master", exportEnrolmentMasterReportController);

router.delete("/", deleteStudent);

router.get("/export/images", downloadStudentImagesController);

export default router;
