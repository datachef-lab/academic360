import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createCertificateFieldMasterHandler,
  deleteCertificateFieldMasterHandler,
  getAllCertificateFieldMastersHandler,
  getCertificateFieldMasterByIdHandler,
  updateCertificateFieldMasterHandler,
} from "../controllers/certificate-field-master.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getAllCertificateFieldMastersHandler));
router.get("/:id", asyncHandler(getCertificateFieldMasterByIdHandler));
router.post("/", asyncHandler(createCertificateFieldMasterHandler));
router.put("/:id", asyncHandler(updateCertificateFieldMasterHandler));
router.delete("/:id", asyncHandler(deleteCertificateFieldMasterHandler));

export default router;
