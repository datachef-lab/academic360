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
import {
  bitToBool,
  upsertUser,
} from "../user/services/refactor-old-migration.service";
import { OldStaff } from "@repo/db/legacy-system-types/users";
import { bookReissueModel } from "@repo/db/schemas/models/library/book-reissue.model";

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

  if (!existingLanguage) {
    return (
      await db
        .insert(languageMediumModel)
        .values({
          name: oldLanguage.languageName.trim(),
        })
        .returning()
    )[0];
  }

  return existingLanguage;
}

async function getSeriesByOldId(oldSeriesId: number | null) {
  if (!oldSeriesId) return null;

  const [[oldSeries]] = (await mysqlConnection.query(`
    SELECT * FROM series WHERE id = ${oldSeriesId}
    `)) as [OldSeries[], unknown];

  if (!oldSeries) return null;

  const [existingSeries] = await db
    .select()
    .from(seriesModel)
    .where(
      and(
        ilike(seriesModel.name, oldSeries.seriesName.trim()),
        eq(seriesModel.legacySeriesId, oldSeries.id),
      ),
    );

  if (!existingSeries) {
    return (
      await db
        .insert(seriesModel)
        .values({
          legacySeriesId: oldSeries.id,
          name: oldSeries.seriesName,
        })
        .returning()
    )[0];
  }

  return existingSeries;
}

async function getPublisherByOldId(oldPublisherId: number | null) {
  if (!oldPublisherId) return null;

  const [[oldPublisher]] = (await mysqlConnection.query(`
    SELECT * FROM publisher WHERE id = ${oldPublisherId}
    `)) as [OldPublisher[], unknown];

  if (!oldPublisher) return null;

  const [existingPublisher] = await db
    .select()
    .from(publisherModel)
    .where(
      and(
        ilike(publisherModel.name, oldPublisher.publisherName.trim()),
        eq(publisherModel.legacyPublisherId, oldPublisherId),
      ),
    );

  if (!existingPublisher) {
    const [newPublisher] = await db
      .insert(publisherModel)
      .values({
        legacyPublisherId: oldPublisherId,
        name: oldPublisher.publisherName,
        code: oldPublisher.publisherCode.toString(),
      })
      .returning();
    if (newPublisher) {
      await db.insert(addressModel).values({
        address: oldPublisher.address,
        publisherId: newPublisher.id!,
      });
    }
    return newPublisher;
  }

  return existingPublisher;
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

  if (!existingSubjectGroup) {
    const [academicYear] = await db
      .select()
      .from(academicYearModel)
      .where(eq(academicYearModel.year, "2025-26"));
    const [newSubjectGroup] = await db
      .insert(subjectGroupingMainModel)
      .values({
        legacySubjectGroupId: oldSubjectGroupId,
        name: oldSubjectGroup.subjectgroupName.trim(),
        academicYearId: academicYear.id!,
      })
      .returning();
    return newSubjectGroup;
  }

  return existingSubjectGroup;
}

async function getEnclosureByOldId(oldEnclosureId: number | null) {
  if (!oldEnclosureId) return null;

  const [[oldEnclosure]] = (await mysqlConnection.query(`
    SELECT * FROM enclosetype WHERE id = ${oldEnclosureId}
    `)) as [OldEnclosure[], unknown];

  if (!oldEnclosure) return null;

  const [existingEnclosure] = await db
    .select()
    .from(enclosureModel)
    .where(
      and(
        ilike(enclosureModel.name, oldEnclosure.enclosetypeName.trim()),
        eq(enclosureModel.legacyEnclosureId, oldEnclosureId),
      ),
    );

  if (!existingEnclosure) {
    const [newEnclosure] = await db
      .insert(enclosureModel)
      .values({
        legacyEnclosureId: oldEnclosureId,
        name: oldEnclosure.enclosetypeName.trim(),
      })
      .returning();

    return newEnclosure;
  }

  return existingEnclosure;
}

