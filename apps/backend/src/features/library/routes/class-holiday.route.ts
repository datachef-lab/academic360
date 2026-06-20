import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createClassHolidayController,
  deleteClassHolidayController,
  getClassHolidayByIdController,
  getClassHolidayListController,
  updateClassHolidayController,
} from "@/features/library/controllers/class-holiday.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getClassHolidayListController);
router.get("/:id", getClassHolidayByIdController);
router.post("/", createClassHolidayController);
router.put("/:id", updateClassHolidayController);
router.delete("/:id", deleteClassHolidayController);

export default router;
