import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express, { Request, Response, NextFunction } from "express";
import { getFilteredSubjects } from "../controllers/subject.controller.js";

const router = express.Router();

// Public route for getting filtered subjects
router.get("/filtered", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getFilteredSubjects(req, res);
  } catch (error) {
    next(error);
  }
});

// Protected routes
router.use(verifyJWT);

export default router;
