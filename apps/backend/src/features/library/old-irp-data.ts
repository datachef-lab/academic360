import { db, mysqlConnection } from "@/db";
import {
  OldBindingType,
  OldBookEntry,
  OldBorrowingType,
  OldCopyDetails,
  OldDocumentTypeList,
  OldEnclosure,
  OldEntryMode,
  OldIssueReturn,
  OldJournalMaster,
  OldJournalType,
  OldLanguage,
  OldLibraryArticle,
  OldLibraryEntryExit,
  OldPeriod,
  OldPublisher,
  OldRack,
  OldSeries,
  OldShelf,
  OldStatus,
  OldSubjectGroup,
} from "@repo/db/dtos/library";
import {
  academicYearModel,
  addressModel,
  languageMediumModel,
  staffModel,
  studentModel,
  subjectGroupingMainModel,
  userModel,
} from "@repo/db/schemas";
import {
  bindingModel,
  bookCirculationModel,
  BookCirculationT,
  bookModel,
  BookT,
  borrowingTypeModel,
  copyDetailsModel,
  CopyDetailsT,
  enclosureModel,
  entryModeModel,
  journalModel,
  journalTypeModel,
  libraryArticleModel,
  libraryDocumentTypeModel,
  libraryEntryExitModel,
  libraryPeriodModel,
  publisherModel,
  rackModel,
  seriesModel,
  shelfModel,
  statusModel,
} from "@repo/db/schemas/models/library";
import { and, eq, ilike } from "drizzle-orm";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import {
  bitToBool,
  upsertUser,
} from "../user/services/refactor-old-migration.service";
import { OldStaff } from "@repo/db/legacy-system-types/users";
import { bookReissueModel } from "@repo/db/schemas/models/library/book-reissue.model";

const MIGRATION_LOG_SHEET = "migration_log";

function getLibraryExcelBaseDir(): string {
  const raw = process.env.LIBRARY_EXCEL_DATA_PATH?.trim();
  if (!raw) {
    throw new Error(
      "LIBRARY_EXCEL_DATA_PATH is not set. Set it in .env to a directory for library migration Excel logs.",
    );
  }
  const abs = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

function migrationWorkbookPathForTable(table: string): string {
  const safe = table.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(getLibraryExcelBaseDir(), `${safe}_library_migration.xlsx`);
}

async function readSuccessfulLegacyIdsFromWorkbook(
  filePath: string,
): Promise<Set<number>> {
  const done = new Set<number>();
  if (!fs.existsSync(filePath)) return done;

  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const sheet = wb.getWorksheet(MIGRATION_LOG_SHEET);
    if (!sheet) return done;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const legacyCell = row.getCell(1).value;
      const statusCell = row.getCell(2).value;
      const legacyId =
        typeof legacyCell === "number"
          ? legacyCell
          : legacyCell != null &&
              typeof (legacyCell as { text?: string }).text === "string"
            ? Number((legacyCell as { text: string }).text)
            : Number(legacyCell);
      const status =
        typeof statusCell === "string"
          ? statusCell
          : statusCell != null &&
              typeof (statusCell as { text?: string }).text === "string"
            ? (statusCell as { text: string }).text
            : String(statusCell ?? "");
      if (
        !Number.isNaN(legacyId) &&
        status.trim().toLowerCase() === "success"
      ) {
        done.add(legacyId);
      }
    });
  } catch (e) {
    console.warn(
      `[loadLibrary] Could not read migration workbook, will not skip prior rows: ${filePath}`,
      e,
    );
  }
  return done;
}

async function appendMigrationLogRow(
  filePath: string,
  legacyId: number,
  status: "success" | "failed",
  errorMessage: string | null,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  if (fs.existsSync(filePath)) {
    await wb.xlsx.readFile(filePath);
  }
  let sheet = wb.getWorksheet(MIGRATION_LOG_SHEET);
  if (!sheet) {
    sheet = wb.addWorksheet(MIGRATION_LOG_SHEET);
    sheet.addRow(["legacy_id", "status", "error_message", "recorded_at"]);
    sheet.getRow(1).font = { bold: true };
  }
  sheet.addRow([
    legacyId,
    status,
    errorMessage ?? "",
    new Date().toISOString(),
  ]);
  await wb.xlsx.writeFile(filePath);
}

async function getLanguageByOldId(oldLanguageId: number | null) {
  if (!oldLanguageId) return null;

  const [[oldLanguage]] = (await mysqlConnection.query(`
    SELECT * FROM language WHERE id = ${oldLanguageId}
    `)) as [OldLanguage[], unknown];

  if (!oldLanguage) return null;

  const [existingLanguage] = await db
    .select()
    .from(languageMediumModel)
    .where(ilike(languageMediumModel.name, oldLanguage.languageName.trim()));

  const payload = {
    name: oldLanguage.languageName.trim(),
  };

  if (existingLanguage) {
    return (
      await db
        .update(languageMediumModel)
        .set(payload)
        .where(eq(languageMediumModel.id, existingLanguage.id))
        .returning()
    )[0];
  }

  return (await db.insert(languageMediumModel).values(payload).returning())[0];
}

