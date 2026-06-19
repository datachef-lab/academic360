import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import { getLibraryClearanceController } from "@/features/library/controllers/library-clearance.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/:userId", getLibraryClearanceController);
export default router;
