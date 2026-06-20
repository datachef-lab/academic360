import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  deleteFromS3,
  getSignedUrlForFile,
  uploadToS3,
} from "@/services/s3.service.js";
import {
  academicYearModel,
  idCardIssueModel,
  idCardTemplateFieldModel,
  idCardTemplateModel,
} from "@repo/db/schemas/index.js";

export type TemplateUpsertInput = {
  academicYearId: number;
  name: string;
  description?: string | null;
  canvasWidthPx?: number;
  canvasHeightPx?: number;
  qrcodeSize?: number;
  validFrom?: string | null;
  validTill?: string | null;
  isDefault?: boolean;
  disabled?: boolean;
};

export type TemplateListFilters = {
  page: number;
  limit: number;
  search?: string;
  academicYearId?: number;
  includeDisabled?: boolean;
};

const IDCARD_TEMPLATE_FOLDER = "idcard/templates";

const normalize = (input: TemplateUpsertInput) => ({
  academicYearId: input.academicYearId,
  name: input.name.trim(),
  description: input.description?.trim() || null,
  canvasWidthPx: input.canvasWidthPx ?? 600,
  canvasHeightPx: input.canvasHeightPx ?? 900,
  qrcodeSize: input.qrcodeSize ?? 0,
  validFrom: input.validFrom || null,
  validTill: input.validTill || null,
  isDefault: input.isDefault ?? false,
  disabled: input.disabled ?? false,
});

const buildWhere = (
  filters: Omit<TemplateListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    parts.push(ilike(idCardTemplateModel.name, `%${filters.search.trim()}%`));
  }
  if (filters.academicYearId != null) {
    parts.push(eq(idCardTemplateModel.academicYearId, filters.academicYearId));
  }
  if (!filters.includeDisabled) {
    parts.push(eq(idCardTemplateModel.disabled, false));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function listTemplatesPaginated(filters: TemplateListFilters) {
  const { page, limit, ...rest } = filters;
  const where = buildWhere(rest);
  const offset = (page - 1) * limit;

  const [{ total }] = await db
    .select({ total: count() })
    .from(idCardTemplateModel)
    .where(where);

  const rows = await db
    .select({
      template: idCardTemplateModel,
      academicYear: academicYearModel,
    })
    .from(idCardTemplateModel)
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, idCardTemplateModel.academicYearId),
    )
    .where(where)
    .orderBy(desc(idCardTemplateModel.updatedAt))
    .limit(limit)
    .offset(offset);

  const data = await Promise.all(
    rows.map(async (r) => ({
      ...r.template,
      academicYear: r.academicYear,
      templateImageUrl: r.template.templateImageKey
        ? await getSignedUrlForFile(r.template.templateImageKey, 60 * 60).catch(
            () => null,
          )
        : null,
      backsideImageUrl: r.template.backsideImageKey
        ? await getSignedUrlForFile(r.template.backsideImageKey, 60 * 60).catch(
            () => null,
          )
        : null,
    })),
  );

  return { rows: data, total, page, limit };
}

export async function getTemplateById(id: number) {
  const [row] = await db
    .select()
    .from(idCardTemplateModel)
    .where(eq(idCardTemplateModel.id, id))
    .limit(1);
  if (!row) return null;

  const [ay] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, row.academicYearId))
    .limit(1);

  const fields = await db
    .select()
    .from(idCardTemplateFieldModel)
    .where(eq(idCardTemplateFieldModel.templateId, id));

  const templateImageUrl = row.templateImageKey
    ? await getSignedUrlForFile(row.templateImageKey, 60 * 60).catch(() => null)
    : null;
  const backsideImageUrl = row.backsideImageKey
    ? await getSignedUrlForFile(row.backsideImageKey, 60 * 60).catch(() => null)
    : null;

  return {
    ...row,
    templateImageUrl,
    backsideImageUrl,
    academicYear: ay ?? null,
    fields,
  };
}

