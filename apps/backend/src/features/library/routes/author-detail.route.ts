import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAuthorDetailController,
  deleteAuthorDetailController,
  getAuthorDetailsByBookIdController,
  replaceBookAuthorsController,
  updateAuthorDetailController,
} from "@/features/library/controllers/author-detail.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Nested under books — for use as /api/library/books/:bookId/authors
router.get("/books/:bookId/authors", getAuthorDetailsByBookIdController);
router.post("/books/:bookId/authors", createAuthorDetailController);
router.put("/books/:bookId/authors/bulk", replaceBookAuthorsController);

// Standalone — for admin CRUD by author-details id
router.put("/author-details/:id", updateAuthorDetailController);
router.delete("/author-details/:id", deleteAuthorDetailController);

export default router;
