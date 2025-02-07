import express from "express";

import {
  createNationality,
  deleteNationality,
  getAllNationality,
  updateNationality,
} from "../controllers/nationality.controller.js";

const router = express.Router();


router.post("/", createNationality);
router.get("/", getAllNationality);
router.put("/", updateNationality);
router.delete("/", deleteNationality);

export default router;
