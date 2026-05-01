import express from "express";
import {
  createLibraryEntryExitController,
  deleteLibraryEntryExitController,
  downloadLibraryEntryExitExcelController,
  getAllLibraryEntryExitController,
  getLibraryEntryExitPreviewController,
  getLibraryEntryExitByIdController,
  searchLibraryUsersController,
  updateLibraryEntryExitController,
} from "@/features/library/controllers/library-entry-exit.controller.js";

const router = express.Router();

router.post("/", createLibraryEntryExitController);
router.get("/", getAllLibraryEntryExitController);
router.get("/download", downloadLibraryEntryExitExcelController);
router.get("/search-users", searchLibraryUsersController);
router.get("/preview/:userId", getLibraryEntryExitPreviewController);
router.get("/:id", getLibraryEntryExitByIdController);
router.put("/:id", updateLibraryEntryExitController);
router.delete("/:id", deleteLibraryEntryExitController);

export default router;
