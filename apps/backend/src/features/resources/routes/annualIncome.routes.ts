import express from "express";
import {
  getAllAnnualIncomes,
  getAnnualIncomeById,
  createAnnualIncomeController,
  updateAnnualIncomeController,
  deleteAnnualIncomeController,
  UpdateAnnualIncome, // Legacy function for backward compatibility
} from "@/features/resources/controllers/annualIncome.controller.js";

const router = express.Router();

// Create a new annual income
router.post("/", createAnnualIncomeController);

// Get all annual incomes
router.get("/", getAllAnnualIncomes);

// Get a specific annual income by ID
router.get("/:id", getAnnualIncomeById);

// Update an annual income
router.put("/:id", updateAnnualIncomeController);

// Delete an annual income
router.delete("/:id", deleteAnnualIncomeController);

export default router;
