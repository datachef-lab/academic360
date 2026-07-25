import { Router } from "express";
import * as feeDueDeclarationController from "../controllers/fee-due-declaration.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = Router();

router.use(verifyJWT);

router.get(
  "/student/:studentId",
  feeDueDeclarationController.getFeeDueDeclaration,
);
router.post("/", feeDueDeclarationController.createFeeDueDeclaration);

export default router;
