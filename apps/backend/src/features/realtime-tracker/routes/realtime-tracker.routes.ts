import { NextFunction, Request, Response, Router } from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  getAffiliationRegistrationHandler,
  getAffiliationTabLabelHandler,
  getFeeMisHandler,
} from "../controllers/realtime-tracker.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(verifyJWT);
router.get(
  "/affiliation-registration",
  asyncHandler(getAffiliationRegistrationHandler),
);
router.get("/fee-mis", asyncHandler(getFeeMisHandler));
router.get(
  "/affiliation-tab-label",
  asyncHandler(getAffiliationTabLabelHandler),
);

export default router;
