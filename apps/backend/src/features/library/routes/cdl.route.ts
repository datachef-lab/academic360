import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  closeCdlSessionController,
  requestCdlAccess,
  startCdlSessionController,
} from "@/features/library/controllers/cdl.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.post("/:bookId/sessions", startCdlSessionController);
router.post("/sessions/:sessionId/close", closeCdlSessionController);
// Legacy alias
router.get("/:bookId/access", requestCdlAccess);
export default router;
