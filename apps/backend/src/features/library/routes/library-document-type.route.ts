import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createLibraryDocumentTypeController,
  deleteLibraryDocumentTypeController,
  getLibraryDocumentTypeByIdController,
  getLibraryDocumentTypeListController,
  updateLibraryDocumentTypeController,
} from "@/features/library/controllers/library-document-type.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getLibraryDocumentTypeListController);
router.get("/:id", getLibraryDocumentTypeByIdController);
router.post("/", createLibraryDocumentTypeController);
router.put("/:id", updateLibraryDocumentTypeController);
router.delete("/:id", deleteLibraryDocumentTypeController);

export default router;
