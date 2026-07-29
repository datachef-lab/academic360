import express from "express";
import {
  createDocumentMetadata,
  deleteDocumentMetadata,
  getAllDocumentsMetadata,
  getDocument,
  getDocumentMetadataById,
  getDocumentMetadataByName,
  getExistingMarksheetFilesByRollNumber,
  updateDocumentMetadata,
  uploadDocument,
} from "@/features/academics/controllers/document.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createDocumentMetadata);

router.get("/", (req, res, next) => {
  const { id, name } = req.query;
  if (id) {
    return getDocumentMetadataById(req, res, next);
  } else if (name) {
    return getDocumentMetadataByName(req, res, next);
  } else {
    return getAllDocumentsMetadata(req, res, next);
  }
});

router.put("/:id", updateDocumentMetadata);

router.delete("/:id", deleteDocumentMetadata);

router.post("/get", getDocument);

router.post("/scan-marksheet", getExistingMarksheetFilesByRollNumber);

router.post("/upload", uploadDocument);

export default router;
