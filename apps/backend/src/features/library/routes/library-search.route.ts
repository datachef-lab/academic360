import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import { unifiedSearchController } from "@/features/library/controllers/library-search.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", unifiedSearchController);
export default router;
