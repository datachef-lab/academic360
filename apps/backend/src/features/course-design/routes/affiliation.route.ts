import express from "express";
import {
  createAffiliationHandler,
  deleteAffiliationHandler,
  getAllAffiliationsHandler,
  getAffiliationByIdHandler,
  updateAffiliationHandler,
  bulkUploadAffiliationsHandler,
} from "../../course-design/controllers/affiliation.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createAffiliationHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadAffiliationsHandler as RequestHandler,
);
router.get("/", getAllAffiliationsHandler as RequestHandler);
router.get("/query", (req, res, next) => {
  const { id } = req.query;
  if (id) {
    getAffiliationByIdHandler(req, res, next);
  } else {
    getAllAffiliationsHandler(req, res, next);
  }
});
router.put("/query", updateAffiliationHandler as RequestHandler);
router.delete("/query", deleteAffiliationHandler as RequestHandler);

export default router;
