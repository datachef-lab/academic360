import express from "express";
import { getAllAnnualIncomes } from "../controllers/annualIncome.controller.ts";

const router = express.Router();

router.get("/", getAllAnnualIncomes);

export default router;