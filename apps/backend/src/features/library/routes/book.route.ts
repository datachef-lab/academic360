import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createBookController,
  deleteBookController,
  downloadBookExcelController,
  federatedCatalogSearchController,
  getBookByIdController,
  getBookListController,
  getBookDublinCoreController,
  getBooksMetaController,
  importMarcController,
  importMarcMiddleware,
  uploadBookCoverMiddleware,
  updateBookController,
} from "@/features/library/controllers/book.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/meta", getBooksMetaController);
router.get("/download", downloadBookExcelController);
router.post("/import-marc", importMarcMiddleware, importMarcController);
router.get("/federated-search", federatedCatalogSearchController);
router.get("/:id/dublin-core", getBookDublinCoreController);
router.get("/", getBookListController);
router.get("/:id", getBookByIdController);
router.post("/", uploadBookCoverMiddleware, createBookController);
router.put("/:id", uploadBookCoverMiddleware, updateBookController);
router.delete("/:id", deleteBookController);

export default router;
