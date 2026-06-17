import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import { requestCdlAccess } from "@/features/library/controllers/cdl.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/:bookId/access", requestCdlAccess);
export default router;
