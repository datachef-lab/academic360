import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createCareerProgressionFormFieldHandler,
  deleteCareerProgressionFormFieldHandler,
  getAllCareerProgressionFormFieldsHandler,
  getCareerProgressionFormFieldByIdHandler,
  updateCareerProgressionFormFieldHandler,
} from "../controllers/career-progression-form-field.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getAllCareerProgressionFormFieldsHandler));
router.get("/:id", asyncHandler(getCareerProgressionFormFieldByIdHandler));
router.post("/", asyncHandler(createCareerProgressionFormFieldHandler));
router.put("/:id", asyncHandler(updateCareerProgressionFormFieldHandler));
router.delete("/:id", asyncHandler(deleteCareerProgressionFormFieldHandler));

export default router;
