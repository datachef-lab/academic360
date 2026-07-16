import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";
import { evidenceDocModel } from "@repo/db/schemas/models/library/evidence-doc.model.js";

export type EvidenceDocUpsertInput = {
  criterionCode: string;
  title: string;
  description?: string | null;
  fileKey: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  tags?: string | null;
  academicYear?: string | null;
  uploadedByUserId?: number | null;
};

const buildWhere = (f: {
  search?: string;
  criterionCode?: string;
  academicYear?: string;
}): SQL | undefined => {
  const parts: SQL[] = [];
  if (f.search?.trim())
    parts.push(ilike(evidenceDocModel.title, `%${f.search.trim()}%`));
  if (f.criterionCode?.trim())
    parts.push(eq(evidenceDocModel.criterionCode, f.criterionCode.trim()));
  if (f.academicYear?.trim())
    parts.push(eq(evidenceDocModel.academicYear, f.academicYear.trim()));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findEvidenceDocsPaginated(filters: {
  page: number;
  limit: number;
  search?: string;
  criterionCode?: string;
  academicYear?: string;
}) {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(evidenceDocModel)
    .where(whereClause);
  const rows = await db
    .select()
    .from(evidenceDocModel)
    .where(whereClause)
    .orderBy(desc(evidenceDocModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getEvidenceDocById(id: number) {
  const [row] = await db
    .select()
    .from(evidenceDocModel)
    .where(eq(evidenceDocModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalize = (i: EvidenceDocUpsertInput) => {
  if (!i.criterionCode?.trim())
    throw new ApiError(400, "criterionCode is required.");
  if (!i.title?.trim()) throw new ApiError(400, "title is required.");
  if (!i.fileKey?.trim()) throw new ApiError(400, "fileKey is required.");
  return {
    criterionCode: i.criterionCode.trim(),
    title: i.title.trim(),
    description: i.description?.trim() || null,
    fileKey: i.fileKey.trim(),
    mimeType: i.mimeType?.trim() || null,
    fileSizeBytes: i.fileSizeBytes ?? null,
    tags: i.tags?.trim() || null,
    academicYear: i.academicYear?.trim() || null,
    uploadedByUserId: i.uploadedByUserId ?? null,
  };
};

export async function createEvidenceDoc(input: EvidenceDocUpsertInput) {
  const [r] = await db
    .insert(evidenceDocModel)
    .values(normalize(input))
    .returning({ id: evidenceDocModel.id });
  return r.id;
}

export async function updateEvidenceDoc(
  id: number,
  input: EvidenceDocUpsertInput,
) {
  await db
    .update(evidenceDocModel)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(evidenceDocModel.id, id));
}

export async function deleteEvidenceDoc(id: number) {
  await db.delete(evidenceDocModel).where(eq(evidenceDocModel.id, id));
}
