import { NextFunction, Request, Response, Router } from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { getFeesDashboardHandler } from "../controllers/fees-dashboard.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(verifyJWT);
router.get("/", asyncHandler(getFeesDashboardHandler));

export default router;