async function getSeriesByOldId(oldSeriesId: number | null) {
  if (!oldSeriesId) return null;

  const [[oldSeries]] = (await mysqlConnection.query(`
    SELECT * FROM series WHERE id = ${oldSeriesId}
    `)) as [OldSeries[], unknown];

  if (!oldSeries) return null;

  const payload = {
    legacySeriesId: oldSeries.id,
    name: oldSeries.seriesName,
  };
  const [existingSeries] = await db
    .select()
    .from(seriesModel)
    .where(eq(seriesModel.legacySeriesId, oldSeriesId));

  if (existingSeries) {
    return (
      await db
        .update(seriesModel)
        .set(payload)
        .where(eq(seriesModel.id, existingSeries.id))
        .returning()
    )[0];
  }

  return (await db.insert(seriesModel).values(payload).returning())[0];
}

async function getPublisherByOldId(oldPublisherId: number | null) {
  if (!oldPublisherId) return null;

  const [[oldPublisher]] = (await mysqlConnection.query(`
    SELECT * FROM publisher WHERE id = ${oldPublisherId}
    `)) as [OldPublisher[], unknown];

  if (!oldPublisher) return null;

  const payload = {
    legacyPublisherId: oldPublisherId,
    name: oldPublisher.publisherName,
    code: oldPublisher.publisherCode?.toString?.() ?? null,
  };

  const [existingPublisher] = await db
    .select()
    .from(publisherModel)
    .where(eq(publisherModel.legacyPublisherId, oldPublisherId));

  const [publisher] = existingPublisher
    ? await db
        .update(publisherModel)
        .set(payload)
        .where(eq(publisherModel.id, existingPublisher.id))
        .returning()
    : await db.insert(publisherModel).values(payload).returning();

  if (publisher) {
    const [existingAddress] = await db
      .select()
      .from(addressModel)
      .where(eq(addressModel.publisherId, publisher.id!));
    if (existingAddress) {
      await db
        .update(addressModel)
        .set({ address: oldPublisher.address })
        .where(eq(addressModel.id, existingAddress.id));
    } else {
      await db.insert(addressModel).values({
        address: oldPublisher.address,
        publisherId: publisher.id!,
      });
    }
  }

  return publisher;
}

async function getSubjectGroupByOldId(oldSubjectGroupId: number | null) {
  if (!oldSubjectGroupId) return null;

  const [[oldSubjectGroup]] = (await mysqlConnection.query(`
    SELECT * FROM subjectgroup WHERE id = ${oldSubjectGroupId}
    `)) as [OldSubjectGroup[], unknown];

  if (!oldSubjectGroup) return null;

  const [existingSubjectGroup] = await db
    .select()
    .from(subjectGroupingMainModel)
    .where(
      and(
        ilike(
          subjectGroupingMainModel.name,
          oldSubjectGroup.subjectgroupName.trim(),
        ),
      ),
    );

  const [academicYear] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.year, "2025-26"));
  if (!academicYear) return null;

  const payload = {
    legacySubjectGroupId: oldSubjectGroupId,
    name: oldSubjectGroup.subjectgroupName.trim(),
    academicYearId: academicYear.id!,
  };

  if (existingSubjectGroup) {
    return (
      await db
        .update(subjectGroupingMainModel)
        .set(payload)
        .where(eq(subjectGroupingMainModel.id, existingSubjectGroup.id))
        .returning()
    )[0];
  }

  return (
    await db.insert(subjectGroupingMainModel).values(payload).returning()
  )[0];
}

async function getEnclosureByOldId(oldEnclosureId: number | null) {
  if (!oldEnclosureId) return null;

  const [[oldEnclosure]] = (await mysqlConnection.query(`
    SELECT * FROM enclosetype WHERE id = ${oldEnclosureId}
    `)) as [OldEnclosure[], unknown];

  if (!oldEnclosure) return null;

  const payload = {
    legacyEnclosureId: oldEnclosureId,
    name: oldEnclosure.enclosetypeName.trim(),
  };
  const [existingEnclosure] = await db
    .select()
    .from(enclosureModel)
    .where(eq(enclosureModel.legacyEnclosureId, oldEnclosureId));

  if (existingEnclosure) {
    return (
      await db
        .update(enclosureModel)
        .set(payload)
        .where(eq(enclosureModel.id, existingEnclosure.id))
        .returning()
    )[0];
  }

  return (await db.insert(enclosureModel).values(payload).returning())[0];
}

async function getEntryModeByOldId(oldEntryModeId: number | null) {
  if (!oldEntryModeId) return null;

  const [[oldEntryMode]] = (await mysqlConnection.query(`
    SELECT * FROM entrymode WHERE id = ${oldEntryModeId}
    `)) as [OldEntryMode[], unknown];

  if (!oldEntryMode) return null;

  const payload = {
    legacyEntryModeId: oldEntryModeId,
    name: oldEntryMode.entrymodeName.trim(),
  };
  const [existingEntryMode] = await db
    .select()
    .from(entryModeModel)
    .where(eq(entryModeModel.legacyEntryModeId, oldEntryModeId));
  if (existingEntryMode) {
    return (
      await db
        .update(entryModeModel)
        .set(payload)
        .where(eq(entryModeModel.id, existingEntryMode.id))
        .returning()
    )[0];
  }
  return (await db.insert(entryModeModel).values(payload).returning())[0];
}

