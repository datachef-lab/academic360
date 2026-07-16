import { db } from "@/db/index.js";
import { and, eq, isNull, sql, sum } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";

export type ClearanceOutstandingCopy = {
  circulationId: number;
  bookId: number;
  bookTitle: string;
  accessNumber: string | null;
  issuedAt: Date;
  dueAt: Date;
  fineAmount: number;
  fineWaiver: number;
  finePaid: boolean;
};

export type ClearanceResult = {
  userId: number;
  outstandingCopies: ClearanceOutstandingCopy[];
  outstandingFineBalance: number;
  hasDues: boolean;
};

export async function getLibraryClearance(
  userId: number,
): Promise<ClearanceResult> {
  const outstanding = await db
    .select({
      circulationId: bookCirculationModel.id,
      bookId: bookModel.id,
      bookTitle: bookModel.title,
      accessNumber: copyDetailsModel.accessNumber,
      issuedAt: bookCirculationModel.issueTimestamp,
      dueAt: bookCirculationModel.returnTimestamp,
      fineAmount: bookCirculationModel.fineAmount,
      fineWaiver: bookCirculationModel.fineWaiver,
      paymentId: bookCirculationModel.paymentId,
    })
    .from(bookCirculationModel)
    .innerJoin(
      copyDetailsModel,
      eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
    )
    .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .where(
      and(
        eq(bookCirculationModel.userId, userId),
        eq(bookCirculationModel.isReturned, false),
      ),
    );

  const [{ unpaidFineSum }] = await db
    .select({
      unpaidFineSum: sql<number>`COALESCE(SUM(${bookCirculationModel.fineAmount} - ${bookCirculationModel.fineWaiver}), 0)`,
    })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.userId, userId),
        isNull(bookCirculationModel.paymentId),
      ),
    );

  const outstandingFineBalance = Number(unpaidFineSum ?? 0);
  const outstandingCopies: ClearanceOutstandingCopy[] = outstanding.map(
    (r) => ({
      circulationId: r.circulationId,
      bookId: r.bookId,
      bookTitle: r.bookTitle,
      accessNumber: r.accessNumber,
      issuedAt: r.issuedAt,
      dueAt: r.dueAt,
      fineAmount: r.fineAmount,
      fineWaiver: r.fineWaiver,
      finePaid: r.paymentId != null,
    }),
  );

  return {
    userId,
    outstandingCopies,
    outstandingFineBalance,
    hasDues: outstandingCopies.length > 0 || outstandingFineBalance > 0,
  };
}
