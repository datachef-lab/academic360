import express from "express";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { gradeModel } from "@repo/db/schemas";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await db.select().from(gradeModel).orderBy(gradeModel.id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Grades fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { courseId, classId, categoryId } = req.body;
    if (!courseId || !classId || !categoryId) {
      res
        .status(400)
        .json(new ApiError(400, "course, class and category are required"));
      return;
    }
    const [row] = await db
      .insert(gradeModel)
      .values({
        legacygradeId: req.body.legacygradeId ?? 0,
        courseId: Number(courseId),
        classId: Number(classId),
        categoryId: Number(categoryId),
        description: req.body.description ?? null,
        generalInstruction: req.body.generalInstruction ?? null,
      })
      .returning();
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", row, "Grade created."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data: Partial<typeof gradeModel.$inferInsert> = {};
    if (req.body.courseId !== undefined)
      data.courseId = Number(req.body.courseId);
    if (req.body.classId !== undefined) data.classId = Number(req.body.classId);
    if (req.body.categoryId !== undefined)
      data.categoryId = Number(req.body.categoryId);
    if (req.body.description !== undefined)
      data.description = req.body.description;
    if (req.body.generalInstruction !== undefined)
      data.generalInstruction = req.body.generalInstruction;
    const [row] = await db
      .update(gradeModel)
      .set(data)
      .where(eq(gradeModel.id, id))
      .returning();
    if (!row) {
      res.status(404).json(new ApiError(404, "Grade not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Grade updated."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .delete(gradeModel)
      .where(eq(gradeModel.id, id))
      .returning();
    if (!row) {
      res.status(404).json(new ApiError(404, "Grade not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Grade deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
});

export default router;
