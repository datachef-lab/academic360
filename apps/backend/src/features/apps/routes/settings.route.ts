import express from "express";
import multer from "multer";
// import { verifyJWT } from "@/middlewares/index.js";
import {
  getAllSettingsHandler,
  getBrandingHandler,
  getSettingFileController,
  getSettingsByIdHandler,
  updateSettingByIdHandler,
} from "../controllers/settings.controller.js";

const router = express.Router();
const upload = multer(); // Use memory storage for files

// router.use(verifyJWT);

router.get("/", getAllSettingsHandler);
router.get("/branding", getBrandingHandler);
router.get("/:id", getSettingsByIdHandler);
router.put("/:id", upload.single("file"), updateSettingByIdHandler); // ✅ Add this
router.get("/file/:idOrName", getSettingFileController);

export default router;
