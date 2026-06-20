import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import { seedLibraryNotifications } from "@/features/library/controllers/library-notification-seed.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.post("/seed", seedLibraryNotifications);
export default router;