async function getJournalTypeByOldId(oldJournalTypeId: number | null) {
  if (!oldJournalTypeId) return null;

  const [[oldJournalType]] = (await mysqlConnection.query(`
    SELECT * FROM journaltype WHERE id = ${oldJournalTypeId}
    `)) as [OldJournalType[], unknown];

  if (!oldJournalType) return null;

  const payload = {
    legacyJournalTypeId: oldJournalTypeId,
    name: oldJournalType.journalType.trim(),
  };
  const [existingJournalType] = await db
    .select()
    .from(journalTypeModel)
    .where(eq(journalTypeModel.legacyJournalTypeId, oldJournalTypeId));
  if (existingJournalType) {
    return (
      await db
        .update(journalTypeModel)
        .set(payload)
        .where(eq(journalTypeModel.id, existingJournalType.id))
        .returning()
    )[0];
  }
  return (await db.insert(journalTypeModel).values(payload).returning())[0];
}

async function getLibraryStatusByOldId(oldLibraryStatusId: number | null) {
  if (!oldLibraryStatusId) return null;

  const [[oldStatus]] = (await mysqlConnection.query(`
    SELECT * FROM status WHERE id = ${oldLibraryStatusId}
    `)) as [OldStatus[], unknown];

  if (!oldStatus) return null;

  const payload = {
    legacyStatusId: oldLibraryStatusId,
    name: oldStatus.statusName.trim(),
    issuedTo: String(oldStatus.issueTo),
  };
  const [existingLibraryStatus] = await db
    .select()
    .from(statusModel)
    .where(eq(statusModel.legacyStatusId, oldLibraryStatusId));
  if (existingLibraryStatus) {
    return (
      await db
        .update(statusModel)
        .set(payload)
        .where(eq(statusModel.id, existingLibraryStatus.id))
        .returning()
    )[0];
  }
  return (await db.insert(statusModel).values(payload).returning())[0];
}

async function getRackByOldId(oldRackId: number | null) {
  if (!oldRackId) return null;

  const [[oldRack]] = (await mysqlConnection.query(`
    SELECT * FROM rack WHERE id = ${oldRackId}
    `)) as [OldRack[], unknown];

  if (!oldRack) return null;

  const payload = {
    legacyRackId: oldRackId,
    name: oldRack.rackName.trim(),
  };
  const [existingRack] = await db
    .select()
    .from(rackModel)
    .where(eq(rackModel.legacyRackId, oldRackId));
  if (existingRack) {
    return (
      await db
        .update(rackModel)
        .set(payload)
        .where(eq(rackModel.id, existingRack.id))
        .returning()
    )[0];
  }
  return (await db.insert(rackModel).values(payload).returning())[0];
}

async function getShelfByOldId(oldShelfId: number | null) {
  if (!oldShelfId) return null;

  const [[oldShelf]] = (await mysqlConnection.query(`
    SELECT * FROM shelf WHERE id = ${oldShelfId}
    `)) as [OldShelf[], unknown];

  if (!oldShelf) return null;

  const payload = {
    legacyShelfId: oldShelfId,
    name: oldShelf.shelfName.trim(),
  };
  const [existingShelf] = await db
    .select()
    .from(shelfModel)
    .where(eq(shelfModel.legacyShelfId, oldShelfId));
  if (existingShelf) {
    return (
      await db
        .update(shelfModel)
        .set(payload)
        .where(eq(shelfModel.id, existingShelf.id))
        .returning()
    )[0];
  }
  return (await db.insert(shelfModel).values(payload).returning())[0];
}

async function getBindingTypeByOldId(oldBindingId: number | null) {
  if (!oldBindingId) return null;

  const [[oldBindingType]] = (await mysqlConnection.query(`
    SELECT * FROM bindingtype WHERE id = ${oldBindingId}
    `)) as [OldBindingType[], unknown];

  if (!oldBindingType) return null;

  const payload = {
    legacyBindingId: oldBindingId,
    name: oldBindingType.bindingTypeName.trim(),
  };
  const [existingBindingType] = await db
    .select()
    .from(bindingModel)
    .where(eq(bindingModel.legacyBindingId, oldBindingId));
  if (existingBindingType) {
    return (
      await db
        .update(bindingModel)
        .set(payload)
        .where(eq(bindingModel.id, existingBindingType.id))
        .returning()
    )[0];
  }
  return (await db.insert(bindingModel).values(payload).returning())[0];
}

async function getPeriodByOldId(oldPeriodId: number | null) {
  if (!oldPeriodId) return null;

  const [[oldPeriod]] = (await mysqlConnection.query(`
    SELECT * FROM periodpojo WHERE id = ${oldPeriodId}
    `)) as [OldPeriod[], unknown];

  if (!oldPeriod) return null;

  const payload = {
    legacyLibraryPeriodId: oldPeriodId,
    name: oldPeriod.periodName.trim(),
  };
  const [existingPeriod] = await db
    .select()
    .from(libraryPeriodModel)
    .where(eq(libraryPeriodModel.legacyLibraryPeriodId, oldPeriodId));
  if (existingPeriod) {
    return (
      await db
        .update(libraryPeriodModel)
        .set(payload)
        .where(eq(libraryPeriodModel.id, existingPeriod.id))
        .returning()
    )[0];
  }
  return (await db.insert(libraryPeriodModel).values(payload).returning())[0];
}

