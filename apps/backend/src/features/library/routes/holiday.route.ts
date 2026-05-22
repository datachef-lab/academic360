import express from "express";
import {
  createHolidayController,
  deleteHolidayController,
  getAllHolidaysController,
  getHolidayByIdController,
  updateHolidayController,
} from "@/features/library/controllers/holiday.controller.js";

const router = express.Router();

router.post("/", createHolidayController);
router.get("/", getAllHolidaysController);
router.get("/:id", getHolidayByIdController);
router.put("/:id", updateHolidayController);
router.delete("/:id", deleteHolidayController);

export default router;
