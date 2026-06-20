/**
 * Idempotent seed script for the library module.
 *
 * Run with: pnpm --filter backend seed:library
 *
 * Inserts the minimum-viable rows the UI smoke test in
 * /Users/harsh/.claude/plans/hidden-tinkering-wigderson.md (R7b) walks through.
 * Each insert uses .onConflictDoNothing(), so running the script twice is safe.
 */

import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { libraryZoneModel } from "@repo/db/schemas/models/library/library-zone.model.js";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { holidayModel } from "@repo/db/schemas/models/library/holiday.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { seriesModel } from "@repo/db/schemas/models/library/series.model.js";
import { libraryPeriodModel } from "@repo/db/schemas/models/library/library-period.model.js";
import { libraryArticleModel } from "@repo/db/schemas/models/library/library-article.model.js";
import { libraryDocumentTypeModel } from "@repo/db/schemas/models/library/library-document-type.model.js";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { shelfModel } from "@repo/db/schemas/models/library/shelf.model.js";
import { bindingModel } from "@repo/db/schemas/models/library/binding.model.js";
import { enclosureModel } from "@repo/db/schemas/models/library/enclosure.model.js";
import { vendorModel } from "@repo/db/schemas/models/library/vendor.model.js";
import { borrowingTypeModel } from "@repo/db/schemas/models/library/borrowing-type.model.js";
import { entryModeModel } from "@repo/db/schemas/models/library/entry-mode.model.js";
import { journalTypeModel } from "@repo/db/schemas/models/library/journal-type.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { authorTypeModel } from "@repo/db/schemas/models/library/author-type.model.js";
import { authorModel } from "@repo/db/schemas/models/library/author.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { journalSubscriptionModel } from "@repo/db/schemas/models/library/journal-subscription.model.js";
import { readingListModel } from "@repo/db/schemas/models/library/reading-list.model.js";
import { academicArchiveModel } from "@repo/db/schemas/models/library/academic-archive.model.js";
import { evidenceDocModel } from "@repo/db/schemas/models/library/evidence-doc.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";

type NameRow = { id: number };

/**
 * Upsert-by-name helper: try an insert with onConflictDoNothing; if the row already
 * exists, fall back to a select-by-name. Returns the id either way.
 */
async function upsertByName(
  table: any,
  nameColumn: any,
  payload: Record<string, unknown> & { name: string },
): Promise<number> {
  const inserted = (await db
    .insert(table)
    .values(payload)
    .onConflictDoNothing()
    .returning({ id: table.id })) as NameRow[];
  if (inserted.length > 0) return inserted[0].id;
  const [existing] = (await db
    .select({ id: table.id })
    .from(table)
    .where(eq(nameColumn, payload.name))
    .limit(1)) as NameRow[];
  if (!existing) throw new Error(`Could not upsert ${payload.name}`);
  return existing.id;
}

