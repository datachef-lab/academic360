import { Router } from "express";
import * as examGroupController from "@/features/exams/controllers/exam-group.controller";
import { verifyJWT } from "@/middlewares";

const router = Router();

router.use(verifyJWT); // Apply JWT verification to all routes in this router

router.get("/", examGroupController.getAllExamGroupsController);

router.get(
  "/candidates",
  examGroupController.getExamCandidatesByStudentIdAndExamGroupIdController,
);

router.get(
  "/paper-stats/:id",
  examGroupController.getExamGroupPaperStatsByIdController,
);

router.get("/:id", examGroupController.getExamGroupByIdController);

router.get(
  "/student/:studentId",
  examGroupController.getExamGroupByStudentIdController,
);

router.delete("/:id", examGroupController.deleteExamGroupByIdController);

export default router;
