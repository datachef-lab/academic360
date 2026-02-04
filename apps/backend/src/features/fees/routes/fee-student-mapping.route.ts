import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeStudentMappingHandler,
  deleteFeeStudentMappingHandler,
  getAllFeeStudentMappingsHandler,
  getFeeStudentMappingByIdHandler,
  getFeeStudentMappingsByStudentIdHandler,
  updateFeeStudentMappingHandler,
} from "../controllers/fee-student-mapping.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get("/", asyncHandler(getAllFeeStudentMappingsHandler));
router.get(
  "/student/:studentId",
  asyncHandler(getFeeStudentMappingsByStudentIdHandler),
);
router.get("/:id", asyncHandler(getFeeStudentMappingByIdHandler));
router.post("/", asyncHandler(createFeeStudentMappingHandler));
router.put("/:id", asyncHandler(updateFeeStudentMappingHandler));
router.delete("/:id", asyncHandler(deleteFeeStudentMappingHandler));

export default router;
