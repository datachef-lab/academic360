import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.ts";
import { createCountry, deleteCountryRecord, getAllCountry, updateCountryRecord } from "../controllers/country.controller.ts";


const router = express.Router();


router.post("/", createCountry);
router.get("/", getAllCountry);
router.put("/", updateCountryRecord);
router.delete("/", deleteCountryRecord);

export default router;
