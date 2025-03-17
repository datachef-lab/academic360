import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createPersonalDetails,
  deletePersonalDetails,
  getAllPersonalDetails,
  getPersonalDetailsById,
  getPersonalDetailsByStudentId,
  updatePersonalDetails,
} from "../controllers/personalDetails.controller";

const router = express.Router();

router.use(verifyJWT);


router.post("/", createPersonalDetails);
router.get("/", getAllPersonalDetails);
router.get("/:id", getPersonalDetailsById);
router.get("/student/:studentId", getPersonalDetailsByStudentId);
router.put("/:id", updatePersonalDetails);
router.delete("/:id", deletePersonalDetails);

export default router;