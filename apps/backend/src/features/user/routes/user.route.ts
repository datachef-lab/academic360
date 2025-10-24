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
  getUserStatsHandler,
  requestPasswordResetController,
  resetPasswordController,
  validateResetTokenController,
} from "../controllers/user.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

router.get("/:userId/profile", getProfileInfo);
// Export students to Excel
router.get("/export/students", exportStudents);
// Get user statistics
router.get("/stats", getUserStatsHandler);

// Password Reset Routes (no JWT required)
router.post("/password-reset/request", requestPasswordResetController);
router.post("/password-reset/reset", resetPasswordController);
router.get("/password-reset/validate/:token", validateResetTokenController);

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
