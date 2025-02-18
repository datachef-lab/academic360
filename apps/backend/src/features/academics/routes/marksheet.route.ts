import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { addMultipleMarksheet } from "../controllers/marksheet.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
import { deleteTempFile } from "@/middlewares/deleteTempFile.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/upload", uploadExcelMiddleware, addMultipleMarksheet, deleteTempFile)

export default router;
