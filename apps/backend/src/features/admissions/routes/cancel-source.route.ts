import express from "express";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { cancelSourceModel } from "@repo/db/schemas";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(cancelSourceModel)
      .orderBy(cancelSourceModel.id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Cancel sources fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }
    const [row] = await db
      .insert(cancelSourceModel)
      // legacyCancelSourceId is NOT NULL with no default; use 0 for new rows.
      .values({
        name,
        legacyCancelSourceId: req.body.legacyCancelSourceId ?? 0,
      })
      .returning();
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", row, "Cancel source created."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data: Partial<typeof cancelSourceModel.$inferInsert> = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    const [row] = await db
      .update(cancelSourceModel)
      .set(data)
      .where(eq(cancelSourceModel.id, id))
      .returning();
    if (!row) {
      res.status(404).json(new ApiError(404, "Cancel source not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Cancel source updated."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .delete(cancelSourceModel)
      .where(eq(cancelSourceModel.id, id))
      .returning();
    if (!row) {
      res.status(404).json(new ApiError(404, "Cancel source not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Cancel source deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
});

export default router;