async function getEntryModeByOldId(oldEntryModeId: number | null) {
  if (!oldEntryModeId) return null;

  const [[oldEntryMode]] = (await mysqlConnection.query(`
    SELECT * FROM entrymode WHERE id = ${oldEntryModeId}
    `)) as [OldEntryMode[], unknown];

  if (!oldEntryMode) return null;

  const [existingEntryMode] = await db
    .select()
    .from(entryModeModel)
    .where(
      and(
        ilike(entryModeModel.name, oldEntryMode.entrymodeName.trim()),
        eq(entryModeModel.legacyEntryModeId, oldEntryModeId),
      ),
    );

  if (!existingEntryMode) {
    const [entryMode] = await db
      .insert(entryModeModel)
      .values({
        legacyEntryModeId: oldEntryModeId,
        name: oldEntryMode.entrymodeName.trim(),
      })
      .returning();

    return entryMode;
  }

  return existingEntryMode;
}

async function getJournalTypeByOldId(oldJournalTypeId: number | null) {
  if (!oldJournalTypeId) return null;

  const [[oldJournalType]] = (await mysqlConnection.query(`
    SELECT * FROM journaltype WHERE id = ${oldJournalTypeId}
    `)) as [OldJournalType[], unknown];

  if (!oldJournalType) return null;

  const [existingJournalType] = await db
    .select()
    .from(journalTypeModel)
    .where(
      and(
        ilike(journalTypeModel.name, oldJournalType.journalType.trim()),
        eq(journalTypeModel.legacyJournalTypeId, oldJournalTypeId),
      ),
    );

  if (!existingJournalType) {
    const [journalType] = await db
      .insert(journalTypeModel)
      .values({
        legacyJournalTypeId: oldJournalTypeId,
        name: oldJournalType.journalType.trim(),
      })
      .returning();

    return journalType;
  }

  return existingJournalType;
}

async function getLibraryStatusByOldId(oldLibraryStatusId: number | null) {
  if (!oldLibraryStatusId) return null;

  const [[oldStatus]] = (await mysqlConnection.query(`
    SELECT * FROM status WHERE id = ${oldLibraryStatusId}
    `)) as [OldStatus[], unknown];

  if (!oldStatus) return null;

  const [existingLibraryStatus] = await db
    .select()
    .from(statusModel)
    .where(
      and(
        ilike(statusModel.name, oldStatus.statusName.trim()),
        eq(statusModel.legacyStatusId, oldLibraryStatusId),
      ),
    );

  if (!existingLibraryStatus) {
    const [newStatus] = await db
      .insert(statusModel)
      .values({
        legacyStatusId: oldLibraryStatusId,
        name: oldStatus.statusName.trim(),
        issuedTo: String(oldStatus.issueTo),
      })
      .returning();

    return newStatus;
  }

  return existingLibraryStatus;
}

async function getRackByOldId(oldRackId: number | null) {
  if (!oldRackId) return null;

  const [[oldRack]] = (await mysqlConnection.query(`
    SELECT * FROM rack WHERE id = ${oldRackId}
    `)) as [OldRack[], unknown];

  if (!oldRack) return null;

  const [existingRack] = await db
    .select()
    .from(rackModel)
    .where(
      and(
        ilike(rackModel.name, oldRack.rackName.trim()),
        eq(rackModel.legacyRackId, oldRackId),
      ),
    );

  if (!existingRack) {
    const [newRack] = await db
      .insert(rackModel)
      .values({
        legacyRackId: oldRackId,
        name: oldRack.rackName.trim(),
      })
      .returning();

    return newRack;
  }

  return existingRack;
}

async function getShelfByOldId(oldShelfId: number | null) {
  if (!oldShelfId) return null;

  const [[oldShelf]] = (await mysqlConnection.query(`
    SELECT * FROM shelf WHERE id = ${oldShelfId}
    `)) as [OldShelf[], unknown];

  if (!oldShelf) return null;

  const [existingShelf] = await db
    .select()
    .from(shelfModel)
    .where(
      and(
        ilike(shelfModel.name, oldShelf.shelfName.trim()),
        eq(shelfModel.legacyShelfId, oldShelfId),
      ),
    );

  if (!existingShelf) {
    const [newShelf] = await db
      .insert(shelfModel)
      .values({
        legacyShelfId: oldShelfId,
        name: oldShelf.shelfName.trim(),
      })
      .returning();

    return newShelf;
  }

  return existingShelf;
}

