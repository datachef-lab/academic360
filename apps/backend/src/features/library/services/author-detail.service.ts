import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, eq } from "drizzle-orm";
import { authorDetailsModel } from "@repo/db/schemas/models/library/author-detail.model.js";
import { authorModel } from "@repo/db/schemas/models/library/author.model.js";
import { authorTypeModel } from "@repo/db/schemas/models/library/author-type.model.js";

export type AuthorDetailRow = {
  id: number;
  bookId: number;
  authorId: number;
  authorName: string;
  authorShortName: string | null;
  authorTypeId: number;
  authorTypeName: string;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthorDetailUpsertInput = {
  bookId: number;
  authorId: number;
  authorTypeId: number;
  remarks?: string | null;
};

const DETAIL_COLUMNS = {
  id: authorDetailsModel.id,
  bookId: authorDetailsModel.bookId,
  authorId: authorDetailsModel.authorId,
  authorName: authorModel.name,
  authorShortName: authorModel.shortName,
  authorTypeId: authorDetailsModel.authorTypeId,
  authorTypeName: authorTypeModel.name,
  remarks: authorDetailsModel.remarks,
  createdAt: authorDetailsModel.createdAt,
  updatedAt: authorDetailsModel.updatedAt,
};

export async function findAuthorDetailsByBookId(
  bookId: number,
): Promise<AuthorDetailRow[]> {
  return db
    .select(DETAIL_COLUMNS)
    .from(authorDetailsModel)
    .innerJoin(authorModel, eq(authorModel.id, authorDetailsModel.authorId))
    .innerJoin(
      authorTypeModel,
      eq(authorTypeModel.id, authorDetailsModel.authorTypeId),
    )
    .where(eq(authorDetailsModel.bookId, bookId))
    .orderBy(authorDetailsModel.id);
}

export async function getAuthorDetailById(
  id: number,
): Promise<AuthorDetailRow | null> {
  const [row] = await db
    .select(DETAIL_COLUMNS)
    .from(authorDetailsModel)
    .innerJoin(authorModel, eq(authorModel.id, authorDetailsModel.authorId))
    .innerJoin(
      authorTypeModel,
      eq(authorTypeModel.id, authorDetailsModel.authorTypeId),
    )
    .where(eq(authorDetailsModel.id, id))
    .limit(1);
  return row ?? null;
}

const ensureNotDuplicate = async (
  input: AuthorDetailUpsertInput,
  excludeId?: number,
) => {
  const conditions = [
    eq(authorDetailsModel.bookId, input.bookId),
    eq(authorDetailsModel.authorId, input.authorId),
    eq(authorDetailsModel.authorTypeId, input.authorTypeId),
  ];
  const existing = await db
    .select({ id: authorDetailsModel.id })
    .from(authorDetailsModel)
    .where(and(...conditions));
  const conflict = existing.find((row) => row.id !== excludeId);
  if (conflict) {
    throw new ApiError(
      409,
      "This author and role combination already exists for this book.",
    );
  }
};

export async function createAuthorDetail(
  input: AuthorDetailUpsertInput,
): Promise<number> {
  await ensureNotDuplicate(input);
  const [inserted] = await db
    .insert(authorDetailsModel)
    .values({
      bookId: input.bookId,
      authorId: input.authorId,
      authorTypeId: input.authorTypeId,
      remarks: input.remarks?.trim() ? input.remarks.trim() : null,
    })
    .returning({ id: authorDetailsModel.id });
  return inserted.id;
}

export async function updateAuthorDetail(
  id: number,
  input: AuthorDetailUpsertInput,
): Promise<void> {
  await ensureNotDuplicate(input, id);
  await db
    .update(authorDetailsModel)
    .set({
      bookId: input.bookId,
      authorId: input.authorId,
      authorTypeId: input.authorTypeId,
      remarks: input.remarks?.trim() ? input.remarks.trim() : null,
      updatedAt: new Date(),
    })
    .where(eq(authorDetailsModel.id, id));
}

export async function deleteAuthorDetail(id: number): Promise<void> {
  await db.delete(authorDetailsModel).where(eq(authorDetailsModel.id, id));
}

export async function replaceBookAuthors(
  bookId: number,
  rows: Array<Omit<AuthorDetailUpsertInput, "bookId">>,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(authorDetailsModel)
      .where(eq(authorDetailsModel.bookId, bookId));
    if (rows.length === 0) return;
    await tx.insert(authorDetailsModel).values(
      rows.map((row) => ({
        bookId,
        authorId: row.authorId,
        authorTypeId: row.authorTypeId,
        remarks: row.remarks?.trim() ? row.remarks.trim() : null,
      })),
    );
  });
}
