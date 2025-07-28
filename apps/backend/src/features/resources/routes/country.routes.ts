import express from "express";

import { createCountry, deleteCountryRecord, getAllCountry, getCountryById, updateCountryRecord } from "@/features/resources/controllers/country.controller.js";


const router = express.Router();


router.post("/", createCountry);
router.get("/", getAllCountry);
router.get("/:id", getCountryById);
router.put("/:id", updateCountryRecord);
router.delete("/:id", deleteCountryRecord);

export default router;
