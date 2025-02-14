import express from "express";
import { getAllAnnualIncomes } from "@/features/resources/controllers/annualIncome.controller.js";

const router = express.Router();

router.get("/", getAllAnnualIncomes);

export default router;