async function main() {
  console.log("=== Library seed script ===");

  // 1. Branches (named — easy upsert by name).
  const mainBranchId = await upsertByName(branchModel, branchModel.name, {
    name: "Main Campus",
    code: "MAIN",
    isActive: true,
  });
  const cityBranchId = await upsertByName(branchModel, branchModel.name, {
    name: "City Branch",
    code: "CITY",
    isActive: true,
  });
  console.log(`  branches: ${mainBranchId}, ${cityBranchId}`);

  // 2. Zones.
  for (const z of [
    {
      name: "Reference Section",
      code: "REF",
      capacity: 40,
      isActive: true,
      branchId: mainBranchId,
    },
    {
      name: "Reading Room A",
      code: "READ-A",
      capacity: 60,
      isActive: true,
      branchId: mainBranchId,
    },
    {
      name: "E-Resources Corner",
      code: "E-RES",
      capacity: 20,
      isActive: true,
      branchId: cityBranchId,
    },
  ]) {
    await db.insert(libraryZoneModel).values(z).onConflictDoNothing();
  }
  console.log("  zones seeded");

  // 3. Patron + item categories.
  const studentPatronId = await upsertByName(
    patronCategoryModel,
    patronCategoryModel.name,
    { name: "STUDENT" },
  );
  const facultyPatronId = await upsertByName(
    patronCategoryModel,
    patronCategoryModel.name,
    { name: "FACULTY" },
  );
  const staffPatronId = await upsertByName(
    patronCategoryModel,
    patronCategoryModel.name,
    { name: "STAFF" },
  );
  const bookItemId = await upsertByName(
    itemCategoryModel,
    itemCategoryModel.name,
    { name: "BOOK" },
  );
  const referenceItemId = await upsertByName(
    itemCategoryModel,
    itemCategoryModel.name,
    { name: "REFERENCE" },
  );
  const journalItemId = await upsertByName(
    itemCategoryModel,
    itemCategoryModel.name,
    { name: "JOURNAL" },
  );
  console.log("  patron + item categories seeded");

  // 4. Circulation policies — 3 patrons × 2 item categories.
  const policies = [
    {
      patron: studentPatronId,
      item: bookItemId,
      loanDays: 14,
      fine: 2,
      grace: 1,
    },
    {
      patron: studentPatronId,
      item: referenceItemId,
      loanDays: 1,
      fine: 5,
      grace: 0,
    },
    {
      patron: facultyPatronId,
      item: bookItemId,
      loanDays: 30,
      fine: 1,
      grace: 3,
    },
    {
      patron: facultyPatronId,
      item: referenceItemId,
      loanDays: 7,
      fine: 2,
      grace: 1,
    },
    {
      patron: staffPatronId,
      item: bookItemId,
      loanDays: 21,
      fine: 1,
      grace: 2,
    },
    {
      patron: staffPatronId,
      item: referenceItemId,
      loanDays: 3,
      fine: 3,
      grace: 0,
    },
  ];
  for (const p of policies) {
    await db
      .insert(circulationPolicyModel)
      .values({
        patronCategoryId: p.patron,
        itemCategoryId: p.item,
        loanDays: p.loanDays,
        finePerDay: String(p.fine),
        renewalLimit: 1,
        graceDays: p.grace,
        maxCopiesAtOnce: 3,
        skipHolidaysInFine: true,
        isActive: true,
      })
      .onConflictDoNothing();
  }
  console.log("  circulation policies seeded");

  // 5. Holidays — two for the current month.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const mid = new Date(now.getFullYear(), now.getMonth(), 15)
    .toISOString()
    .slice(0, 10);
  for (const h of [
    { name: "Library Maintenance Day", from: monthStart, to: monthStart },
    { name: "Inventory Audit", from: mid, to: mid },
  ]) {
    await db
      .insert(holidayModel)
      .values({ name: h.name, from: h.from, to: h.to })
      .onConflictDoNothing();
  }
  console.log("  holidays seeded");

  // 6. Bibliographic + physical masters (~5 each).
  const publishers = [
    "Oxford Press",
    "Cambridge Press",
    "Penguin",
    "Wiley",
    "Pearson",
  ];
  const seriesNames = [
    "Harry Potter",
    "Lord of the Rings",
    "Chronicles of Narnia",
    "Foundation",
    "Discworld",
  ];
  const periods = ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"];
  const articles = ["Standard", "Reference", "Reserve", "Audio", "Video"];
  const docTypes = ["Book", "Thesis", "Journal", "Magazine", "Newspaper"];
  const racks = ["R1", "R2", "R3", "R4", "R5"];
  const shelves = ["S-A1", "S-A2", "S-B1", "S-B2", "S-C1"];
  const bindings = ["Hardcover", "Paperback", "Spiral", "Cloth", "Leather"];
  const enclosures = [
    "CD Case",
    "DVD Case",
    "Vinyl Sleeve",
    "Map Tube",
    "Document Pouch",
  ];
  const vendors = [
    "Universal Book Depot",
    "Sapphire Distributors",
    "Crossword",
    "Higginbothams",
    "Bookhouse",
  ];
  const borrowingTypes = ["Issue", "Reference", "Overnight"];
  const entryModes = ["Purchase", "Donation", "Exchange", "Gift"];
  const journalTypes = ["Academic", "Trade", "Magazine"];
  const statuses = ["Available", "Issued", "Lost", "Damaged"];
  const authorTypes = ["Author", "Editor", "Translator", "Compiler"];

  const periodIds: number[] = [];
  for (const n of periods)
    periodIds.push(
      await upsertByName(libraryPeriodModel, libraryPeriodModel.name, {
        name: n,
      }),
    );
  const articleIds: number[] = [];
  for (const n of articles)
    articleIds.push(
      await upsertByName(libraryArticleModel, libraryArticleModel.name, {
        name: n,
      }),
    );
  const docTypeIds: number[] = [];
  for (let i = 0; i < docTypes.length; i++)
    docTypeIds.push(
      await upsertByName(
        libraryDocumentTypeModel,
        libraryDocumentTypeModel.name,
        {
          name: docTypes[i],
          libraryArticleId: articleIds[Math.min(i, articleIds.length - 1)],
        },
      ),
    );
  const publisherIds: number[] = [];
  for (const n of publishers)
    publisherIds.push(
      await upsertByName(publisherModel, publisherModel.name, { name: n }),
    );
  const seriesIds: number[] = [];
  for (const n of seriesNames)
    seriesIds.push(
      await upsertByName(seriesModel, seriesModel.name, { name: n }),
    );
  const rackIds: number[] = [];
  for (const n of racks)
    rackIds.push(await upsertByName(rackModel, rackModel.name, { name: n }));
  const shelfIds: number[] = [];
  for (const n of shelves)
    shelfIds.push(await upsertByName(shelfModel, shelfModel.name, { name: n }));
  const bindingIds: number[] = [];
  for (const n of bindings)
    bindingIds.push(
      await upsertByName(bindingModel, bindingModel.name, { name: n }),
    );
  const enclosureIds: number[] = [];
  for (const n of enclosures)
    enclosureIds.push(
      await upsertByName(enclosureModel, enclosureModel.name, { name: n }),
    );
  const vendorIds: number[] = [];
  for (const n of vendors)
    vendorIds.push(
      await upsertByName(vendorModel, vendorModel.name, { name: n }),
    );
  for (const n of borrowingTypes)
    await db
      .insert(borrowingTypeModel)
      .values({ name: n })
      .onConflictDoNothing();
  const entryModeIds: number[] = [];
  for (const n of entryModes)
    entryModeIds.push(
      await upsertByName(entryModeModel, entryModeModel.name, { name: n }),
    );
  for (const n of journalTypes)
    await db.insert(journalTypeModel).values({ name: n }).onConflictDoNothing();
  const statusIds: number[] = [];
  for (const n of statuses)
    statusIds.push(
      await upsertByName(statusModel, statusModel.name, { name: n }),
    );
  const authorTypeIds: number[] = [];
  for (const n of authorTypes)
    authorTypeIds.push(
      await upsertByName(authorTypeModel, authorTypeModel.name, { name: n }),
    );
  console.log("  inventory + bibliographic masters seeded");

  // Authors (4 each linked to authorType[0]=Author).
  const authorNames = [
    "J.K. Rowling",
    "J.R.R. Tolkien",
    "C.S. Lewis",
    "Isaac Asimov",
    "Terry Pratchett",
  ];
  const authorIds: number[] = [];
  for (const n of authorNames)
    authorIds.push(
      await upsertByName(authorModel, authorModel.name, {
        name: n,
        authorTypeId: authorTypeIds[0],
      }),
    );

  // 7. Books — 10 titles, 2 per series.
  const bookTitles = [
    "Introduction to Physics",
    "Foundations of Chemistry",
    "Modern Mathematics",
    "Calculus for Engineers",
    "Organic Chemistry Vol. 1",
    "Linear Algebra Done Right",
    "Quantum Mechanics Primer",
    "Probability and Statistics",
    "Discrete Mathematics",
    "Numerical Analysis",
  ];
  const bookIds: number[] = [];
  for (let i = 0; i < bookTitles.length; i++) {
    const title = bookTitles[i];
    const existing = await db
      .select({ id: bookModel.id })
      .from(bookModel)
      .where(eq(bookModel.title, title))
      .limit(1);
    if (existing.length > 0) {
      bookIds.push(existing[0].id);
      continue;
    }
    const [row] = await db
      .insert(bookModel)
      .values({
        title,
        publisherId: publisherIds[i % publisherIds.length],
        seriesId: seriesIds[i % seriesIds.length],
        libraryDocumentTypeId: docTypeIds[0],
        branchId: i % 2 === 0 ? mainBranchId : cityBranchId,
        publishedYear: "2024",
        edition: "1st",
        isbn: `978-93-${(10000 + i).toString()}`,
        keywords: title.toLowerCase(),
      })
      .returning({ id: bookModel.id });
    bookIds.push(row.id);
  }
  console.log(`  books seeded (${bookIds.length})`);

  // 8. Copies — 2 per book = 20 copies.
  for (let b = 0; b < bookIds.length; b++) {
    for (let c = 0; c < 2; c++) {
      const accessNumber = `ACC-${1000 + b * 2 + c}`;
      const exists = await db
        .select({ id: copyDetailsModel.id })
        .from(copyDetailsModel)
        .where(eq(copyDetailsModel.accessNumber, accessNumber))
        .limit(1);
      if (exists.length > 0) continue;
      await db.insert(copyDetailsModel).values({
        bookId: bookIds[b],
        branchId: b % 2 === 0 ? mainBranchId : cityBranchId,
        itemCategoryId: bookItemId,
        statusId: statusIds[0], // Available
        entryModeId: entryModeIds[0], // Purchase
        rackId: rackIds[b % rackIds.length],
        shelfId: shelfIds[b % shelfIds.length],
        bindingTypeId: bindingIds[b % bindingIds.length],
        vendorId: vendorIds[b % vendorIds.length],
        accessNumber,
        priceInINR: String(250 + b * 25),
      });
    }
  }
  console.log("  copies seeded");

  // 9. Journals + subscriptions.
  const journalTitles = ["Nature", "Science", "IEEE Spectrum"];
  const journalIds: number[] = [];
  for (let i = 0; i < journalTitles.length; i++) {
    const title = journalTitles[i];
    const existing = await db
      .select({ id: journalModel.id })
      .from(journalModel)
      .where(eq(journalModel.title, title))
      .limit(1);
    if (existing.length > 0) {
      journalIds.push(existing[0].id);
      continue;
    }
    const [row] = await db
      .insert(journalModel)
      .values({
        title,
        issnNumber: `0000-000${i + 1}`,
        publisherId: publisherIds[i % publisherIds.length],
        periodId: periodIds[2], // Monthly
        entryModeId: entryModeIds[0],
      })
      .returning({ id: journalModel.id });
    journalIds.push(row.id);
  }
  const yearEnd = new Date(now.getFullYear(), 11, 31)
    .toISOString()
    .slice(0, 10);
  for (let i = 0; i < journalIds.length; i++) {
    await db
      .insert(journalSubscriptionModel)
      .values({
        journalId: journalIds[i],
        vendorId: vendorIds[i % vendorIds.length],
        startDate: monthStart,
        endDate: yearEnd,
        costPerYear: 5000 + i * 1000,
        frequency: "Monthly",
        isActive: true,
      })
      .onConflictDoNothing();
  }
  console.log("  journals + subscriptions seeded");

  // 10. Archive + evidence (placeholder file keys — file UX is tested separately).
  for (const a of [
    {
      archiveType: "SYLLABUS",
      title: "Sample syllabus 2025-26",
      fileKey: "library/academic-archives/sample-syllabus.pdf",
      mimeType: "application/pdf",
    },
    {
      archiveType: "PAPER",
      title: "Sample question paper",
      fileKey: "library/academic-archives/sample-qp.pdf",
      mimeType: "application/pdf",
    },
  ]) {
    await db.insert(academicArchiveModel).values(a).onConflictDoNothing();
  }
  for (const e of [
    {
      criterionCode: "4.2.1",
      title: "Library books expenditure 2024-25",
      fileKey: "library/evidence-docs/expenditure-2024-25.pdf",
      mimeType: "application/pdf",
      academicYear: "2024-25",
    },
    {
      criterionCode: "4.2.2",
      title: "Library books expenditure 2025-26",
      fileKey: "library/evidence-docs/expenditure-2025-26.pdf",
      mimeType: "application/pdf",
      academicYear: "2025-26",
    },
  ]) {
    await db.insert(evidenceDocModel).values(e).onConflictDoNothing();
  }
  console.log("  archive + evidence seeded");

  // 11. Pick two students (if any exist) and seed library_entry_exit + circulation.
  const studentRows = await db.execute(sql`
    SELECT id FROM users WHERE type = 'STUDENT' AND is_active = true ORDER BY id LIMIT 2
  `);
  const studentIds = (studentRows.rows as Array<{ id: number }>).map(
    (r) => r.id,
  );
  if (studentIds.length === 0) {
    console.log(
      "  WARN: no students in db; skipping entry-exit + circulation rows.",
    );
  } else {
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const entryAt = new Date(today.getTime() - i * 86400000);
      const exitAt = new Date(entryAt.getTime() + 3600000);
      await db
        .insert(libraryEntryExitModel)
        .values({
          userId: studentIds[i % studentIds.length],
          branchId: mainBranchId,
          entryTimestamp: entryAt,
          exitTimestamp: exitAt,
          currentStatus: "CHECKED_OUT",
        })
        .onConflictDoNothing();
    }
    // Find a librarian/admin to set as issuedFromId.
    const adminRow = await db.execute(sql`
      SELECT id FROM users WHERE type IN ('ADMIN','STAFF') AND is_active = true ORDER BY id LIMIT 1
    `);
    const adminId = (adminRow.rows as Array<{ id: number }>)[0]?.id;
    if (adminId) {
      // Issue 3 books to the first student so the dashboard widgets light up.
      const copies = await db
        .select({ id: copyDetailsModel.id })
        .from(copyDetailsModel)
        .limit(3);
      for (const c of copies) {
        const issuedAt = new Date(today.getTime() - 2 * 86400000);
        const dueAt = new Date(issuedAt.getTime() + 14 * 86400000);
        await db
          .insert(bookCirculationModel)
          .values({
            userId: studentIds[0],
            copyDetailsId: c.id,
            branchId: mainBranchId,
            issuedFromId: adminId,
            issueTimestamp: issuedAt,
            returnTimestamp: dueAt,
            isReturned: false,
            fineAmount: 0,
            fineWaiver: 0,
          })
          .onConflictDoNothing();
      }
    }
    console.log(
      `  entry-exit + circulation seeded (students: ${studentIds.join(", ")})`,
    );
  }

  // 12. Reading list — one per student-first-program-course (best-effort).
  const studentProgramCourse = await db.execute(sql`
    SELECT program_course_id_fk AS pc FROM students WHERE user_id_fk = ${studentIds[0] ?? null} LIMIT 1
  `);
  const pcId = (studentProgramCourse.rows as Array<{ pc: number }>)[0]?.pc;
  if (pcId) {
    await db
      .insert(readingListModel)
      .values({
        programCourseId: pcId,
        title: "Sample reading list",
        description: "Curated for smoke test.",
        isPublished: true,
      })
      .onConflictDoNothing();
    console.log("  reading list seeded");
  } else {
    console.log(
      "  WARN: no program-course for first student; skipping reading list.",
    );
  }

  console.log("=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
