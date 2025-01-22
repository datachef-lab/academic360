import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.ts";
import {
  createReligion,
  deleteReligionRecord,
  getAllReligion,
  updateReligionRecord,
} from "../controllers/religion.controller.ts";

const router = express.Router();
router.use(verifyJWT);

router.post("/", createReligion);
router.get("/", getAllReligion);
router.put("/", updateReligionRecord);
router.delete("/", deleteReligionRecord);

export default router;