async function uploadTemplateFile(
  file: Express.Multer.File,
  prefix: "tpl" | "back",
) {
  if (!file.mimetype?.startsWith("image/")) {
    throw new ApiError(400, "Template upload must be an image.");
  }
  const ext = file.originalname.split(".").pop() || "png";
  const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  return uploadToS3(file, {
    folder: prefix === "tpl" ? IDCARD_TEMPLATE_FOLDER : "idcard/backsides",
    customFileName: fileName,
    contentType: file.mimetype,
    maxFileSizeMB: 10,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  });
}

export async function createTemplate(
  input: TemplateUpsertInput,
  files: {
    templateImage?: Express.Multer.File;
    backsideImage?: Express.Multer.File;
  },
  createdByUserId?: number | null,
) {
  if (!input.name?.trim())
    throw new ApiError(400, "Template name is required.");
  if (!files.templateImage)
    throw new ApiError(400, "Template image is required.");
  const uploaded = await uploadTemplateFile(files.templateImage, "tpl");

  let backside: { key: string; url: string } | null = null;
  if (files.backsideImage) {
    const u = await uploadTemplateFile(files.backsideImage, "back");
    backside = { key: u.key, url: u.url };
  }

  const values = {
    ...normalize(input),
    templateImageKey: uploaded.key,
    templateImageUrl: uploaded.url,
    backsideImageKey: backside?.key ?? null,
    backsideImageUrl: backside?.url ?? null,
    createdByUserId: createdByUserId ?? null,
  };

  const [created] = await db
    .insert(idCardTemplateModel)
    .values(values)
    .returning({ id: idCardTemplateModel.id });

  return created.id;
}

export async function updateTemplate(
  id: number,
  input: TemplateUpsertInput,
  files: {
    templateImage?: Express.Multer.File;
    backsideImage?: Express.Multer.File;
  } = {},
) {
  const [existing] = await db
    .select()
    .from(idCardTemplateModel)
    .where(eq(idCardTemplateModel.id, id))
    .limit(1);
  if (!existing) throw new ApiError(404, "Template not found.");

  const patch: Record<string, unknown> = {
    ...normalize(input),
    updatedAt: new Date(),
  };

  if (files.templateImage) {
    const uploaded = await uploadTemplateFile(files.templateImage, "tpl");
    patch.templateImageKey = uploaded.key;
    patch.templateImageUrl = uploaded.url;
    if (existing.templateImageKey) {
      await deleteFromS3(existing.templateImageKey).catch((err) =>
        console.warn("Could not delete previous template image:", err),
      );
    }
  }
  if (files.backsideImage) {
    const uploaded = await uploadTemplateFile(files.backsideImage, "back");
    patch.backsideImageKey = uploaded.key;
    patch.backsideImageUrl = uploaded.url;
    if (existing.backsideImageKey) {
      await deleteFromS3(existing.backsideImageKey).catch((err) =>
        console.warn("Could not delete previous backside image:", err),
      );
    }
  }

  await db
    .update(idCardTemplateModel)
    .set(patch)
    .where(eq(idCardTemplateModel.id, id));
}

export async function deleteTemplate(id: number) {
  const [existing] = await db
    .select()
    .from(idCardTemplateModel)
    .where(eq(idCardTemplateModel.id, id))
    .limit(1);
  if (!existing) throw new ApiError(404, "Template not found.");

  const [{ issueCount }] = await db
    .select({ issueCount: count() })
    .from(idCardIssueModel)
    .where(eq(idCardIssueModel.templateId, id));

  if (issueCount > 0) {
    await db
      .update(idCardTemplateModel)
      .set({ disabled: true, updatedAt: new Date() })
      .where(eq(idCardTemplateModel.id, id));
    return;
  }

  await db.delete(idCardTemplateModel).where(eq(idCardTemplateModel.id, id));
  if (existing.templateImageKey) {
    await deleteFromS3(existing.templateImageKey).catch(() => undefined);
  }
}
