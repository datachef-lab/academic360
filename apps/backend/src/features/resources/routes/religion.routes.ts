import express from "express";

import {
    createReligion,
    deleteReligionRecord,
    getAllReligion,
    updateReligionRecord,
} from "@/features/resources/controllers/religion.controller.js";

const router = express.Router();


router.post("/", createReligion);
router.get("/", getAllReligion);
router.put("/", updateReligionRecord);
router.delete("/", deleteReligionRecord);

export default router;