async function getBindingTypeByOldId(oldBindingId: number | null) {
  if (!oldBindingId) return null;

  const [[oldBindingType]] = (await mysqlConnection.query(`
    SELECT * FROM bindingtype WHERE id = ${oldBindingId}
    `)) as [OldBindingType[], unknown];

  if (!oldBindingType) return null;

  const [existingBindingType] = await db
    .select()
    .from(bindingModel)
    .where(
      and(
        ilike(bindingModel.name, oldBindingType.bindingTypeName.trim()),
        eq(bindingModel.legacyBindingId, oldBindingId),
      ),
    );

  if (!existingBindingType) {
    const [newBindingType] = await db
      .insert(bindingModel)
      .values({
        legacyBindingId: oldBindingId,
        name: oldBindingType.bindingTypeName.trim(),
      })
      .returning();

    return newBindingType;
  }

  return existingBindingType;
}

async function getPeriodByOldId(oldPeriodId: number | null) {
  if (!oldPeriodId) return null;

  const [[oldPeriod]] = (await mysqlConnection.query(`
    SELECT * FROM periodpojo WHERE id = ${oldPeriodId}
    `)) as [OldPeriod[], unknown];

  if (!oldPeriod) return null;

  const [existingPeriod] = await db
    .select()
    .from(libraryPeriodModel)
    .where(
      and(
        ilike(libraryPeriodModel.name, oldPeriod.periodName.trim()),
        eq(libraryPeriodModel.legacyLibraryPeriodId, oldPeriodId),
      ),
    );

  if (!existingPeriod) {
    const [newPeriod] = await db
      .insert(libraryPeriodModel)
      .values({
        legacyLibraryPeriodId: oldPeriodId,
        name: oldPeriod.periodName.trim(),
      })
      .returning();

    return newPeriod;
  }

  return existingPeriod;
}

async function getLibraryArticleByOldId(oldLibraryArticleId: number | null) {
  if (!oldLibraryArticleId) return null;

  const [[oldLibraryArticle]] = (await mysqlConnection.query(`
    SELECT * FROM latype WHERE id = ${oldLibraryArticleId}
    `)) as [OldLibraryArticle[], unknown];

  if (!oldLibraryArticle) return null;

  const [existingLibraryArticle] = await db
    .select()
    .from(libraryArticleModel)
    .where(
      and(
        ilike(libraryArticleModel.name, oldLibraryArticle.latypeName.trim()),
        eq(libraryArticleModel.legacyLibraryArticleId, oldLibraryArticle.id),
      ),
    );

  if (!existingLibraryArticle) {
    const [newLibraryArticle] = await db
      .insert(libraryArticleModel)
      .values({
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
      })
      .returning();

    return newLibraryArticle;
  }

  return existingLibraryArticle;
}

async function getLibraryDocumentByOldId(oldLibraryDocumentId: number | null) {
  if (!oldLibraryDocumentId) return null;

  const [[oldLibraryDoc]] = (await mysqlConnection.query(`
    SELECT * FROM documenttypelist WHERE id = ${oldLibraryDocumentId}
    `)) as [OldDocumentTypeList[], unknown];

  if (!oldLibraryDoc) return null;

  const [existingLibraryDoc] = await db
    .select()
    .from(libraryDocumentTypeModel)
    .where(
      and(
        ilike(libraryDocumentTypeModel.name, oldLibraryDoc.documentName.trim()),
        eq(
          libraryDocumentTypeModel.legacyLibraryDocumentTypeId,
          oldLibraryDocumentId,
        ),
      ),
    );

  if (!existingLibraryDoc) {
    const [newLibraryArticle] = await db
      .insert(libraryDocumentTypeModel)
      .values({
        name: oldLibraryDoc.documentName.trim(),
        legacyLibraryDocumentTypeId: oldLibraryDocumentId,
        libraryArticleId: (
          await getLibraryArticleByOldId(oldLibraryDoc.parent_id)
        )?.id,
      })
      .returning();

    return newLibraryArticle;
  }

  return existingLibraryDoc;
}

