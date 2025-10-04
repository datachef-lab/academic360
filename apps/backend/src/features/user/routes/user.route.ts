import express, { NextFunction, Request, Response } from "express";
import {
  getAllUsers,
  getSearchedUsers,
  getUserByEmail,
  getUserById,
  toggleDisableUser,
  updateUser,
  getProfileInfo,
  exportStudents,
} from "../controllers/user.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

router.get("/:userId/profile", getProfileInfo);
// Export students to Excel
router.get("/export/students", exportStudents);
router.use(verifyJWT);

// Profile

// Users
router.get("/", getAllUsers);

router.get("/search", getSearchedUsers);

router.get("/query", (req: Request, res: Response, next: NextFunction) => {
  const { id, email } = req.query as { id?: string; email?: string };
  if (id) {
    return getUserById(req, res, next);
  } else if (email) {
    return getUserByEmail(req, res, next);
  } else {
    next();
  }
});

router.put("/:id", updateUser);

router.put("/:id", toggleDisableUser);

export default router;
