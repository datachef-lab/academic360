/**
 * Integration verification for library circulation-policy enforcement + the
 * automatic fine engine (feat/library-circulation-policy-enforcement).
 *
 * Run with: pnpm --filter backend verify:library-fines
 *
 * LOCAL ONLY: refuses to run unless DATABASE_URL points at localhost. It
 * temporarily edits the STUDENT×TEXTBOOK policy row and the fine go-live date,
 * creates its own user/book/copies, and restores/deletes everything in a
 * finally block — including any fines the full sweep wrote onto real local
 * rows (identified by the sentinel ₹7.77/day rate).
 */

import "dotenv/config";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { bookReissueModel } from "@repo/db/schemas/models/library/book-reissue.model.js";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { libraryFineMappingModel } from "@repo/db/schemas/models/library/library-fine-mapping.model.js";
import { libraryFineSettingsModel } from "@repo/db/schemas/models/library/library-fine-settings.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";
import {
  resolvePatronCategoryIdForUser,
  resolveItemCategoryIdForCopy,
} from "../src/features/library/services/circulation-policy-resolver.service.js";
import { upsertBookCirculationRowsForUser } from "../src/features/library/services/book-circulation.service.js";
import { applyFineForCirculation } from "../src/features/library/services/library-fine.service.js";
import { runFineAccrualSweep } from "../src/features/library/schedulers/library-fine-accrual.scheduler.js";
import {
  recordLibraryFineCashPayment,
  waiveLibraryFine,
} from "../src/features/library/services/library-fine-payment.service.js";

const SENTINEL_RATE = 7.77; // identifies sweep-written fines for cleanup
const DAY_MS = 86_400_000;

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

