import express from "express";
import {
    createDocumentMetadata,
    deleteDocumentMetadata,
    getAllDocumentsMetadata,
    getDocument,
    getDocumentMetadataById,
    getDocumentMetadataByName,
    updateDocumentMetadata,
    uploadDocument,
} from "@/features/academics/controllers/document.controller.ts";

const router = express.Router();

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

router.post("/upload", uploadDocument);

export default router;
