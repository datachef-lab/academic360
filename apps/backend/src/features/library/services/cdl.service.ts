import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { eq } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { getSignedUrlForFile } from "@/services/s3.service.js";

export async function issueCdlAccess(bookId: number) {
  const [book] = await db
    .select({
      id: bookModel.id,
      title: bookModel.title,
      softCopy: bookModel.softCopy,
      cdlEnabled: bookModel.cdlEnabled,
      cdlConcurrentLimit: bookModel.cdlConcurrentLimit,
      cdlLoanHours: bookModel.cdlLoanHours,
    })
    .from(bookModel)
    .where(eq(bookModel.id, bookId))
    .limit(1);

  if (!book) throw new ApiError(404, "Book not found.");
  if (!book.cdlEnabled)
    throw new ApiError(
      409,
      "Controlled Digital Lending is not enabled for this title.",
    );
  if (!book.softCopy)
    throw new ApiError(409, "No soft copy is associated with this title.");

  const ttlSeconds = Math.max(60, (book.cdlLoanHours ?? 24) * 3600);
  const signedUrl = await getSignedUrlForFile(book.softCopy, ttlSeconds);

  return {
    bookId: book.id,
    title: book.title,
    signedUrl,
    expiresInSeconds: ttlSeconds,
    concurrentLimit: book.cdlConcurrentLimit ?? 1,
  };
}
