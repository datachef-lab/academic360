import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express, { NextFunction, Request, Response } from "express";
import { createPersonalDetails, getPersonalDetailsById, getPersonalDetailsByStudentId } from "../controllers/personalDetails.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createPersonalDetails)

router.get("/query", (req: Request, res: Response, next: NextFunction) => {
    const { id, studentId } = req.query;
    if (id) {
        return getPersonalDetailsById(req, res, next);
    }
    else if (studentId) {
        return getPersonalDetailsByStudentId(req, res, next);
    }
    next();
});

export default router;