import express from "express";

import { createCountry, deleteCountryRecord, getAllCountry, updateCountryRecord } from "../controllers/country.controller.ts";


const router = express.Router();


router.post("/", createCountry);
router.get("/", getAllCountry);
router.put("/", updateCountryRecord);
router.delete("/", deleteCountryRecord);

export default router;
