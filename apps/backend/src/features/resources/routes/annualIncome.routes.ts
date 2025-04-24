import express from "express";
import { getAllAnnualIncomes, UpdateAnnualIncome } from "@/features/resources/controllers/annualIncome.controller.js";

const router = express.Router();

router.get("/", getAllAnnualIncomes);
router.put("/:id", UpdateAnnualIncome);

export default router;