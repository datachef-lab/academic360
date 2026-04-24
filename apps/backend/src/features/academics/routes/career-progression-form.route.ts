import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createCareerProgressionFormHandler,
  deleteCareerProgressionFormHandler,
  getCareerProgressionTemplateForStudentCurrentYearHandler,
  getAllCareerProgressionFormsHandler,
  getCareerProgressionFormByIdHandler,
  submitCareerProgressionForStudentCurrentYearHandler,
  updateCareerProgressionFormHandler,
} from "../controllers/career-progression-form.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getAllCareerProgressionFormsHandler));
router.get(
  "/student/:studentId/current",
  asyncHandler(getCareerProgressionTemplateForStudentCurrentYearHandler),
);
router.post(
  "/student/:studentId/current/submit",
  asyncHandler(submitCareerProgressionForStudentCurrentYearHandler),
);
router.get("/:id", asyncHandler(getCareerProgressionFormByIdHandler));
router.post("/", asyncHandler(createCareerProgressionFormHandler));
router.put("/:id", asyncHandler(updateCareerProgressionFormHandler));
router.delete("/:id", asyncHandler(deleteCareerProgressionFormHandler));

export default router;
