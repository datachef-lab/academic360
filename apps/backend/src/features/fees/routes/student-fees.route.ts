import { Router } from "express";
import * as studentFeesController from "../controllers/student-fees.controller.js";

const router = Router();

router.post("/", studentFeesController.createStudentFee);
router.get("/", studentFeesController.getAllStudentFees);
router.get("/:id", studentFeesController.getStudentFeeById);
router.put("/:id", studentFeesController.updateStudentFee);
router.delete("/:id", studentFeesController.deleteStudentFee);

export default router;
