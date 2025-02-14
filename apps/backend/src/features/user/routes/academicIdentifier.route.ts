import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { createAcademicIdentifier, getAcademicIdentifierById, getAcademicIdentifierByStudentId, updateAcademicIdentifier } from "../controllers/academicIdentifier.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAcademicIdentifier);

router.get("/query", (req, res, next) => {
    const { id, studentId } = req.query;

    if (id) {
        return getAcademicIdentifierById(req, res, next);
    } else if (studentId) {
        return getAcademicIdentifierByStudentId(req, res, next);
    }
    else {
        next();
    }

});

router.put("/:id", updateAcademicIdentifier);

export default router;