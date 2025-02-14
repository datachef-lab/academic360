import express from "express";

import { createCountry, deleteCountryRecord, getAllCountry, updateCountryRecord } from "@/features/resources/controllers/country.controller.js";


const router = express.Router();


router.post("/", createCountry);
router.get("/", getAllCountry);
router.put("/", updateCountryRecord);
router.delete("/", deleteCountryRecord);

export default router;
