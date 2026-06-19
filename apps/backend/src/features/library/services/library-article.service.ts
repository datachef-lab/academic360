import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { libraryArticleModel } from "@repo/db/schemas/models/library/library-article.model.js";
import { libraryDocumentTypeModel } from "@repo/db/schemas/models/library/library-document-type.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type LibraryArticleListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type LibraryArticleListRow = {
  id: number;
  legacyLibraryArticleId: number | null;
  name: string;
  code: string | null;
  isDocumentTypeExist: boolean;
  isUniqueAccessNumber: boolean;
  isJournal: boolean;
  isAuthor: boolean;
  isImprint: boolean;
  isCopyDetail: boolean;
  isKeyword: boolean;
  isRemarks: boolean;
  isCallNumber: boolean;
  isEnclosure: boolean;
  isVoucher: boolean;
  isAnalytical: boolean;
  isCallNumberAuto: boolean;
  isCallNumberCompulsory: boolean;
  isPublisher: boolean;
  isNote: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type LibraryArticleListResult = {
  rows: LibraryArticleListRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryArticleUpsertInput = Omit<
  LibraryArticleListRow,
  "id" | "legacyLibraryArticleId" | "createdAt" | "updatedAt"
>;

const buildListWhere = (
  filters: Omit<LibraryArticleListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    parts.push(
      or(
        ilike(libraryArticleModel.name, term),
        ilike(libraryArticleModel.code, term),
      )!,
    );
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findLibraryArticlesPaginated(
  filters: LibraryArticleListFilters,
): Promise<LibraryArticleListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(libraryArticleModel)
    .where(whereClause);

  const rows = await db
    .select({
      id: libraryArticleModel.id,
      legacyLibraryArticleId: libraryArticleModel.legacyLibraryArticleId,
      name: libraryArticleModel.name,
      code: libraryArticleModel.code,
      isDocumentTypeExist: libraryArticleModel.isDocumentTypeExist,
      isUniqueAccessNumber: libraryArticleModel.isUniqueAccessNumber,
      isJournal: libraryArticleModel.isJournal,
      isAuthor: libraryArticleModel.isAuthor,
      isImprint: libraryArticleModel.isImprint,
      isCopyDetail: libraryArticleModel.isCopyDetail,
      isKeyword: libraryArticleModel.isKeyword,
      isRemarks: libraryArticleModel.isRemarks,
      isCallNumber: libraryArticleModel.isCallNumber,
      isEnclosure: libraryArticleModel.isEnclosure,
      isVoucher: libraryArticleModel.isVoucher,
      isAnalytical: libraryArticleModel.isAnalytical,
      isCallNumberAuto: libraryArticleModel.isCallNumberAuto,
      isCallNumberCompulsory: libraryArticleModel.isCallNumberCompulsory,
      isPublisher: libraryArticleModel.isPublisher,
      isNote: libraryArticleModel.isNote,
      createdAt: libraryArticleModel.createdAt,
      updatedAt: libraryArticleModel.updatedAt,
    })
    .from(libraryArticleModel)
    .where(whereClause)
    .orderBy(desc(libraryArticleModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getLibraryArticleById(
  id: number,
): Promise<LibraryArticleListRow | null> {
  const [row] = await db
    .select({
      id: libraryArticleModel.id,
      legacyLibraryArticleId: libraryArticleModel.legacyLibraryArticleId,
      name: libraryArticleModel.name,
      code: libraryArticleModel.code,
      isDocumentTypeExist: libraryArticleModel.isDocumentTypeExist,
      isUniqueAccessNumber: libraryArticleModel.isUniqueAccessNumber,
      isJournal: libraryArticleModel.isJournal,
      isAuthor: libraryArticleModel.isAuthor,
      isImprint: libraryArticleModel.isImprint,
      isCopyDetail: libraryArticleModel.isCopyDetail,
      isKeyword: libraryArticleModel.isKeyword,
      isRemarks: libraryArticleModel.isRemarks,
      isCallNumber: libraryArticleModel.isCallNumber,
      isEnclosure: libraryArticleModel.isEnclosure,
      isVoucher: libraryArticleModel.isVoucher,
      isAnalytical: libraryArticleModel.isAnalytical,
      isCallNumberAuto: libraryArticleModel.isCallNumberAuto,
      isCallNumberCompulsory: libraryArticleModel.isCallNumberCompulsory,
      isPublisher: libraryArticleModel.isPublisher,
      isNote: libraryArticleModel.isNote,
      createdAt: libraryArticleModel.createdAt,
      updatedAt: libraryArticleModel.updatedAt,
    })
    .from(libraryArticleModel)
    .where(eq(libraryArticleModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createLibraryArticle(
  input: LibraryArticleUpsertInput,
): Promise<number> {
  await assertUniqueLibraryName({
    table: libraryArticleModel,
    nameColumn: libraryArticleModel.name,
    idColumn: libraryArticleModel.id,
    value: input.name,
    label: "Article",
  });
  const [inserted] = await db
    .insert(libraryArticleModel)
    .values({
      name: input.name.trim(),
      code: input.code?.trim() || null,
      isDocumentTypeExist: input.isDocumentTypeExist === true,
      isUniqueAccessNumber: input.isUniqueAccessNumber === true,
      isJournal: input.isJournal === true,
      isAuthor: input.isAuthor === true,
      isImprint: input.isImprint === true,
      isCopyDetail: input.isCopyDetail === true,
      isKeyword: input.isKeyword === true,
      isRemarks: input.isRemarks === true,
      isCallNumber: input.isCallNumber === true,
      isEnclosure: input.isEnclosure === true,
      isVoucher: input.isVoucher === true,
      isAnalytical: input.isAnalytical === true,
      isCallNumberAuto: input.isCallNumberAuto === true,
      isCallNumberCompulsory: input.isCallNumberCompulsory === true,
      isPublisher: input.isPublisher === true,
      isNote: input.isNote === true,
    })
    .returning({ id: libraryArticleModel.id });
  return inserted.id;
}

export async function updateLibraryArticle(
  id: number,
  input: LibraryArticleUpsertInput,
): Promise<void> {
  await assertUniqueLibraryName({
    table: libraryArticleModel,
    nameColumn: libraryArticleModel.name,
    idColumn: libraryArticleModel.id,
    value: input.name,
    label: "Article",
    excludeId: id,
  });
  await db
    .update(libraryArticleModel)
    .set({
      name: input.name.trim(),
      code: input.code?.trim() || null,
      isDocumentTypeExist: input.isDocumentTypeExist === true,
      isUniqueAccessNumber: input.isUniqueAccessNumber === true,
      isJournal: input.isJournal === true,
      isAuthor: input.isAuthor === true,
      isImprint: input.isImprint === true,
      isCopyDetail: input.isCopyDetail === true,
      isKeyword: input.isKeyword === true,
      isRemarks: input.isRemarks === true,
      isCallNumber: input.isCallNumber === true,
      isEnclosure: input.isEnclosure === true,
      isVoucher: input.isVoucher === true,
      isAnalytical: input.isAnalytical === true,
      isCallNumberAuto: input.isCallNumberAuto === true,
      isCallNumberCompulsory: input.isCallNumberCompulsory === true,
      isPublisher: input.isPublisher === true,
      isNote: input.isNote === true,
      updatedAt: new Date(),
    })
    .where(eq(libraryArticleModel.id, id));
}

export async function deleteLibraryArticle(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(libraryDocumentTypeModel)
    .where(eq(libraryDocumentTypeModel.libraryArticleId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This library article cannot be deleted because it is linked to ${linkedCount} library document type record(s).`,
    );
  }

  await db.delete(libraryArticleModel).where(eq(libraryArticleModel.id, id));
}
