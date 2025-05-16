import { Router, Request, Response } from "express";
import { createCourseHandler, deleteCourseHandler, getAllCoursesHandler, getCourseByIdHandler, getCoursesByStreamIdHandler, searchCoursesHandler, updateCourseHandler } from "../controllers/course.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const courseRouter = Router();

// Public routes
courseRouter.get("/", (req: Request, res: Response): void => {
  getAllCoursesHandler(req, res);
});
courseRouter.get("/search", (req: Request, res: Response): void => {
  searchCoursesHandler(req, res);
});
courseRouter.get("/:id", (req: Request, res: Response): void => {
  getCourseByIdHandler(req, res);
});
courseRouter.get("/stream/:streamId", (req: Request, res: Response): void => {
  getCoursesByStreamIdHandler(req, res);
});

// Protected routes (require authentication)
courseRouter.post("/", verifyJWT, (req: Request, res: Response): void => {
  createCourseHandler(req, res);
});
courseRouter.put("/:id", verifyJWT, (req: Request, res: Response): void => {
  updateCourseHandler(req, res);
});
courseRouter.delete("/:id", verifyJWT, (req: Request, res: Response): void => {
  deleteCourseHandler(req, res);
});

export default courseRouter; 