async function getLibraryArticleByOldId(oldLibraryArticleId: number | null) {
  if (!oldLibraryArticleId) return null;

  const [[oldLibraryArticle]] = (await mysqlConnection.query(`
    SELECT * FROM latype WHERE id = ${oldLibraryArticleId}
    `)) as [OldLibraryArticle[], unknown];

  if (!oldLibraryArticle) return null;

  const payload = {
    legacyLibraryArticleId: oldLibraryArticleId,
    name: oldLibraryArticle.latypeName.trim(),
    code: oldLibraryArticle.codeno,
    isAnalytical: bitToBool(oldLibraryArticle.isAnalytical),
    isAuthor: bitToBool(oldLibraryArticle.isAuthor),
    isCallNumber: bitToBool(oldLibraryArticle.isCallNo),
    isCallNumberAuto: bitToBool(oldLibraryArticle.isCallNoAuto),
    isCallNumberCompulsory: bitToBool(oldLibraryArticle.isCallNoCompulsory),
    isCopyDetail: bitToBool(oldLibraryArticle.isCopyDeatil),
    isDocumentTypeExist: bitToBool(oldLibraryArticle.isDocTypeExist),
    isEnclosure: bitToBool(oldLibraryArticle.isEnclosure),
    isImprint: bitToBool(oldLibraryArticle.isImprint),
    isJournal: bitToBool(oldLibraryArticle.isJournal),
    isKeyword: bitToBool(oldLibraryArticle.isKeyword),
    isNote: bitToBool(oldLibraryArticle.isNote),
    isPublisher: bitToBool(oldLibraryArticle.isPublisher),
    isRemarks: bitToBool(oldLibraryArticle.isRemarks),
    isUniqueAccessNumber: bitToBool(oldLibraryArticle.isUniqueAccessNo),
    isVoucher: bitToBool(oldLibraryArticle.isVoucher),
  };
  const [existingLibraryArticle] = await db
    .select()
    .from(libraryArticleModel)
    .where(eq(libraryArticleModel.legacyLibraryArticleId, oldLibraryArticleId));
  if (existingLibraryArticle) {
    return (
      await db
        .update(libraryArticleModel)
        .set(payload)
        .where(eq(libraryArticleModel.id, existingLibraryArticle.id))
        .returning()
    )[0];
  }
  return (await db.insert(libraryArticleModel).values(payload).returning())[0];
}

async function getLibraryDocumentByOldId(oldLibraryDocumentId: number | null) {
  if (!oldLibraryDocumentId) return null;

  const [[oldLibraryDoc]] = (await mysqlConnection.query(`
    SELECT * FROM documenttypelist WHERE id = ${oldLibraryDocumentId}
    `)) as [OldDocumentTypeList[], unknown];

  if (!oldLibraryDoc) return null;

  const payload = {
    name: oldLibraryDoc.documentName.trim(),
    legacyLibraryDocumentTypeId: oldLibraryDocumentId,
    libraryArticleId: (await getLibraryArticleByOldId(oldLibraryDoc.parent_id))
      ?.id,
  };
  const [existingLibraryDoc] = await db
    .select()
    .from(libraryDocumentTypeModel)
    .where(
      eq(
        libraryDocumentTypeModel.legacyLibraryDocumentTypeId,
        oldLibraryDocumentId,
      ),
    );
  if (existingLibraryDoc) {
    return (
      await db
        .update(libraryDocumentTypeModel)
        .set(payload)
        .where(eq(libraryDocumentTypeModel.id, existingLibraryDoc.id))
        .returning()
    )[0];
  }
  return (
    await db.insert(libraryDocumentTypeModel).values(payload).returning()
  )[0];
}

async function getBorrowingTypeByOldId(oldBorrowingTypeId: number | null) {
  if (!oldBorrowingTypeId) return null;

  const [[oldBorrowingType]] = (await mysqlConnection.query(`
    SELECT * FROM borrowingtype WHERE id = ${oldBorrowingTypeId}
    `)) as [OldBorrowingType[], unknown];

  if (!oldBorrowingType) return null;

  const payload = {
    name: oldBorrowingType.borrowingtypeName,
    legacyBorrowingTypeId: oldBorrowingTypeId,
    searchGuideline: bitToBool(oldBorrowingType.searchGuideline),
  };
  const [existingBorrowingType] = await db
    .select()
    .from(borrowingTypeModel)
    .where(eq(borrowingTypeModel.legacyBorrowingTypeId, oldBorrowingTypeId));
  if (existingBorrowingType) {
    return (
      await db
        .update(borrowingTypeModel)
        .set(payload)
        .where(eq(borrowingTypeModel.id, existingBorrowingType.id))
        .returning()
    )[0];
  }
  return (await db.insert(borrowingTypeModel).values(payload).returning())[0];
}

async function getJournalByOldId(oldJournalId: number | null) {
  if (!oldJournalId) return null;

  const [[oldJournal]] = (await mysqlConnection.query(`
    SELECT * FROM journalmaster WHERE id = ${oldJournalId}
    `)) as [OldJournalMaster[], unknown];

  if (!oldJournal) return null;

  const payload = {
    title: oldJournal.title,
    bindingId: (await getBindingTypeByOldId(oldJournal.bindingTypeId))?.id,
    entryModeId: (await getEntryModeByOldId(oldJournal.entryModeId))?.id,
    issnNumber: oldJournal.issnNo,
    languageId: (await getLanguageByOldId(oldJournal.languageId))?.id,
    legacyJournalId: oldJournalId,
    periodId: (await getPeriodByOldId(oldJournal.periodId))?.id,
    publisherId: (await getPublisherByOldId(oldJournal.publisherId))?.id,
    sizeInCM: oldJournal.sizeIncm,
    subjectGroupId: (await getSubjectGroupByOldId(oldJournal.subjectGroupId))
      ?.id,
    type: (await getJournalTypeByOldId(oldJournal.journalTypeId))?.id,
  };
  const [existingJournal] = await db
    .select()
    .from(journalModel)
    .where(eq(journalModel.legacyJournalId, oldJournalId));
  if (existingJournal) {
    return (
      await db
        .update(journalModel)
        .set(payload)
        .where(eq(journalModel.id, existingJournal.id))
        .returning()
    )[0];
  }
  return (await db.insert(journalModel).values(payload).returning())[0];
}