async function expectReject(
  fn: () => Promise<unknown>,
  pattern: RegExp,
  label: string,
) {
  try {
    await fn();
    failed++;
    console.error(`  ✗ ${label} — expected rejection, none thrown`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    assert(pattern.test(message), label, message);
  }
}

const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

async function main() {
  const dburl = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(dburl)) {
    throw new Error(
      "Refusing to run: DATABASE_URL is not a localhost database.",
    );
  }

  const ts = Date.now();
  const cleanup: Array<() => Promise<void>> = [];

  const [studentCat] = await db
    .select()
    .from(patronCategoryModel)
    .where(eq(patronCategoryModel.code, "STUDENT"));
  const [textbookCat] = await db
    .select()
    .from(itemCategoryModel)
    .where(eq(itemCategoryModel.code, "TEXTBOOK"));
  if (!studentCat || !textbookCat)
    throw new Error("Seeded patron/item categories missing.");

  const [policy] = await db
    .select()
    .from(circulationPolicyModel)
    .where(
      and(
        eq(circulationPolicyModel.patronCategoryId, studentCat.id),
        eq(circulationPolicyModel.itemCategoryId, textbookCat.id),
      ),
    );
  if (!policy) throw new Error("STUDENT×TEXTBOOK policy row missing.");

  const [settings] = await db.select().from(libraryFineSettingsModel);
  if (!settings)
    throw new Error(
      "library_fine_settings row missing (migration 0193 not applied?).",
    );

  // --- temporary shared-row mutations (restored in finally) ---
  await db
    .update(circulationPolicyModel)
    .set({
      loanDays: 14,
      finePerDay: SENTINEL_RATE,
      graceDays: 2,
      renewalLimit: 1,
      maxCopiesAtOnce: 2,
      skipHolidaysInFine: false, // calendar-day math => deterministic assertions
    })
    .where(eq(circulationPolicyModel.id, policy.id));
  cleanup.push(async () => {
    await db
      .update(circulationPolicyModel)
      .set({
        loanDays: policy.loanDays,
        finePerDay: policy.finePerDay,
        graceDays: policy.graceDays,
        renewalLimit: policy.renewalLimit,
        maxCopiesAtOnce: policy.maxCopiesAtOnce,
        skipHolidaysInFine: policy.skipHolidaysInFine,
      })
      .where(eq(circulationPolicyModel.id, policy.id));
  });

  await db
    .update(libraryFineSettingsModel)
    .set({ accrualGoLiveDate: daysAgo(40) })
    .where(eq(libraryFineSettingsModel.onlyRow, true));
  cleanup.push(async () => {
    await db
      .update(libraryFineSettingsModel)
      .set({ accrualGoLiveDate: settings.accrualGoLiveDate })
      .where(eq(libraryFineSettingsModel.onlyRow, true));
  });

  // --- fixtures ---
  const [user] = await db
    .insert(userModel)
    .values({
      name: "Libfines Test Student",
      email: `libfines.test+${ts}@example.invalid`,
      password: "not-a-real-login",
      type: "STUDENT",
    } as typeof userModel.$inferInsert)
    .returning();
  const [book] = await db
    .insert(bookModel)
    .values({
      title: `LIBFINES TEST BOOK ${ts}`,
      itemCategoryId: textbookCat.id,
    })
    .returning();
  const mkCopy = async (suffix: string, issueType = "Issue Relevant") => {
    const [c] = await db
      .insert(copyDetailsModel)
      .values({
        bookId: book.id,
        accessNumber: `LFT-${ts}-${suffix}`,
        type: "Text Book",
        issueType,
      })
      .returning();
    return c;
  };
  const copyA = await mkCopy("A");
  const copyB = await mkCopy("B");
  const copyC = await mkCopy("C");
  const copyD = await mkCopy("D");
  const copyN = await mkCopy("N", "Not to be issued");
  const copyIds = [copyA.id, copyB.id, copyC.id, copyD.id, copyN.id];

  cleanup.push(async () => {
    // Sweep-written fines on real local rows (sentinel rate) — undo.
    const sweepRows = await db
      .select({ circulationId: libraryFineMappingModel.bookCirculationId })
      .from(libraryFineMappingModel)
      .where(
        and(
          eq(libraryFineMappingModel.finePerDaySnapshot, SENTINEL_RATE),
          ne(libraryFineMappingModel.userId, user.id),
        ),
      );
    if (sweepRows.length) {
      const ids = sweepRows.map((r) => r.circulationId);
      await db
        .update(bookCirculationModel)
        .set({ fineAmount: 0, fineDate: null })
        .where(inArray(bookCirculationModel.id, ids));
      await db
        .delete(libraryFineMappingModel)
        .where(inArray(libraryFineMappingModel.bookCirculationId, ids));
    }
    // Own fixtures, FK order.
    const own = await db
      .select({ id: bookCirculationModel.id })
      .from(bookCirculationModel)
      .where(eq(bookCirculationModel.userId, user.id));
    const ownIds = own.map((r) => r.id);
    if (ownIds.length) {
      await db
        .delete(libraryFineMappingModel)
        .where(inArray(libraryFineMappingModel.bookCirculationId, ownIds));
      await db
        .delete(bookReissueModel)
        .where(inArray(bookReissueModel.bookCirculationId, ownIds));
      await db
        .update(bookCirculationModel)
        .set({ paymentId: null })
        .where(inArray(bookCirculationModel.id, ownIds));
      await db.delete(paymentModel).where(eq(paymentModel.userId, user.id));
      await db
        .delete(bookCirculationModel)
        .where(inArray(bookCirculationModel.id, ownIds));
    }
    await db
      .delete(copyDetailsModel)
      .where(inArray(copyDetailsModel.id, copyIds));
    await db.delete(bookModel).where(eq(bookModel.id, book.id));
    await db.delete(userModel).where(eq(userModel.id, user.id));
  });

  try {
    console.log("\n1. Policy resolution");
    const patronId = await resolvePatronCategoryIdForUser(user.id);
    assert(
      patronId === studentCat.id,
      "patron resolves by code (STUDENT)",
      patronId,
    );
    const itemId = await resolveItemCategoryIdForCopy(copyA.id);
    assert(
      itemId === textbookCat.id,
      "item category falls back to the book title",
      itemId,
    );

    console.log("\n2. Issue enforcement (upsert path)");
    await upsertBookCirculationRowsForUser(
      user.id,
      [{ copyDetailsId: copyA.id, issueTimestamp: new Date() }],
      null,
    );
    const [rowA] = await db
      .select()
      .from(bookCirculationModel)
      .where(
        and(
          eq(bookCirculationModel.userId, user.id),
          eq(bookCirculationModel.copyDetailsId, copyA.id),
        ),
      );
    const dueDiffDays = Math.round(
      (rowA.returnTimestamp.getTime() - rowA.issueTimestamp.getTime()) / DAY_MS,
    );
    assert(
      dueDiffDays === 14,
      "server-side due date = policy loanDays (14)",
      dueDiffDays,
    );

    await expectReject(
      () =>
        upsertBookCirculationRowsForUser(
          user.id,
          [{ copyDetailsId: copyA.id, issueTimestamp: new Date() }],
          null,
        ),
      /already issued/i,
      "double-issue of the same copy is rejected",
    );

    await upsertBookCirculationRowsForUser(
      user.id,
      [{ copyDetailsId: copyB.id, issueTimestamp: new Date() }],
      null,
    );
    await expectReject(
      () =>
        upsertBookCirculationRowsForUser(
          user.id,
          [{ copyDetailsId: copyC.id, issueTimestamp: new Date() }],
          null,
        ),
      /Copy limit reached/i,
      "maxCopiesAtOnce (2) blocks the third open loan",
    );
    await upsertBookCirculationRowsForUser(
      user.id,
      [
        {
          copyDetailsId: copyC.id,
          issueTimestamp: new Date(),
          isForcedIssue: true,
        },
      ],
      null,
    );
    const openNow = await db
      .select({ id: bookCirculationModel.id })
      .from(bookCirculationModel)
      .where(
        and(
          eq(bookCirculationModel.userId, user.id),
          eq(bookCirculationModel.isReturned, false),
        ),
      );
    assert(
      openNow.length === 3,
      "forced issue bypasses the cap",
      openNow.length,
    );

    await expectReject(
      () =>
        upsertBookCirculationRowsForUser(
          user.id,
          [
            {
              copyDetailsId: copyN.id,
              issueTimestamp: new Date(),
              isForcedIssue: true,
            },
          ],
          null,
        ),
      /Not to be issued/i,
      '"Not to be issued" blocks even a forced issue',
    );

    console.log("\n3. Renewal limit (upsert path)");
    await upsertBookCirculationRowsForUser(
      user.id,
      [
        {
          id: rowA.id,
          copyDetailsId: copyA.id,
          issueTimestamp: rowA.issueTimestamp,
          returnTimestamp: new Date(
            rowA.returnTimestamp.getTime() + 7 * DAY_MS,
          ),
        },
      ],
      null,
    );
    const reissues = await db
      .select({ id: bookReissueModel.id })
      .from(bookReissueModel)
      .where(eq(bookReissueModel.bookCirculationId, rowA.id));
    assert(
      reissues.length === 1,
      "due-date change inserts one reissue row",
      reissues.length,
    );
    await expectReject(
      () =>
        upsertBookCirculationRowsForUser(
          user.id,
          [
            {
              id: rowA.id,
              copyDetailsId: copyA.id,
              issueTimestamp: rowA.issueTimestamp,
              returnTimestamp: new Date(
                rowA.returnTimestamp.getTime() + 21 * DAY_MS,
              ),
            },
          ],
          null,
        ),
      /Renewal limit reached/i,
      "second renewal is rejected (renewalLimit 1)",
    );

    console.log("\n4. Fine accrual (calculator + sweep idempotency)");
    // Overdue loan: issued 30d ago, due 20d ago; rate 7.77, grace 2, calendar days.
    await upsertBookCirculationRowsForUser(
      user.id,
      [
        {
          copyDetailsId: copyD.id,
          issueTimestamp: daysAgo(30),
          returnTimestamp: daysAgo(20),
          isForcedIssue: true,
        },
      ],
      null,
    );
    const [rowD] = await db
      .select()
      .from(bookCirculationModel)
      .where(
        and(
          eq(bookCirculationModel.userId, user.id),
          eq(bookCirculationModel.copyDetailsId, copyD.id),
        ),
      );
    const expectedFine = (20 - 2) * SENTINEL_RATE;

    const first = await runFineAccrualSweep();
    assert(!first.skipped, "sweep acquired the advisory lock", first);
    const [afterFirst] = await db
      .select()
      .from(bookCirculationModel)
      .where(eq(bookCirculationModel.id, rowD.id));
    assert(
      Math.abs(afterFirst.fineAmount - expectedFine) < 0.001,
      `sweep wrote fine = (20-2)×${SENTINEL_RATE} = ${expectedFine}`,
      afterFirst.fineAmount,
    );
    const [ledgerD] = await db
      .select()
      .from(libraryFineMappingModel)
      .where(eq(libraryFineMappingModel.bookCirculationId, rowD.id));
    assert(
      !!ledgerD && Math.abs(ledgerD.fineAmount - expectedFine) < 0.001,
      "ledger row matches",
    );

    await runFineAccrualSweep();
    const [afterSecond] = await db
      .select()
      .from(bookCirculationModel)
      .where(eq(bookCirculationModel.id, rowD.id));
    assert(
      afterSecond.fineAmount === afterFirst.fineAmount,
      "second sweep is idempotent — no double fine",
      { first: afterFirst.fineAmount, second: afterSecond.fineAmount },
    );

    console.log("\n5. Go-live clamp");
    await db
      .update(libraryFineSettingsModel)
      .set({ accrualGoLiveDate: daysAgo(5) })
      .where(eq(libraryFineSettingsModel.onlyRow, true));
    const clamped = await applyFineForCirculation(db, {
      circulationId: rowD.id,
      userId: user.id,
      copyDetailsId: copyD.id,
      dueDate: rowD.returnTimestamp,
      asOf: new Date(),
      goLive: daysAgo(5),
    });
    const expectedClamped = (5 - 2) * SENTINEL_RATE;
    assert(
      Math.abs(clamped.fineAmount - expectedClamped) < 0.001,
      `due 20d ago but go-live 5d ago ⇒ fine = (5-2)×${SENTINEL_RATE} = ${expectedClamped}`,
      clamped.fineAmount,
    );
    await db
      .update(libraryFineSettingsModel)
      .set({ accrualGoLiveDate: daysAgo(40) })
      .where(eq(libraryFineSettingsModel.onlyRow, true));

    console.log("\n6. Return finalization, waiver, cash payment, freeze");
    await upsertBookCirculationRowsForUser(
      user.id,
      [
        {
          id: rowD.id,
          copyDetailsId: copyD.id,
          issueTimestamp: rowD.issueTimestamp,
          returnTimestamp: rowD.returnTimestamp,
          actualReturnTimestamp: new Date(),
        },
      ],
      null,
    );
    const [returnedD] = await db
      .select()
      .from(bookCirculationModel)
      .where(eq(bookCirculationModel.id, rowD.id));
    assert(returnedD.isReturned, "row marked returned");
    assert(
      Math.abs(returnedD.fineAmount - expectedFine) < 0.001,
      "fine finalized on return",
      returnedD.fineAmount,
    );

    await waiveLibraryFine(rowD.id, user.id, 50, "verify-script waiver");
    const [waivedD] = await db
      .select()
      .from(bookCirculationModel)
      .where(eq(bookCirculationModel.id, rowD.id));
    assert(
      waivedD.fineWaiver === 50,
      "waiver mirrored to circulation",
      waivedD.fineWaiver,
    );

    const cash = await recordLibraryFineCashPayment(
      rowD.id,
      user.id,
      "verify-script cash",
    );
    assert(
      Math.abs(cash.amount - (expectedFine - 50)) < 0.001,
      "cash payment = fine − waiver",
      cash.amount,
    );
    const [paidD] = await db
      .select()
      .from(bookCirculationModel)
      .where(eq(bookCirculationModel.id, rowD.id));
    assert(paidD.paymentId != null, "payment linked on circulation");

    const frozen = await applyFineForCirculation(db, {
      circulationId: rowD.id,
      userId: user.id,
      copyDetailsId: copyD.id,
      dueDate: rowD.returnTimestamp,
      asOf: new Date(),
      goLive: daysAgo(40),
    });
    assert(frozen.frozen, "paid fine is frozen against recomputation");
    await expectReject(
      () => recordLibraryFineCashPayment(rowD.id, user.id, "again"),
      /already has a payment/i,
      "double payment rejected",
    );
  } finally {
    console.log("\nCleaning up…");
    for (const fn of cleanup.reverse()) {
      await fn().catch((err) => console.error("cleanup step failed:", err));
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
    // holiday-calendar / notification helpers keep no open handles; pool.end closes the process.
    setTimeout(() => process.exit(process.exitCode ?? 0), 500).unref();
  });
