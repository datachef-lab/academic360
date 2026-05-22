import express from "express";
import {
  createClassHolidayController,
  deleteClassHolidayController,
  getAllClassHolidaysController,
  getClassHolidayByIdController,
  updateClassHolidayController,
} from "@/features/library/controllers/class-holiday.controller.js";

const router = express.Router();

router.post("/", createClassHolidayController);
router.get("/", getAllClassHolidaysController);
router.get("/:id", getClassHolidayByIdController);
router.put("/:id", updateClassHolidayController);
router.delete("/:id", deleteClassHolidayController);

export default router;
