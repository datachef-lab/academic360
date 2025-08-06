import { Router } from "express";
import { bulkUploadController } from "../controllers/bulkUpload.controller.js";

const bulkUploadRouter = Router();

bulkUploadRouter.post("/", bulkUploadController.uploadFiles);

export default bulkUploadRouter;
