import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createCertificateMasterHandler,
  deleteCertificateMasterHandler,
  getAllCertificateMastersHandler,
  getCertificateMasterByIdHandler,
  updateCertificateMasterHandler,
} from "../controllers/certificate-master.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getAllCertificateMastersHandler));
router.get("/:id", asyncHandler(getCertificateMasterByIdHandler));
router.post("/", asyncHandler(createCertificateMasterHandler));
router.put("/:id", asyncHandler(updateCertificateMasterHandler));
router.delete("/:id", asyncHandler(deleteCertificateMasterHandler));

export default router;