async function getUserByOldId(oldStaffId: number | null) {
  if (!oldStaffId) return;

  const [[oldStaff]] = (await mysqlConnection.query(`
    SELECT * FROM staffpersonaldetails WHERE id = ${oldStaffId}
    `)) as [OldStaff[], unknown];

  return upsertUser(oldStaff, "STAFF");
}

async function getBookByOldId(oldBookId: number | null) {
  if (!oldBookId) return null;

  const [[oldBook]] = (await mysqlConnection.query(`
    SELECT * FROM bookentry WHERE id = ${oldBookId}
    `)) as [OldBookEntry[], unknown];

  if (!oldBook) return null;

  const createdAt = parseMysqlAsIst(oldBook.entryDate) ?? new Date();
  const updatedAt = parseMysqlAsIst(oldBook.modifedDate) ?? new Date();

  const payload = {
    title: oldBook.mainTitle,
    alternateTitle: oldBook.alternateTitle,
    backCover: oldBook.backCover,
    bookPart: oldBook.bookPart,
    bookVolume: oldBook.bookVolume,
    callNumber: oldBook.callNo,
    createdAt,
    edition: oldBook.edition,
    editionYear: oldBook.editionYear,
    enclosureId: (await getEnclosureByOldId(oldBook.encloserParentId))?.id,
    frequency: (
      await getPeriodByOldId(
        oldBook.frequency == null ? null : Number(oldBook.frequency),
      )
    )?.id,
    frontCover: oldBook.frontCover,
    isbn: oldBook.isbn,
    issueDate: toPgDateStringIst(oldBook.issueDate),
    issueDate1: toPgDateStringIst(oldBook.issueDate1),
    issueDate2: toPgDateStringIst(oldBook.issueDate2),
    issueNumber: oldBook.issueNo,
    isUniqueAccess: bitToBool(oldBook.uniqueAccess),
    journalId: (await getJournalByOldId(oldBook.journalId))?.id,
    keywords: oldBook.keyword,
    languageId: (await getLanguageByOldId(oldBook.languageId))?.id,
    legacyBooksId: oldBookId,
    libraryDocumentTypeId: (
      await getLibraryDocumentByOldId(oldBook.documentTypeId)
    )?.id,
    monthFromAt1: oldBook.monthFromat1 ? String(oldBook.monthFromat1) : null,
    monthFromAt2: oldBook.monthFromat2 ? String(oldBook.monthFromat2) : null,
    notes: oldBook.note,
    publishedYear: oldBook.pubYear,
    publisherId: (await getPublisherByOldId(oldBook.pubNameId))?.id,
    referenceNumber: oldBook.refNo,
    remarks: oldBook.remarks,
    seriesId: (await getSeriesByOldId(oldBook.seriesId))?.id,
    softCopy: oldBook.softCopy,
    subjectGroupId: (await getSubjectGroupByOldId(oldBook.subjectGroupId))?.id,
    subTitle: oldBook.subTitle,
    updatedAt,
    updatedById: (await getUserByOldId(oldBook.modifiedById))?.id,
  } as BookT;

  const [existingBook] = await db
    .select()
    .from(bookModel)
    .where(eq(bookModel.legacyBooksId, oldBookId));
  if (existingBook) {
    return (
      await db
        .update(bookModel)
        .set(payload)
        .where(eq(bookModel.id, existingBook.id))
        .returning()
    )[0];
  }
  return (await db.insert(bookModel).values(payload).returning())[0];
}

async function getEntryExitByOldId(oldEntryExitId: number) {
  if (!oldEntryExitId) return null;

  const [existingEntryExit] = await db
    .select()
    .from(libraryEntryExitModel)
    .where(eq(libraryEntryExitModel.legacyLibraryEntryExitId, oldEntryExitId));

  const [[oldEntryExit]] = (await mysqlConnection.query(`
    SELECT * FROM libentryexit WHERE id = ${oldEntryExitId}
    `)) as [OldLibraryEntryExit[], unknown];

  let userId: number | undefined;
  if (oldEntryExit.usrtype === "Student") {
    const result = await db
      .select()
      .from(userModel)
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .where(eq(studentModel.legacyStudentId, oldEntryExit.usrid));

    if (result.length === 0) return null;
    userId = result[0].users.id;
  } else {
    userId = (await getUserByOldId(oldEntryExit.usrid))?.id;
  }

  const payload = {
    userId: userId!,
    entryTimestamp: combineDateTime(
      oldEntryExit.entrydt!,
      oldEntryExit.entrytime!,
    )!,
    exitTimestamp: oldEntryExit.exittime
      ? combineDateTime(oldEntryExit.entrydt!, oldEntryExit.exittime)
      : null,
    currentStatus: oldEntryExit.exittime
      ? ("CHECKED_OUT" as const)
      : ("CHECKED_IN" as const),
    legacyLibraryEntryExitId: oldEntryExitId,
  };

  if (existingEntryExit) {
    return await db
      .update(libraryEntryExitModel)
      .set(payload)
      .where(eq(libraryEntryExitModel.id, existingEntryExit.id))
      .returning();
  }

  return await db.insert(libraryEntryExitModel).values(payload).returning();
}

