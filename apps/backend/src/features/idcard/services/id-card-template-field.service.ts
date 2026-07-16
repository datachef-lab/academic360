import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  idCardTemplateFieldModel,
  idCardTemplateModel,
} from "@repo/db/schemas/index.js";

const VALID_KEYS = [
  "NAME",
  "COURSE",
  "UID",
  "MOBILE",
  "BLOOD_GROUP",
  "SPORTS_QUOTA",
  "QRCODE",
  "VALID_TILL_DATE",
  "PHOTO",
  "SHIFT",
] as const;

type FieldKey = (typeof VALID_KEYS)[number];

export type FieldAlign = "LEFT" | "CENTER" | "RIGHT";

export type FieldUpsertInput = {
  fieldKey: FieldKey;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  fontSize?: number | null;
  isVisible?: boolean;
  align?: FieldAlign;
};

const toAlign = (v: unknown): FieldAlign =>
  v === "CENTER" || v === "RIGHT" ? v : "LEFT";

const isFieldKey = (v: unknown): v is FieldKey =>
  typeof v === "string" && (VALID_KEYS as readonly string[]).includes(v);

export async function listFields(templateId: number) {
  return db
    .select()
    .from(idCardTemplateFieldModel)
    .where(eq(idCardTemplateFieldModel.templateId, templateId));
}

export async function upsertFieldsBulk(
  templateId: number,
  inputs: FieldUpsertInput[],
) {
  const [tpl] = await db
    .select({ id: idCardTemplateModel.id })
    .from(idCardTemplateModel)
    .where(eq(idCardTemplateModel.id, templateId))
    .limit(1);
  if (!tpl) throw new ApiError(404, "Template not found.");

  const cleaned: FieldUpsertInput[] = [];
  const seen = new Set<FieldKey>();
  for (const raw of inputs) {
    if (!isFieldKey(raw.fieldKey)) {
      throw new ApiError(400, `Invalid field key: ${raw.fieldKey}`);
    }
    if (seen.has(raw.fieldKey)) {
      throw new ApiError(400, `Duplicate field key: ${raw.fieldKey}`);
    }
    seen.add(raw.fieldKey);
    cleaned.push({
      fieldKey: raw.fieldKey,
      x: Math.max(0, Math.round(raw.x ?? 0)),
      y: Math.max(0, Math.round(raw.y ?? 0)),
      width: raw.width != null ? Math.max(0, Math.round(raw.width)) : null,
      height: raw.height != null ? Math.max(0, Math.round(raw.height)) : null,
      fontSize:
        raw.fontSize != null ? Math.max(1, Math.round(raw.fontSize)) : null,
      isVisible: raw.isVisible ?? true,
      align: toAlign(raw.align),
    });
  }

  const existing = await db
    .select()
    .from(idCardTemplateFieldModel)
    .where(eq(idCardTemplateFieldModel.templateId, templateId));
  const existingByKey = new Map(existing.map((r) => [r.fieldKey, r]));

  const incomingKeys = new Set(cleaned.map((c) => c.fieldKey));
  const toDelete = existing
    .filter((e) => !incomingKeys.has(e.fieldKey))
    .map((e) => e.id);

  await db.transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx
        .delete(idCardTemplateFieldModel)
        .where(inArray(idCardTemplateFieldModel.id, toDelete));
    }
    for (const c of cleaned) {
      const prior = existingByKey.get(c.fieldKey);
      if (prior) {
        await tx
          .update(idCardTemplateFieldModel)
          .set({
            x: c.x,
            y: c.y,
            width: c.width ?? null,
            height: c.height ?? null,
            fontSize: c.fontSize ?? null,
            isVisible: c.isVisible ?? true,
            align: c.align ?? "LEFT",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(idCardTemplateFieldModel.templateId, templateId),
              eq(idCardTemplateFieldModel.fieldKey, c.fieldKey),
            ),
          );
      } else {
        await tx.insert(idCardTemplateFieldModel).values({
          templateId,
          fieldKey: c.fieldKey,
          x: c.x,
          y: c.y,
          width: c.width ?? null,
          height: c.height ?? null,
          fontSize: c.fontSize ?? null,
          isVisible: c.isVisible ?? true,
          align: c.align ?? "LEFT",
        });
      }
    }
  });

  return listFields(templateId);
}