async function getBorrowingTypeByOldId(oldBorrowingTypeId: number | null) {
  if (!oldBorrowingTypeId) return null;

  const [[oldBorrowingType]] = (await mysqlConnection.query(`
    SELECT * FROM borrowingtype WHERE id = ${oldBorrowingTypeId}
    `)) as [OldBorrowingType[], unknown];

  if (!oldBorrowingType) return null;

  const [existingBorrowingType] = await db
    .select()
    .from(borrowingTypeModel)
    .where(
      and(
        ilike(
          borrowingTypeModel.name,
          oldBorrowingType.borrowingtypeName.trim(),
        ),
        eq(borrowingTypeModel.legacyBorrowingTypeId, oldBorrowingType.id),
      ),
    );

  if (!existingBorrowingType) {
    const [newLibraryArticle] = await db
      .insert(borrowingTypeModel)
      .values({
        name: oldBorrowingType.borrowingtypeName,
        legacyBorrowingTypeId: oldBorrowingTypeId,
        searchGuideline: bitToBool(oldBorrowingType.searchGuideline),
      })
      .returning();

    return newLibraryArticle;
  }

  return existingBorrowingType;
}

async function getJournalByOldId(oldJournalId: number | null) {
  if (!oldJournalId) return null;

  const [[oldJournal]] = (await mysqlConnection.query(`
    SELECT * FROM journalmaster WHERE id = ${oldJournalId}
    `)) as [OldJournalMaster[], unknown];

  if (!oldJournal) return null;

  const [existingJournal] = await db
    .select()
    .from(journalModel)
    .where(and(eq(journalModel.legacyJournalId, oldJournalId)));

  if (!existingJournal) {
    const [newLibraryArticle] = await db
      .insert(journalModel)
      .values({
        title: oldJournal.title,
        bindingId: (await getBindingTypeByOldId(oldJournal.bindingTypeId))?.id,
        entryModeId: (await getEntryModeByOldId(oldJournal.entryModeId))?.id,
        issnNumber: oldJournal.issnNo,
        languageId: (await getLanguageByOldId(oldJournal.languageId))?.id,
        legacyJournalId: oldJournalId,
        periodId: (await getPeriodByOldId(oldJournal.periodId))?.id,
        publisherId: (await getPublisherByOldId(oldJournal.publisherId))?.id,
        sizeInCM: oldJournal.sizeIncm,
        subjectGroupId: (
          await getSubjectGroupByOldId(oldJournal.subjectGroupId)
        )?.id,
        type: (await getJournalTypeByOldId(oldJournal.journalTypeId))?.id,
      })
      .returning();

    return newLibraryArticle;
  }

  return existingJournal;
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

  const [existingBook] = await db
    .select()
    .from(bookModel)
    .where(and(eq(bookModel.legacyBooksId, oldBookId)));

  if (!existingBook) {
    const [newBook] = await db
      .insert(bookModel)
      .values({
        title: oldBook.mainTitle,
        alternateTitle: oldBook.alternateTitle,
        backCover: oldBook.backCover,
        bookPart: oldBook.bookPart,
        bookVolume: oldBook.bookVolume,
        callNumber: oldBook.callNo,
        createdAt: oldBook.entryDate,
        edition: oldBook.edition,
        editionYear: oldBook.editionYear,
        enclosureId: (await getEnclosureByOldId(oldBook.encloserParentId))?.id,
        frequency: oldBook.frequency,
        frontCover: oldBook.frontCover,
        isbn: oldBook.isbn,
        issueDate: oldBook.issueDate,
        issueDate1: oldBook.issueDate1,
        issueDate2: oldBook.issueDate2,
        issueNumber: oldBook.issueNo,
        isUniqueAccess: bitToBool(oldBook.uniqueAccess),
        journalId: (await getJournalByOldId(oldBook.journalId))?.id,
        keywords: oldBook.keyword,
        languageId: (await getLanguageByOldId(oldBook.languageId))?.id,
        legacyBooksId: oldBookId,
        libraryDocumentTypeId: (
          await getLibraryDocumentByOldId(oldBook.documentTypeId)
        )?.id,
        monthFromAt1: oldBook.monthFromat1
          ? String(oldBook.monthFromat1)
          : null,
        monthFromAt2: oldBook.monthFromat2
          ? String(oldBook.monthFromat2)
          : null,
        notes: oldBook.note,
        publishedYear: oldBook.pubYear,
        publisherId: (await getPublisherByOldId(oldBook.pubNameId))?.id,
        referenceNumber: oldBook.refNo,
        remarks: oldBook.remarks,
        seriesId: (await getSeriesByOldId(oldBook.seriesId))?.id,
        softCopy: oldBook.softCopy,
        subjectGroupId: (await getSubjectGroupByOldId(oldBook.subjectGroupId))
          ?.id,
        subTitle: oldBook.subTitle,
        updatedAt: oldBook.modifedDate,
        updatedById: (await getUserByOldId(oldBook.modifiedById))?.id,
      } as BookT)
      .returning();

    return newBook;
  }

  return existingBook;
}

