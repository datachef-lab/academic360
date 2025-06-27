import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
    createAcademicYearHandler,
    getAllAcademicYearsHandler,
    getAcademicYearByIdHandler,
    getCurrentAcademicYearHandler,
    updateAcademicYearHandler,
    deleteAcademicYearHandler,
    setCurrentAcademicYearHandler,
    findAcademicYearByYearRangeHandler
} from "../controllers/academic-year.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

// More specific routes first
router.get("/current", getCurrentAcademicYearHandler);
router.get("/search", findAcademicYearByYearRangeHandler);
router.get("/all", getAllAcademicYearsHandler);
router.get("/:id", getAcademicYearByIdHandler);
router.put("/:id", updateAcademicYearHandler);
router.delete("/:id", deleteAcademicYearHandler);

// Special operations
router.patch("/:id/set-current", setCurrentAcademicYearHandler);

router.post("/", createAcademicYearHandler);

export default router;
