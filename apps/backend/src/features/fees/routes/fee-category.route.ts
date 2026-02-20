import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeCategoryHandler,
  deleteFeeCategoryHandler,
  getAllFeeCategoriesHandler,
  getFeeCategoryByIdHandler,
  updateFeeCategoryHandler,
} from "../controllers/fee-category.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Apply authentication middleware to all routes
router.use(verifyJWT);

router.get("/", asyncHandler(getAllFeeCategoriesHandler));
router.get("/:id", asyncHandler(getFeeCategoryByIdHandler));
router.post("/", asyncHandler(createFeeCategoryHandler));
router.put("/:id", asyncHandler(updateFeeCategoryHandler));
router.delete("/:id", asyncHandler(deleteFeeCategoryHandler));

export default router;
