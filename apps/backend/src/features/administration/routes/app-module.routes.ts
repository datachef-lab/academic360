import { Router, RequestHandler } from "express";
import multer from "multer";
import {
  createAppModule,
  deleteAppModule,
  getAllAppModules,
  getAppModuleById,
  updateAppModule,
} from "../controllers/app-module.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/i;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image files (jpeg, png, gif, webp, svg) are allowed."),
      );
    }
  },
});

router.post("/", upload.single("image"), createAppModule as RequestHandler);

router.get("/", getAllAppModules as RequestHandler);

router.get("/:id", getAppModuleById as RequestHandler);

router.put("/:id", upload.single("image"), updateAppModule as RequestHandler);

router.delete("/:id", deleteAppModule as RequestHandler);

export default router;
