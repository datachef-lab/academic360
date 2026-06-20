import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createBranchController,
  deleteBranchController,
  getBranchByIdController,
  getBranchListController,
  updateBranchController,
} from "@/features/library/controllers/branch.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getBranchListController);
router.get("/:id", getBranchByIdController);
router.post("/", createBranchController);
router.put("/:id", updateBranchController);
router.delete("/:id", deleteBranchController);

export default router;
