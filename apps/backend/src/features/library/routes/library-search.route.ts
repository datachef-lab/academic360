import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  unifiedSearchController,
  opacCopiesController,
} from "@/features/library/controllers/library-search.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/copies", opacCopiesController);
router.get("/", unifiedSearchController);
export default router;
