import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { 
  createPersonalDetails, 
  getPersonalDetailsById, 
  getPersonalDetailsByStudentId,
  updatePersonalDetails,
  deletePersonalDetailsById,
  deletePersonalDetailsByStudentId
} from "../controllers/personalDetails.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create
router.post("/", createPersonalDetails);

// Read
router.get("/:id", getPersonalDetailsById);
router.get("/student/:studentId", getPersonalDetailsByStudentId);

// Update
router.put("/:id", updatePersonalDetails);

// Delete
router.delete("/:id", deletePersonalDetailsById);
router.delete("/student/:studentId", deletePersonalDetailsByStudentId);

export default router;