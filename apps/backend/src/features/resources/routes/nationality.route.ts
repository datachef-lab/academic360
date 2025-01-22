import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.ts";
import {
  createNationality,
  deleteNationality,
  getAllNationality,
  updateNationality,
} from "../controllers/nationality.controller.ts";

const router = express.Router();
router.use(verifyJWT);

router.post("/", createNationality);
router.get("/", getAllNationality);
router.put("/", updateNationality);
router.delete("/", deleteNationality);

export default router;
