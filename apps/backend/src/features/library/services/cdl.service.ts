/**
 * Controlled Digital Lending (CDL) — session-tracked, time-limited.
 *
 * Watermark is applied client-side (CSS overlay over the PDF viewer) using the
 * `watermark` block returned here.
 */

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, eq, gt } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { cdlSessionModel } from "@repo/db/schemas/models/library/cdl-session.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { getSignedUrlForFile } from "@/services/s3.service.js";

export type CdlSessionPayload = {
  sessionId: number;
  bookId: number;
  title: string;
  signedUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
  watermark: {
    userName: string;
    uid: string | null;
    timestamp: string;
  };
};

export async function startCdlSession(
  bookId: number,
  userId: number,
): Promise<CdlSessionPayload> {
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

  const now = new Date();
  const active = await db
    .select({ id: cdlSessionModel.id })
    .from(cdlSessionModel)
    .where(
      and(
        eq(cdlSessionModel.bookId, bookId),
        eq(cdlSessionModel.isActive, true),
        gt(cdlSessionModel.expiresAt, now),
      ),
    );
  const limit = book.cdlConcurrentLimit ?? 1;
  if (active.length >= limit) {
    throw new ApiError(
      429,
      `All ${limit} concurrent reading slot(s) for this title are currently in use. Try again later.`,
    );
  }

  const ttlSeconds = Math.max(60, (book.cdlLoanHours ?? 24) * 3600);
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const signedUrl = await getSignedUrlForFile(book.softCopy, ttlSeconds);

  const [session] = await db
    .insert(cdlSessionModel)
    .values({ bookId, userId, startedAt: now, expiresAt, isActive: true })
    .returning({ id: cdlSessionModel.id });

  const [reader] = await db
    .select({ name: userModel.name, uid: studentModel.uid })
    .from(userModel)
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .where(eq(userModel.id, userId))
    .limit(1);

  return {
    sessionId: session.id,
    bookId: book.id,
    title: book.title,
    signedUrl,
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: ttlSeconds,
    watermark: {
      userName: reader?.name ?? `User #${userId}`,
      uid: reader?.uid ?? null,
      timestamp: now.toISOString(),
    },
  };
}

export async function closeCdlSession(sessionId: number, userId: number) {
  const [s] = await db
    .select({ userId: cdlSessionModel.userId })
    .from(cdlSessionModel)
    .where(eq(cdlSessionModel.id, sessionId))
    .limit(1);
  if (!s) throw new ApiError(404, "Session not found.");
  if (s.userId !== userId)
    throw new ApiError(403, "Session does not belong to this user.");
  await db
    .update(cdlSessionModel)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(cdlSessionModel.id, sessionId));
}

// Backwards-compatible alias for any external caller.
export async function issueCdlAccess(bookId: number, userId: number) {
  return startCdlSession(bookId, userId);
}
