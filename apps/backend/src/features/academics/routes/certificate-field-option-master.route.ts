import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createCertificateFieldOptionHandler,
  deleteCertificateFieldOptionHandler,
  getCertificateFieldOptionByIdHandler,
  getCertificateFieldOptionsHandler,
  updateCertificateFieldOptionHandler,
} from "../controllers/certificate-field-option-master.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getCertificateFieldOptionsHandler));
router.get("/:id", asyncHandler(getCertificateFieldOptionByIdHandler));
router.post("/", asyncHandler(createCertificateFieldOptionHandler));
router.put("/:id", asyncHandler(updateCertificateFieldOptionHandler));
router.delete("/:id", asyncHandler(deleteCertificateFieldOptionHandler));

export default router;
