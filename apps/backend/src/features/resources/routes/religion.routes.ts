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
router.put("/:id", updateReligionRecord);
router.delete("/:id", deleteReligionRecord);

export default router;