async function getCopyDetailsByOldId(oldCopyId: number | null) {
  if (!oldCopyId) return null;

  const [[oldCopy]] = (await mysqlConnection.query(`
    SELECT * FROM copydetailsub WHERE id = ${oldCopyId}
    `)) as [OldCopyDetails[], unknown];

  if (!oldCopy) return null;

  const payload = {
    legacyCopyDetailsId: oldCopyId!,
    bookId: (await getBookByOldId(oldCopy.parent_id))?.id,
    accessNumber: oldCopy.accessNo,
    oldAccessNumber: oldCopy.oldAccessNo,
    billDate: oldCopy.billdate ? combineDateTime(oldCopy.billdate, null) : null,
    bindingTypeId: (await getBindingTypeByOldId(oldCopy.bindingId))?.id,
    bookPart: oldCopy.bookPart,
    bookPartInfo: oldCopy.bookPartInfo,
    bookSize: oldCopy.booksize,
    bookVolume: oldCopy.bookVolume,
    createdAt: combineDateTime(oldCopy.entrydate, null),
    createdById: (await getUserByOldId(oldCopy.createdById))?.id,
    discount: oldCopy.discount,
    enclosureId: (await getEnclosureByOldId(oldCopy.encloserTypeId))?.id,
    enntryModeId: (await getEntryModeByOldId(oldCopy.entityModeId))?.id,
    isbn: oldCopy.isbn,
    issueType: oldCopy.issueType,
    legacyVendorId: oldCopy.vendorid,
    numberOfEnclosures: parseLegacyOptionalInt(oldCopy.noOfEncloser) ?? 0,
    numberOfPages: parseLegacyOptionalInt(oldCopy.noOfPages) ?? 0,
    pdfPath: oldCopy.pdfpath,
    prefix: oldCopy.prefixid,
    priceForeignCurrency: oldCopy.priceForeign,
    priceInINR: oldCopy.priceINR,
    publishedYear: oldCopy.pubYear,
    purchasePrice: oldCopy.purchaseprice,
    rackId: (await getRackByOldId(oldCopy.rackId))?.id,
    remarks: oldCopy.remark,
    setPrice: String(oldCopy.setprice),
    shelfId: (await getShelfByOldId(oldCopy.selfId))?.id,
    shippingCharges: oldCopy.shippingcharge,
    statusId: (await getLibraryStatusByOldId(oldCopy.statusId))?.id,
    suffix: oldCopy.suffixid,
    type: oldCopy.copyTypeId,
    volumeInfo: oldCopy.volInfo,
    voucherNumber: oldCopy.voucherNo,
    updatedById: (await getUserByOldId(oldCopy.modifiedById))?.id,
  } as CopyDetailsT;

  const [existingCopy] = await db
    .select()
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.legacyCopyDetailsId, oldCopyId));
  if (existingCopy) {
    return (
      await db
        .update(copyDetailsModel)
        .set(payload)
        .where(eq(copyDetailsModel.id, existingCopy.id))
        .returning()
    )[0];
  }
  return (await db.insert(copyDetailsModel).values(payload).returning())[0];
}

async function getBookCirculationByOldId(oldIssueReturnId: number | null) {
  if (!oldIssueReturnId) return null;

  const [[oldIssueReturn]] = (await mysqlConnection.query(`
    SELECT * FROM issuereturn WHERE id = ${oldIssueReturnId}
    `)) as [OldIssueReturn[], unknown];

  if (!oldIssueReturn) return null;

  let userId: number | undefined;
  if (oldIssueReturn.userTypeId === "Student") {
    const result = await db
      .select()
      .from(userModel)
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .where(eq(studentModel.legacyStudentId, oldIssueReturn.userId!));

    if (result.length === 0) return null;
    userId = result[0].users.id;
  } else {
    userId = (await getUserByOldId(oldIssueReturn.userId))?.id;
  }

  if (userId == null) return null;

  const copyDetailsRow = await getCopyDetailsByOldId(oldIssueReturn.copyId);
  if (!copyDetailsRow?.id) return null;

  let issuerPgId = (await getUserByOldId(oldIssueReturn.issuerid))?.id;
  if (issuerPgId == null) {
    const [fallbackIssuer] = await db
      .select({ id: userModel.id })
      .from(userModel)
      .where(eq(userModel.email, "test@gmail.com"))
      .limit(1);
    issuerPgId = fallbackIssuer?.id;
  }
  /** `issued_from_user_id_fk` is NOT NULL; last resort is circulation user. */
  const issuedFromId = issuerPgId ?? userId;

  const issueTimestamp =
    parseMysqlAsIst(oldIssueReturn.issueDate) ?? new Date();
  const returnTimestamp =
    parseMysqlAsIst(oldIssueReturn.returnDate) ?? new Date();

  const fineNum = Number(oldIssueReturn.fine);
  const waiverNum = Number(oldIssueReturn.finewaived);

  const payload = {
    copyDetailsId: copyDetailsRow.id,
    issuedFromId,
    issueTimestamp,
    returnTimestamp,
    userId,
    actualReturnTimestamp: parseMysqlAsIst(oldIssueReturn.actualRetDate),
    borrowingTypeId: (
      await getBorrowingTypeByOldId(oldIssueReturn.borrowingTypeId)
    )?.id,
    fineAmount: Number.isFinite(fineNum) ? fineNum : 0,
    fineDate: parseMysqlAsIst(oldIssueReturn.fineDate),
    fineRemarks: oldIssueReturn.fineremarks,
    fineWaiver: Number.isFinite(waiverNum) ? waiverNum : 0,
    isForcedIssue: bitToBool(oldIssueReturn.isForceIssue),
    isReIssued: bitToBool(oldIssueReturn.reIssue),
    isReturned: bitToBool(oldIssueReturn.isReturn),
    legacyBookCirculationId: oldIssueReturn.id,
    returnedToId: (await getUserByOldId(oldIssueReturn.returnerid))?.id,
    remarks: oldIssueReturn.remarks,
  } as BookCirculationT;

  const [existingIssueReturn] = await db
    .select()
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.legacyBookCirculationId, oldIssueReturnId));

  const [newIssueReturn] = existingIssueReturn
    ? await db
        .update(bookCirculationModel)
        .set(payload)
        .where(eq(bookCirculationModel.id, existingIssueReturn.id))
        .returning()
    : await db.insert(bookCirculationModel).values(payload).returning();

  if (newIssueReturn.isReIssued) {
    await db.insert(bookReissueModel).values({
      bookCirculationId: newIssueReturn.id!,
      reissuedBy: newIssueReturn.issuedFromId,
      returnTimestamp: newIssueReturn.returnTimestamp,
    });
  }

  return newIssueReturn;
}

