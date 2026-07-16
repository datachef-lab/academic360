import express from "express";
import { eq, ilike } from "drizzle-orm";
import { db } from "@/db/index.js";
import { admissionQuotaTypeModel } from "@repo/db/schemas";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(admissionQuotaTypeModel)
      .orderBy(admissionQuotaTypeModel.id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Quota types fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, shortName, printOnIdCard, isActive } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }
    // Quota type names must be unique (case-insensitive).
    const [duplicate] = await db
      .select({ id: admissionQuotaTypeModel.id })
      .from(admissionQuotaTypeModel)
      .where(ilike(admissionQuotaTypeModel.name, name.trim()));
    if (duplicate) {
      res
        .status(409)
        .json(new ApiError(409, `Quota type "${name.trim()}" already exists`));
      return;
    }
    const [row] = await db
      .insert(admissionQuotaTypeModel)
      .values({
        name: name.trim(),
        shortName: shortName?.trim() || null,
        printOnIdCard: !!printOnIdCard,
        isActive: isActive ?? true,
      })
      .returning();
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", row, "Quota type created."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data: Partial<typeof admissionQuotaTypeModel.$inferInsert> = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.shortName !== undefined)
      data.shortName = req.body.shortName?.trim() || null;
    if (req.body.printOnIdCard !== undefined)
      data.printOnIdCard = !!req.body.printOnIdCard;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    // Guard against renaming onto an existing (case-insensitive) name.
    if (data.name) {
      const [duplicate] = await db
        .select({ id: admissionQuotaTypeModel.id })
        .from(admissionQuotaTypeModel)
        .where(ilike(admissionQuotaTypeModel.name, data.name.trim()));
      if (duplicate && duplicate.id !== id) {
        res
          .status(409)
          .json(
            new ApiError(
              409,
              `Quota type "${data.name.trim()}" already exists`,
            ),
          );
        return;
      }
      data.name = data.name.trim();
    }
    const [row] = await db
      .update(admissionQuotaTypeModel)
      .set(data)
      .where(eq(admissionQuotaTypeModel.id, id))
      .returning();
    if (!row) {
      res.status(404).json(new ApiError(404, "Quota type not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Quota type updated."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .delete(admissionQuotaTypeModel)
      .where(eq(admissionQuotaTypeModel.id, id))
      .returning();
    if (!row) {
      res.status(404).json(new ApiError(404, "Quota type not found"));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Quota type deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
});

export default router;
