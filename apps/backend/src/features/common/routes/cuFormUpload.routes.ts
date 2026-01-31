import { Router } from "express";
import { cuFormUploadController } from "../controllers/cuFormUpload.controller.js";

const cuFormUploadRouter = Router();

/**
 * @route POST /api/cu-form-upload
 * @desc Upload CU Semester I Examination Form
 * @access Private (requires authentication)
 */
cuFormUploadRouter.post("/", cuFormUploadController.uploadForm);

export default cuFormUploadRouter;