/** Legacy IRP MySQL stores naive date/datetime in India (IST, UTC+5:30). */
const IST_OFFSET = "+05:30";

/**
 * Legacy sometimes stores counts as free text (e.g. "1032p."). Postgres integer
 * columns must get a real int or null/default.
 */
function parseLegacyOptionalInt(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  const s = String(value).trim();
  if (!s) return null;
  const m = s.match(/-?\d+/);
  if (!m) return null;
  const n = Number.parseInt(m[0], 10);
  return Number.isNaN(n) ? null : n;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD from a Date using local calendar components (matches mysql2 DATETIME). */
function toYmdFromDate(d: Date): string | null {
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toYmd(date: Date | string): string | null {
  if (date instanceof Date) return toYmdFromDate(date);
  const m = String(date)
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

/**
 * Parse legacy MySQL date or datetime as wall clock in IST and return an absolute Date
 * (correct for Postgres `timestamp with time zone`).
 */
function parseMysqlAsIst(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(
      `${toYmdFromDate(value)}T${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}${IST_OFFSET}`,
    );
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const withoutTz = trimmed
    .replace(/Z$/i, "")
    .split(/[+\u00b1]/)[0]!
    .trim();
  const normalized = withoutTz.includes("T")
    ? withoutTz
    : withoutTz.replace(" ", "T");
  const [datePart, timeRaw = ""] = normalized.split("T");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const timePart = (timeRaw || "00:00:00").replace(/\.\d+$/, "").slice(0, 8);
  const [h = "0", m = "0", s = "0"] = timePart.split(":");
  return new Date(
    `${datePart}T${pad2(Number(h))}:${pad2(Number(m))}:${pad2(Number(s))}${IST_OFFSET}`,
  );
}

/** Calendar date string for Postgres `date` columns (day in Asia/Kolkata). */
function toPgDateStringIst(
  value: Date | string | null | undefined,
): string | null {
  const d = parseMysqlAsIst(value);
  if (!d) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Combine a legacy calendar date with a TIME string; both are interpreted in IST.
 * When `time` is null/empty, uses midnight IST on that date.
 */
function combineDateTime(
  date: Date | string | null | undefined,
  time: string | null,
): Date | null {
  const ymd = date != null ? toYmd(date) : null;
  if (!ymd) return null;
  const t = time != null ? String(time).trim() : "";
  if (!t) {
    return new Date(`${ymd}T00:00:00${IST_OFFSET}`);
  }
  const parts = t.split(":");
  const hh = pad2(Number(parts[0]) || 0);
  const mm = pad2(Number(parts[1]) || 0);
  const ss = pad2(Number(parts[2]) || 0);
  return new Date(`${ymd}T${hh}:${mm}:${ss}${IST_OFFSET}`);
}

const arr: {
  table: string;
  fn: (id: number) => Promise<unknown>;
  sql: string;
}[] = [
  {
    table: "issuereturn",
    fn: getBookCirculationByOldId,
    sql: `
      SELECT DISTINCT i.id
      FROM issuereturn i
      LEFT JOIN staffpersonaldetails st ON st.id = i.userId AND i.userTypeId IN ('Staff', 'Teacher')
      LEFT JOIN historicalrecord h ON h.parent_id = i.userId AND i.userTypeId = 'Student'
      LEFT JOIN studentpersonaldetails spd ON spd.id = h.parent_id
      LEFT JOIN currentsessionmaster sess ON sess.id = h.sessionid
      WHERE
          i.userId IS NOT NULL
          AND i.userTypeId IS NOT NULL
          AND (
              i.userTypeId IN ('Staff', 'Teacher')
              OR (
                  i.userTypeId = 'Student'
                  AND h.id IS NOT NULL
                  AND sess.id > 17
              )
          )
      ORDER BY i.issueDate, i.id;
    `,
  },

  {
    table: "language",
    fn: getLanguageByOldId,
    sql: `
      SELECT id FROM language;
    `,
  },
  { table: "series", fn: getSeriesByOldId, sql: `SELECT id FROM series;` },
  {
    table: "publisher",
    fn: getPublisherByOldId,
    sql: `SELECT id FROM publisher;`,
  },
  {
    table: "subjectgroup",
    fn: getSubjectGroupByOldId,
    sql: `SELECT id FROM subjectgroup;`,
  },
  {
    table: "enclosetype",
    fn: getEnclosureByOldId,
    sql: `SELECT id FROM enclosetype;`,
  },
  {
    table: "entrymode",
    fn: getEntryModeByOldId,
    sql: `SELECT id FROM entrymode;`,
  },
  {
    table: "journaltype",
    fn: getJournalTypeByOldId,
    sql: `SELECT id FROM journaltype;`,
  },
  {
    table: "status",
    fn: getLibraryStatusByOldId,
    sql: `SELECT id FROM status;`,
  },
  { table: "rack", fn: getRackByOldId, sql: `SELECT id FROM rack;` },
  { table: "shelf", fn: getShelfByOldId, sql: `SELECT id FROM shelf;` },
  {
    table: "bindingtype",
    fn: getBindingTypeByOldId,
    sql: `SELECT id FROM bindingtype;`,
  },
  {
    table: "periodpojo",
    fn: getPeriodByOldId,
    sql: `SELECT id FROM periodpojo;`,
  },
  {
    table: "latype",
    fn: getLibraryArticleByOldId,
    sql: `SELECT id FROM latype;`,
  },
  {
    table: "documenttypelist",
    fn: getLibraryDocumentByOldId,
    sql: `SELECT id FROM documenttypelist;`,
  },
  {
    table: "borrowingtype",
    fn: getBorrowingTypeByOldId,
    sql: `SELECT id FROM borrowingtype;`,
  },

  {
    table: "journalmaster",
    fn: getJournalByOldId,
    sql: `SELECT id FROM journalmaster;`,
  },
  { table: "bookentry", fn: getBookByOldId, sql: `SELECT id FROM bookentry;` },
  {
    table: "copydetailsub",
    fn: getCopyDetailsByOldId,
    sql: `SELECT id FROM copydetailsub;`,
  },

  {
    table: "libentryexit",
    fn: getEntryExitByOldId,
    sql: `
      SELECT DISTINCT l.id
      FROM libentryexit l
      LEFT JOIN staffpersonaldetails st ON st.id = l.usrid AND l.usrtype IN ('Staff', 'Teacher')
      LEFT JOIN historicalrecord h ON h.parent_id = l.usrid AND l.usrtype = 'Student'
      LEFT JOIN studentpersonaldetails spd ON spd.id = h.parent_id
      LEFT JOIN currentsessionmaster sess ON sess.id = h.sessionid
      WHERE
          l.usrid IS NOT NULL
          AND l.usrtype IS NOT NULL
          AND (
              l.usrtype IN ('Staff', 'Teacher')
              OR (
                  l.usrtype = 'Student'
                  AND h.id IS NOT NULL
                  AND sess.id > 17
              )
          )
      ORDER BY l.entrydt, l.entrytime;
    `,
  },
];

export async function loadLibrary() {
  getLibraryExcelBaseDir();

  for (const ele of arr) {
    console.log("Loading data for table:", ele.table);
    const workbookPath = migrationWorkbookPathForTable(ele.table);
    const alreadySuccessful =
      await readSuccessfulLegacyIdsFromWorkbook(workbookPath);

    const [result] = (await mysqlConnection.query(ele.sql)) as [
      { id: number }[],
      unknown,
    ];
    console.log(
      "Processing data for table:",
      ele.table,
      "Rows:",
      result.length,
      "already logged success:",
      alreadySuccessful.size,
    );
    for (const row of result) {
      if (alreadySuccessful.has(row.id)) {
        continue;
      }

      let tmp: unknown;
      try {
        tmp = await ele.fn(row.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          "Failed to load data for table:",
          ele.table,
          "Row:",
          row.id,
          msg,
        );
        try {
          await appendMigrationLogRow(workbookPath, row.id, "failed", msg);
        } catch (excelErr) {
          console.warn(
            "[loadLibrary] Excel append failed after migration error; skipping excel row:",
            ele.table,
            row.id,
            excelErr,
          );
        }
        continue;
      }

      if (tmp) {
        console.log("Loaded data for table:", ele.table, "Row:", row.id);
        try {
          await appendMigrationLogRow(workbookPath, row.id, "success", null);
          alreadySuccessful.add(row.id);
        } catch (excelErr) {
          console.warn(
            "[loadLibrary] Excel append failed after success; skipping log (row will retry on next run):",
            ele.table,
            row.id,
            excelErr,
          );
        }
      } else {
        console.log(
          "Failed to load data for table:",
          ele.table,
          "Row:",
          row.id,
          "(no result)",
        );
        try {
          await appendMigrationLogRow(
            workbookPath,
            row.id,
            "failed",
            "migration returned no result",
          );
        } catch (excelErr) {
          console.warn(
            "[loadLibrary] Excel append failed for no-result row; skipping:",
            ele.table,
            row.id,
            excelErr,
          );
        }
      }
    }
    console.log("Done data for table:", ele.table);
  }
}