async function getEntryExitByOldId(oldEntryExitId: number) {
  if (!oldEntryExitId) return null;

  const [existingEntryExit] = await db
    .select()
    .from(libraryEntryExitModel)
    .where(eq(libraryEntryExitModel.legacyLibraryEntryExitId, oldEntryExitId));

  if (existingEntryExit) {
    return existingEntryExit;
  }

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

  return await db
    .insert(libraryEntryExitModel)
    .values({
      userId: userId!,
      entryTimestamp: combineDateTime(
        oldEntryExit.entrydt!,
        oldEntryExit.entrytime!,
      )!,
      exitTimestamp: oldEntryExit.exittime
        ? combineDateTime(oldEntryExit.entrydt!, oldEntryExit.exittime)
        : null,
      currentStatus: oldEntryExit.exittime ? "CHECKED_OUT" : "CHECKED_IN",
      legacyLibraryEntryExitId: oldEntryExitId,
    })
    .returning();
}

async function getCopyDetailsByOldId(oldCopyId: number | null) {
  if (!oldCopyId) return null;

  const [[oldCopy]] = (await mysqlConnection.query(`
    SELECT * FROM copydetailsub WHERE id = ${oldCopyId}
    `)) as [OldCopyDetails[], unknown];

  if (!oldCopy) return null;

  const [existingCopy] = await db
    .select()
    .from(copyDetailsModel)
    .where(and(eq(copyDetailsModel.legacyCopyDetailsId, oldCopyId)));

  if (!existingCopy) {
    const [newCirculation] = await db
      .insert(copyDetailsModel)
      .values({
        legacyCopyDetailsId: oldCopyId!,
        bookId: (await getBookByOldId(oldCopy.parent_id))?.id,
        accessNumber: oldCopy.accessNo,
        oldAccessNumber: oldCopy.oldAccessNo,
        billDate: oldCopy.billdate
          ? combineDateTime(oldCopy.billdate, null)
          : null,
        bindingTypeId: (await getBindingTypeByOldId(oldCopy.bindingId))?.id,
        bookPart: oldCopy.bookPart,
        bookPartInfo: oldCopy.bookPartInfo,
        bookSize: oldCopy.booksize,
        bookVolume: oldCopy.bookVolume,
        createdAt: oldCopy.entrydate
          ? combineDateTime(oldCopy.entrydate, null)
          : null,
        createdById: (await getUserByOldId(oldCopy.createdById))?.id,
        discount: oldCopy.discount,
        enclosureId: (await getEnclosureByOldId(oldCopy.encloserTypeId))?.id,
        enntryModeId: (await getEntryModeByOldId(oldCopy.entityModeId))?.id,
        isbn: oldCopy.isbn,
        issueType: oldCopy.issueType,
        legacyVendorId: oldCopy.vendorid,
        numberOfEnclosures: oldCopy.noOfEncloser,
        numberOfPages: oldCopy.noOfPages,
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
      } as CopyDetailsT)
      .returning();

    return newCirculation;
  }

  return existingCopy;
}

