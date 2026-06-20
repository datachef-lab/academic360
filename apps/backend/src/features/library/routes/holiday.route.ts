import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createHolidayController,
  deleteHolidayController,
  getHolidayByIdController,
  getHolidayListController,
  updateHolidayController,
} from "@/features/library/controllers/holiday.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getHolidayListController);
router.get("/:id", getHolidayByIdController);
router.post("/", createHolidayController);
router.put("/:id", updateHolidayController);
router.delete("/:id", deleteHolidayController);

export default router;
