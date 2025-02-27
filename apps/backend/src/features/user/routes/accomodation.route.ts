import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";

import { createAccommodation, getAccommodationById, getAccommodationByStudentId, updateAccommodation } from "../controllers/accommodation.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAccommodation);

router.get("/query", (req, res, next) => {
    const { id, studentId } = req.query;

    if (id) {
        return getAccommodationById(req, res, next);
    } else if (studentId) {
        return getAccommodationByStudentId(req, res, next);
    }
    else {
        next();
    }
});

router.put("/:id", updateAccommodation);

export default router;