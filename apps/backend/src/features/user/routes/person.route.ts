import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createPerson,
  getPersonById,
  getAllPersonsController,
  updatePerson,
  deletePerson,
  updateFamilyMemberTitlesController,
} from "../controllers/person.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create
router.post("/", createPerson);
// Get all
router.get("/", getAllPersonsController);
// Get by id
router.get("/:id", getPersonById);
// Update
router.put("/:id", updatePerson);
// Delete
router.delete("/:id", deletePerson);
// Update family member titles for a student
router.put("/student/:uid/family-titles", updateFamilyMemberTitlesController);

export default router;
