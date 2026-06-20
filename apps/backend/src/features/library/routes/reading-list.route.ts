import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createItemController,
  createReadingListController,
  deleteItemController,
  deleteReadingListController,
  getReadingList,
  listItemsController,
  listReadingLists,
  updateReadingListController,
} from "@/features/library/controllers/reading-list.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listReadingLists);
router.get("/:id", getReadingList);
router.post("/", createReadingListController);
router.put("/:id", updateReadingListController);
router.delete("/:id", deleteReadingListController);
router.get("/:readingListId/items", listItemsController);
router.post("/:readingListId/items", createItemController);
router.delete("/items/:id", deleteItemController);
export default router;