async function getBookCirculationByOldId(oldIssueReturnId: number | null) {
  if (!oldIssueReturnId) return null;

  const [[oldIssueReturn]] = (await mysqlConnection.query(`
    SELECT * FROM issuereturn WHERE id = ${oldIssueReturnId}
    `)) as [OldIssueReturn[], unknown];

  if (!oldIssueReturn) return null;

  const [existingIssueReturn] = await db
    .select()
    .from(bookCirculationModel)
    .where(
      and(eq(bookCirculationModel.legacyBookCirculationId, oldIssueReturnId)),
    );

  if (!existingIssueReturn) {
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

    const [newCirculation] = await db
      .insert(bookCirculationModel)
      .values({
        copyDetailsId: (await getCopyDetailsByOldId(oldIssueReturn.copyId))
          ?.id as number,
        issuedFromId: (await getUserByOldId(oldIssueReturn.issuerid))?.id,
        issueTimestamp: oldIssueReturn.issueDate,
        returnTimestamp: oldIssueReturn.returnDate,
        userId: userId!,
        actualReturnTimestamp: oldIssueReturn.actualRetDate,
        borrowingTypeId: (
          await getBorrowingTypeByOldId(oldIssueReturn.borrowingTypeId)
        )?.id,
        fineAmount: oldIssueReturn.fine,
        fineDate: oldIssueReturn.fineDate,
        fineRemarks: oldIssueReturn.fineremarks,
        fineWaiver: oldIssueReturn.finewaived,
        isForcedIssue: oldIssueReturn.isForceIssue,
        isReIssued: bitToBool(oldIssueReturn.reIssue),
        isReturned: bitToBool(oldIssueReturn.isReturn),
        legacyBookCirculationId: oldIssueReturn.id,
        returnedToId: await getUserByOldId(oldIssueReturn.returnerid),
        remarks: oldIssueReturn.remarks,
      } as BookCirculationT)
      .returning();

    if (newCirculation.isReIssued) {
      await db.insert(bookReissueModel).values({
        bookCirculationId: newCirculation.id!,
        reissuedBy: newCirculation.issuedFromId,
      });
    }

    return newCirculation;
  }

  return existingIssueReturn;
}

function combineDateTime(
  date: Date | string,
  time: string | null,
): Date | null {
  if (!time) return null;
  const dateStr =
    date instanceof Date
      ? date.toISOString().split("T")[0]
      : String(date).split(" ")[0];
  // Treat as IST (UTC+5:30)
  return new Date(`${dateStr}T${time}+05:30`);
}

const arr = [
  { table: "libentryexit", fn: getEntryExitByOldId },
  { table: "language", fn: getLanguageByOldId },
  { table: "series", fn: getSeriesByOldId },
  { table: "publisher", fn: getPublisherByOldId },
  { table: "subjectgroup", fn: getSubjectGroupByOldId },
  { table: "enclosetype", fn: getEnclosureByOldId },
  { table: "entrymode", fn: getEntryModeByOldId },
  { table: "journaltype", fn: getJournalTypeByOldId },
  { table: "status", fn: getLibraryStatusByOldId },
  { table: "rack", fn: getRackByOldId },
  { table: "shelf", fn: getShelfByOldId },
  { table: "bindingtype", fn: getBindingTypeByOldId },
  { table: "periodpojo", fn: getPeriodByOldId },
  { table: "latype", fn: getLibraryArticleByOldId },
  { table: "documenttypelist", fn: getLibraryDocumentByOldId },
  { table: "borrowingtype", fn: getBorrowingTypeByOldId },
  { table: "journalmaster", fn: getJournalByOldId },
  { table: "bookentry", fn: getBookByOldId },

  { table: "copydetailsub", fn: getCopyDetailsByOldId },
  { table: "issuereturn", fn: getBookCirculationByOldId },
];

export async function loadLibrary() {
  for (const ele of arr) {
    console.log("Loading data for table:", ele.table);
    const [result] = (await mysqlConnection.query(`
    SELECT id FROM ${ele.table} ORDER BY id ASC
    `)) as [{ id: number }[], unknown];
    console.log(
      "Processing data for table:",
      ele.table,
      "Rows:",
      result.length,
    );
    for (const row of result) {
      await ele.fn(row.id);
    }
    console.log("Done data for table:", ele.table);
  }
}
