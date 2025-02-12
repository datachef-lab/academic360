import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express, { Request, Response, NextFunction } from "express";
import { createOldStudent } from "../controllers/oldStudent.controller.js";
import { deleteStudent, getAllStudents, getSearchedStudents, getStudentById, updateStudent } from "../controllers/student.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/old-data", createOldStudent);

router.get("/search", getSearchedStudents);

router.get("/query", (req: Request, res: Response, next: NextFunction) => {
    const { id, page, pageSize } = req.query;

    if (page || pageSize) {
        return getAllStudents(req, res, next);
    }
    else if (id) {
        return getStudentById(req, res, next);
    }
    else {
        next();
    }
});

router.put("/", updateStudent);

router.delete("/", deleteStudent);

export default router;