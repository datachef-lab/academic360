import { db, mysqlConnection } from "@/db";
import {
  OldAuthor,
  OldAuthorDetail,
  OldAuthorType,
  OldBindingType,
  OldBookEntry,
  OldBorrowingType,
  OldClassHoliday,
  OldCopyDetails,
  OldDocumentTypeList,
  OldEnclosure,
  OldEntryMode,
  OldHoliday,
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
  OldVendor,
} from "@repo/db/dtos/library";
import {
  academicYearModel,
  addressModel,
  classModel,
  languageMediumModel,
  programCourseModel,
  sessionModel,
  staffModel,
  studentModel,
  subjectGroupingMainModel,
  userModel,
} from "@repo/db/schemas";
import {
  authorDetailsModel,
  authorModel,
  authorTypeModel,
  bindingModel,
  bookCirculationModel,
  BookCirculationT,
  bookModel,
  BookT,
  classHolidayModel,
  borrowingTypeModel,
  ClassHolidayT,
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
  holidayModel,
  VendorT,
  vendorModel,
} from "@repo/db/schemas/models/library";
import { and, eq, ilike, sql as drizzleSql } from "drizzle-orm";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import {
  bitToBool,
  upsertUser,
} from "../user/services/refactor-old-migration.service";
import { OldStaff } from "@repo/db/legacy-system-types/users";
import { bookReissueModel } from "@repo/db/schemas/models/library/book-reissue.model";
import {
  OldClass,
  OldCourse,
} from "@repo/db/legacy-system-types/course-design";

const MIGRATION_LOG_SHEET = "migration_log";

/* ---------------------------------------------------------------------------
 * Legacy row cache
 *
 * Every resolver used to run `SELECT * FROM <table> WHERE id = N` against IRP.
 * With ~200,000 rows to walk and a resolver graph that fans out (a circulation
 * row pulls copy -> book -> publisher, series, language, subject group, rack,
 * shelf, binding, status), that is tens of round trips per row to a REMOTE
 * MySQL. Measured on the develop box: ~0.2 rows/second, i.e. ~11 days for a
 * full load.
 *
 * The fix is to stop paying latency per row. Small lookup tables are fetched
 * once, whole; the big driving tables are primed in chunks by the loader so
 * memory stays bounded. Nothing about WHAT gets written changes — a cache miss
 * still falls back to the original single-row query, so behaviour is identical
 * either way.
 * ------------------------------------------------------------------------- */

/** Tables above this many rows are never fully preloaded (memory). */
const FULL_PRELOAD_ROW_LIMIT = 150_000;

type LegacyRow = Record<string, unknown> & { id: number };

const legacyRowCache = new Map<string, Map<number, LegacyRow>>();
/** Tables whose every row is in the cache — a miss means "absent", not "unknown". */
const fullyLoadedTables = new Set<string>();
const inflightPreloads = new Map<string, Promise<void>>();

function cacheFor(table: string): Map<number, LegacyRow> {
  let m = legacyRowCache.get(table);
  if (!m) {
    m = new Map<number, LegacyRow>();
    legacyRowCache.set(table, m);
  }
  return m;
}

function rememberRows(table: string, rows: LegacyRow[]): void {
  const m = cacheFor(table);
  for (const row of rows) m.set(Number(row.id), row);
}

/**
 * Pull an entire legacy table into memory, once. Single-flight: concurrent
 * callers share the one query rather than each issuing their own.
 */
async function preloadLegacyTable(table: string): Promise<void> {
  if (fullyLoadedTables.has(table)) return;
  const inflight = inflightPreloads.get(table);
  if (inflight) return inflight;

  const task = (async () => {
    const [[countRow]] = (await mysqlConnection.query(
      `SELECT COUNT(*) AS n FROM \`${table}\``,
    )) as [{ n: number }[], unknown];

    if (Number(countRow?.n ?? 0) > FULL_PRELOAD_ROW_LIMIT) {
      // Too big to hold; the loader primes it in chunks instead.
      return;
    }

    const [rows] = (await mysqlConnection.query(
      `SELECT * FROM \`${table}\``,
    )) as [LegacyRow[], unknown];
    rememberRows(table, rows);
    fullyLoadedTables.add(table);
  })().finally(() => inflightPreloads.delete(table));

  inflightPreloads.set(table, task);
  return task;
}

/** Prime a specific slice of a table — used for the big driving tables. */
export async function primeLegacyRows(
  table: string,
  ids: number[],
): Promise<void> {
  const missing = ids.filter((id) => !cacheFor(table).has(Number(id)));
  if (missing.length === 0) return;
  const [rows] = (await mysqlConnection.query(
    `SELECT * FROM \`${table}\` WHERE id IN (${missing.join(",")})`,
  )) as [LegacyRow[], unknown];
  rememberRows(table, rows);
}

/**
 * The single-row read every resolver goes through.
 *
 * Order: cache hit -> whole-table preload (small tables) -> single-row query.
 * The last step is the original behaviour, so a row this cache cannot serve is
 * still resolved correctly.
 */
async function legacyRow<T>(
  table: string,
  id: number | null | undefined,
): Promise<T | undefined> {
  if (id === null || id === undefined) return undefined;
  const key = Number(id);

  const hit = cacheFor(table).get(key);
  if (hit) return hit as T;
  if (fullyLoadedTables.has(table)) return undefined;

  await preloadLegacyTable(table);
  const afterPreload = cacheFor(table).get(key);
  if (afterPreload) return afterPreload as T;
  if (fullyLoadedTables.has(table)) return undefined;

  const [rows] = (await mysqlConnection.query(
    `SELECT * FROM \`${table}\` WHERE id = ${key}`,
  )) as [LegacyRow[], unknown];
  if (!rows.length) return undefined;
  rememberRows(table, rows);
  return rows[0] as T;
}

/** Drop everything cached — used between runs so a re-run sees fresh IRP data. */
export function clearLegacyRowCache(): void {
  legacyRowCache.clear();
  fullyLoadedTables.clear();
}

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

/* ---------------------------------------------------------------------------
 * Progress log
 *
 * The Excel per-row workbook is expensive (fs write per row, one file per
 * table, only useful on the instance that ran) and is now opt-in. This
 * ALWAYS-ON JSONL log is the replacement: one file per run, appended
 * incrementally, cheap to `tail -f` while the load is going.
 * ------------------------------------------------------------------------- */

type ProgressEvent =
  | {
      type: "run-start";
      at: string;
      onlyTables?: string[];
      limitPerTable?: number;
    }
  | { type: "table-start"; at: string; table: string; total: number }
  | {
      type: "table-progress";
      at: string;
      table: string;
      loaded: number;
      failed: number;
      total: number;
    }
  | {
      type: "table-done";
      at: string;
      table: string;
      loaded: number;
      failed: number;
      total: number;
      durationMs: number;
    }
  | { type: "row-failed"; at: string; table: string; id: number; error: string }
  | {
      type: "run-done";
      at: string;
      totalLoaded: number;
      totalFailed: number;
      durationMs: number;
    };

function progressLogPath(): string {
  const dir =
    process.env.LIBRARY_EXCEL_DATA_PATH?.trim() ||
    process.env.LIBRARY_LOG_DIR?.trim() ||
    "/tmp";
  const abs = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  try {
    fs.mkdirSync(abs, { recursive: true });
  } catch {
    // fall through, .writeSync will throw with the real reason
  }
  return path.join(abs, "library-load-progress.jsonl");
}

let progressLogHandle: number | null = null;
function openProgressLog(): number {
  if (progressLogHandle !== null) return progressLogHandle;
  progressLogHandle = fs.openSync(progressLogPath(), "a");
  return progressLogHandle;
}

function writeProgressEvent(event: ProgressEvent): void {
  try {
    const fd = openProgressLog();
    fs.writeSync(fd, JSON.stringify(event) + "\n");
  } catch {
    // Never let logging fail the load — but do print so the operator sees why.
    // eslint-disable-next-line no-console
    console.warn("[library-load] progress log write failed:", event.type);
  }
}

function closeProgressLog(): void {
  if (progressLogHandle !== null) {
    try {
      fs.closeSync(progressLogHandle);
    } catch {
      // ignore
    }
    progressLogHandle = null;
  }
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

  const oldLanguage = await legacyRow<OldLanguage>("language", oldLanguageId);

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

  const oldSeries = await legacyRow<OldSeries>("series", oldSeriesId);

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

  const oldPublisher = await legacyRow<OldPublisher>(
    "publisher",
    oldPublisherId,
  );

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

  const oldSubjectGroup = await legacyRow<OldSubjectGroup>(
    "subjectgroup",
    oldSubjectGroupId,
  );

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
    .where(eq(academicYearModel.isCurrentYear, true));
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

let sessionDateRangesPromise: Promise<
  { from: string; to: string; academicYearId: number | null }[]
> | null = null;

async function loadSessionDateRanges() {
  if (!sessionDateRangesPromise) {
    sessionDateRangesPromise = db
      .select({
        from: sessionModel.from,
        to: sessionModel.to,
        academicYearId: sessionModel.academicYearId,
      })
      .from(sessionModel);
  }
  return sessionDateRangesPromise;
}

async function resolveAcademicYearIdForDate(
  date: Date | null,
): Promise<number | null> {
  if (!date) return null;
  const ymd = toYmdFromDate(date);
  if (!ymd) return null;
  const ranges = await loadSessionDateRanges();
  const hit = ranges.find((r) => ymd >= r.from && ymd <= r.to);
  return hit?.academicYearId ?? null;
}

async function getEnclosureByOldId(oldEnclosureId: number | null) {
  if (!oldEnclosureId) return null;

  const oldEnclosure = await legacyRow<OldEnclosure>(
    "enclosetype",
    oldEnclosureId,
  );

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

  const oldEntryMode = await legacyRow<OldEntryMode>(
    "entrymode",
    oldEntryModeId,
  );

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

  const oldJournalType = await legacyRow<OldJournalType>(
    "journaltype",
    oldJournalTypeId,
  );

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

  const oldStatus = await legacyRow<OldStatus>("status", oldLibraryStatusId);

  if (!oldStatus) return null;

  const payload = {
    legacyStatusId: oldLibraryStatusId,
    name: oldStatus.statusName.trim(),
    issuedTo: String(oldStatus.issueto),
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

  const oldRack = await legacyRow<OldRack>("rack", oldRackId);

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

  const oldShelf = await legacyRow<OldShelf>("shelf", oldShelfId);

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

  const oldBindingType = await legacyRow<OldBindingType>(
    "bindingtype",
    oldBindingId,
  );

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

  const oldPeriod = await legacyRow<OldPeriod>("periodpojo", oldPeriodId);

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

async function getAuthorTypeByOldId(oldAuthorTypeId: number | null) {
  const oldAuthorType = await legacyRow<OldAuthorType>(
    "authortype",
    oldAuthorTypeId,
  );

  if (!oldAuthorType) return null;

  const payload = {
    legacyAuthorTypeId: oldAuthorTypeId,
    name: oldAuthorType.authortypeName.trim(),
  };
  const [existingAuthorType] = await db
    .select()
    .from(authorTypeModel)
    .where(eq(authorTypeModel.legacyAuthorTypeId, oldAuthorTypeId!));

  // Every sibling resolver is find-or-CREATE; this one had no insert branch, so
  // it returned undefined whenever the type was not already present — and
  // author_types starts empty. author_details.author_type_id_fk is NOT NULL and
  // is filled from here, so all 25,288 authordetailsub rows failed to insert and
  // every author-book link was lost.
  const [authorType] = existingAuthorType
    ? await db
        .update(authorTypeModel)
        .set(payload)
        .where(eq(authorTypeModel.id, existingAuthorType.id))
        .returning()
    : await db.insert(authorTypeModel).values(payload).returning();

  return authorType;
}

async function getAuthorByOldId(oldAuthorId: number | null) {
  if (!oldAuthorId) return null;

  const oldAuthor = await legacyRow<OldAuthor>("author", oldAuthorId);

  if (!oldAuthor) return null;

  const payload = {
    legacyAuthorId: oldAuthorId,
    name: oldAuthor.authorName.trim(),
    authorTypeId: (await getAuthorTypeByOldId(oldAuthor.authorType ?? null))
      ?.id,
    shortName: oldAuthor.shortName,
    notes: oldAuthor.notes,
  };
  const [existingAuthor] = await db
    .select()
    .from(authorModel)
    .where(eq(authorModel.legacyAuthorId, oldAuthorId));
  if (existingAuthor) {
    return (
      await db
        .update(authorModel)
        .set(payload)
        .where(eq(authorModel.id, existingAuthor.id))
        .returning()
    )[0];
  }
  return (await db.insert(authorModel).values(payload).returning())[0];
}

async function getAuthorDetailByOldId(oldAuthorDetailId: number | null) {
  if (!oldAuthorDetailId) return null;

  const oldAuthorDetail = await legacyRow<OldAuthorDetail>(
    "authordetailsub",
    oldAuthorDetailId,
  );

  if (!oldAuthorDetail) return null;

  // Resolve once — the old code resolved every FK twice (once for the update
  // payload, again inside the insert), tripling the work on the largest table.
  const bookId = (await getBookByOldId(oldAuthorDetail.parent_id))?.id;
  const authorTypeId = (
    await getAuthorTypeByOldId(oldAuthorDetail.authorTypeId ?? null)
  )?.id;
  const authorId = (await getAuthorByOldId(oldAuthorDetail.authorId ?? null))
    ?.id;

  // All three are NOT NULL. Inserting with one unresolved raises a constraint
  // error mid-load; a legacy row we cannot place is data we skip, not a crash.
  if (!bookId || !authorTypeId || !authorId) return null;

  const payload = {
    legacyAuthorDetailsId: oldAuthorDetailId,
    bookId,
    authorTypeId,
    authorId,
  };
  const [existingAuthorDetail] = await db
    .select()
    .from(authorDetailsModel)
    .where(eq(authorDetailsModel.legacyAuthorDetailsId, oldAuthorDetailId));
  if (existingAuthorDetail) {
    return (
      await db
        .update(authorDetailsModel)
        .set(payload)
        .where(eq(authorDetailsModel.id, existingAuthorDetail.id))
        .returning()
    )[0];
  }

  return (await db.insert(authorDetailsModel).values(payload).returning())[0];
}

async function getHolidayByOldId(oldHolidayId: number | null) {
  if (!oldHolidayId) return null;

  const oldHoliday = await legacyRow<OldHoliday>("holidaymain", oldHolidayId);

  if (!oldHoliday) return null;

  const from = toPgDateStringIst(oldHoliday.fromDate);
  const to = toPgDateStringIst(oldHoliday.toDate);
  if (!from || !to) return null;

  const payload = {
    legacyHolidayId: oldHolidayId,
    name: oldHoliday.holidayName.trim(),
    from,
    to,
    remarks: oldHoliday.remarks,
  };
  const [existingHoliday] = await db
    .select()
    .from(holidayModel)
    .where(eq(holidayModel.legacyHolidayId, oldHolidayId));
  if (existingHoliday) {
    return (
      await db
        .update(holidayModel)
        .set(payload)
        .where(eq(holidayModel.id, existingHoliday.id))
        .returning()
    )[0];
  }
  return (await db.insert(holidayModel).values(payload).returning())[0];
}

async function getClassHolidayByOldId(oldClassHolidayId: number | null) {
  if (!oldClassHolidayId) return null;

  const oldClassHoliday = await legacyRow<OldClassHoliday>(
    "holidaystudentsub",
    oldClassHolidayId,
  );

  if (!oldClassHoliday) return null;

  const oldCourse = await legacyRow<OldCourse>(
    "course",
    oldClassHoliday.courseId,
  );
  if (!oldCourse) return null;

  const oldClass = await legacyRow<OldClass>(
    "classes",
    oldClassHoliday.classId,
  );
  if (!oldClass) return null;

  const [programCourse] = await db
    .select()
    .from(programCourseModel)
    .where(ilike(programCourseModel.name, oldCourse.courseName!.trim()));
  if (!programCourse) return null;
  const [classM] = await db
    .select()
    .from(classModel)
    .where(ilike(classModel.name, oldClass.classname!.trim()));
  if (!classM) return null;

  const holiday = await getHolidayByOldId(oldClassHoliday.parent_id);
  if (!holiday) return null;

  const payload: ClassHolidayT = {
    legacyHolidayStudentMappingId: oldClassHolidayId,
    holidayId: holiday.id,
    programCourseId: programCourse.id,
    classId: classM.id,
    isHoliday: bitToBool(oldClassHoliday.isHoliday),
  };
  const [existingClassHoliday] = await db
    .select()
    .from(classHolidayModel)
    .where(
      eq(classHolidayModel.legacyHolidayStudentMappingId, oldClassHolidayId),
    );
  if (existingClassHoliday) {
    return (
      await db
        .update(classHolidayModel)
        .set(payload)
        .where(eq(classHolidayModel.id, existingClassHoliday.id))
        .returning()
    )[0];
  }
  return (await db.insert(classHolidayModel).values(payload).returning())[0];
}

async function getLibraryArticleByOldId(oldLibraryArticleId: number | null) {
  if (!oldLibraryArticleId) return null;

  const oldLibraryArticle = await legacyRow<OldLibraryArticle>(
    "latype",
    oldLibraryArticleId,
  );

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

  const oldLibraryDoc = await legacyRow<OldDocumentTypeList>(
    "documenttypelist",
    oldLibraryDocumentId,
  );

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

  const oldBorrowingType = await legacyRow<OldBorrowingType>(
    "borrowingtype",
    oldBorrowingTypeId,
  );

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

  const oldJournal = await legacyRow<OldJournalMaster>(
    "journalmaster",
    oldJournalId,
  );

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

  const oldStaff = await legacyRow<OldStaff>(
    "staffpersonaldetails",
    oldStaffId,
  );

  if (!oldStaff) return;

  return upsertUser(oldStaff, "STAFF");
}

async function getBookByOldId(oldBookId: number | null) {
  if (!oldBookId) return null;

  const oldBook = await legacyRow<OldBookEntry>("bookentry", oldBookId);

  if (!oldBook) return null;

  const entryDate = parseMysqlAsIst(oldBook.entryDate);
  const createdAt = entryDate ?? new Date();
  const updatedAt = parseMysqlAsIst(oldBook.modifedDate) ?? new Date();

  const payload = {
    academicYearId: await resolveAcademicYearIdForDate(entryDate),
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

  const oldEntryExit = await legacyRow<OldLibraryEntryExit>(
    "libentryexit",
    oldEntryExitId,
  );
  if (!oldEntryExit) return null;

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

  // user_id_fk is NOT NULL. The Student branch above already returns null when
  // the student is not in the new DB; the Staff branch did not, so a legacy
  // staff id with no matching user reached the insert and raised a constraint
  // error. Same rule for both: a visit we cannot attribute is skipped.
  if (!userId) return null;

  const payload = {
    userId,
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

  const oldCopy = await legacyRow<OldCopyDetails>("copydetailsub", oldCopyId);

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
    vendorId: (await getVendorByOldId(oldCopy.vendorid))?.id,
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
  if (!oldIssueReturnId) {
    console.log("oldIssueReturnId is null");
    return null;
  }

  const oldIssueReturn = await legacyRow<OldIssueReturn>(
    "issuereturn",
    oldIssueReturnId,
  );

  if (!oldIssueReturn) {
    console.log(
      "oldIssueReturn is null for oldIssueReturnId",
      oldIssueReturnId,
    );
    return null;
  }

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

  if (userId == null) {
    console.log(
      "userId is null for oldIssueReturnId",
      oldIssueReturnId,
      "userId",
      userId,
    );
    return null;
  }

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
    // Guard against duplicates: this path re-runs on every upsert of the same
    // circulation (restartable loads + the delta-sync), and book_reissue has
    // no unique constraint to catch the repeat insert.
    const [existingReissue] = await db
      .select({ id: bookReissueModel.id })
      .from(bookReissueModel)
      .where(eq(bookReissueModel.bookCirculationId, newIssueReturn.id!))
      .limit(1);
    if (!existingReissue) {
      await db.insert(bookReissueModel).values({
        bookCirculationId: newIssueReturn.id!,
        reissuedBy: newIssueReturn.issuedFromId,
        returnTimestamp: newIssueReturn.returnTimestamp,
      });
    }
  }

  return newIssueReturn;
}

async function getVendorByOldId(oldVendorId: number | null) {
  if (!oldVendorId) return null;

  const oldVendor = await legacyRow<OldVendor>(
    "procurementvendordetailmaintab",
    oldVendorId,
  );

  if (!oldVendor) return null;

  const payload = {
    legacyVendorId: oldVendorId!,
    name: oldVendor.vendorName,
    code: oldVendor.vendoreCode,
    email: oldVendor.vendorEmail,
    phone: oldVendor.vendorphoneNumber,
    website: oldVendor.vendorWebsite,
    personOfContact: oldVendor.contactpersonName,
    personOfContactEmail: oldVendor.contactpersonEmail,
    personOfContactPhone: oldVendor.contactpersonphnoneNumber,
    pan: oldVendor.panNumber,
  } as VendorT;
  const [existingVendor] = await db
    .select()
    .from(vendorModel)
    .where(eq(vendorModel.legacyVendorId, oldVendorId));
  if (existingVendor) {
    return (
      await db
        .update(vendorModel)
        .set(payload)
        .where(eq(vendorModel.id, existingVendor.id))
        .returning()
    )[0];
  }
  const newVendor = (
    await db.insert(vendorModel).values(payload).returning()
  )[0];
  if (newVendor) {
    const [existingAddress] = await db
      .select()
      .from(addressModel)
      .where(eq(addressModel.vendorId, newVendor.id!));
    if (existingAddress) {
      await db
        .update(addressModel)
        .set({ address: oldVendor.vendoraddress })
        .where(eq(addressModel.id, existingAddress.id));
    } else {
      await db
        .insert(addressModel)
        .values({ address: oldVendor.vendoraddress, vendorId: newVendor.id! });
    }
  }
  return newVendor;
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

export const arr: {
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
                  AND h.classId = 4
              )
          )
      ORDER BY i.issueDate, i.id;
    `,
  },
  {
    table: "holidaymain",
    fn: getHolidayByOldId,
    sql: `SELECT id FROM holidaymain;`,
  },
  {
    table: "holidaystudentsub",
    fn: getClassHolidayByOldId,
    sql: `SELECT id FROM holidaystudentsub;`,
  },
  {
    table: "author",
    fn: getAuthorByOldId,
    sql: `SELECT id FROM author;`,
  },
  {
    table: "authordetailsub",
    fn: getAuthorDetailByOldId,
    sql: `SELECT id FROM authordetailsub;`,
  },
  {
    table: "authortype",
    fn: getAuthorTypeByOldId,
    sql: `SELECT id FROM authortype;`,
  },
  {
    table: "procurementvendordetailmaintab",
    fn: getVendorByOldId,
    sql: `SELECT id FROM procurementvendordetailmaintab;`,
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
                  AND h.classId = 4
              )
          )
      ORDER BY l.entrydt, l.entrytime;
    `,
  },
];

export type LoadLibraryOptions = {
  /** Stop after this many rows per table. Used by the smoke test. */
  limitPerTable?: number;
  /** Restrict to these legacy table names. */
  onlyTables?: string[];
  /**
   * Write the per-table Excel progress log. Off by default now: the log lives on
   * one instance's filesystem, so under multiple instances it is neither shared
   * nor authoritative. Every loader function is a find-or-create keyed on its
   * legacy id, so the database itself is what makes a re-run safe.
   */
  writeExcelLog?: boolean;
  onProgress?: (msg: string) => void;
};

export type LoadLibraryResult = {
  tables: Array<{
    table: string;
    selected: number;
    loaded: number;
    failed: number;
  }>;
  totalLoaded: number;
  totalFailed: number;
};

/**
 * Dependency layers for the loader.
 *
 * The resolvers are find-or-create + memoised, so a table is safe to run
 * concurrently with any table whose resolver does NOT depend on its output
 * from within the same load. This grouping is that dependency graph —
 * everything inside a layer runs in parallel; layers execute in order.
 *
 * Discovered by walking each resolver: L1 leaves depend only on the address
 * table (filtered per parent, no row overlap); L2 needs journal/publisher/
 * subject-group; L3 needs bookentry + vendor/rack/shelf/binding/status; L4
 * needs copydetail + users.
 */
export const LOAD_LAYERS: string[][] = [
  // L1 — masters + independent leaves
  [
    "language",
    "series",
    "subjectgroup",
    "enclosetype",
    "entrymode",
    "journaltype",
    "status",
    "rack",
    "shelf",
    "bindingtype",
    "periodpojo",
    "latype",
    "documenttypelist",
    "borrowingtype",
    "authortype",
    "holidaymain",
    "procurementvendordetailmaintab",
    "publisher",
    "author",
  ],
  // L2 — depend on L1 only
  ["journalmaster", "bookentry", "libentryexit", "holidaystudentsub"],
  // L3 — depend on L2 + L1
  ["authordetailsub", "copydetailsub"],
  // L4 — depends on L3
  ["issuereturn"],
];

/** Max rows resolved in parallel per table. Bounded so the shared IRP
 *  connection pool + Postgres connections don't stampede. */
const ROW_WORKERS = 8;

/**
 * Run one legacy table end-to-end: select ids, prime the row cache in chunks,
 * resolve each id with bounded concurrency. Returns the same summary shape
 * the outer loop used to build. Extracted so it can be invoked from
 * `Promise.all` per layer.
 */
/**
 * Extra context passed to per-table runs so the progress emit can carry
 * cumulative percentage and layer indicators — the internal loader tracks it,
 * not the caller.
 */
type PerTableContext = {
  layerIndex: number; // 1-based
  layerTotal: number;
  onTableDone: () => number; // returns the running "tables done" count
  tablesTotal: number;
  /** Every internal table name running in parallel in this layer. */
  currentLayerTables: string[];
  /** Internal table names from the previous layer that this one waited on. */
  dependsOn: string[];
  /**
   * Pre-fetched row ids for every table, keyed by legacy table name. Feeds
   * both the per-table loop (skipping a redundant `SELECT id FROM …` at
   * table-start) and the shared row counter so the % bar reflects real work,
   * not just tables-done / tables-total.
   */
  plannedIds: Map<string, number[]>;
  /** Sum of `plannedIds[table].length` across every table. Set once, never
   *  mutated — feeds row-based percent calculation. */
  plannedTotalRows: number;
  /**
   * Bumps the shared "rows processed" counter by `n` and returns the new
   * total. Called at chunk boundaries during the row loop so the periodic
   * emit can compute a fresh percent from cumulative rows-across-all-tables.
   */
  onRowsCompleted: (n: number) => number;
};

async function loadLibraryTable(
  ele: (typeof arr)[number],
  options: LoadLibraryOptions,
  log: (msg: string) => void,
  ctx?: PerTableContext,
): Promise<{
  table: string;
  selected: number;
  loaded: number;
  failed: number;
}> {
  const writeExcel = options.writeExcelLog === true;
  log(`[library-load] ${ele.table}: selecting…`);

  const workbookPath = writeExcel
    ? migrationWorkbookPathForTable(ele.table)
    : null;
  const alreadySuccessful = workbookPath
    ? await readSuccessfulLegacyIdsFromWorkbook(workbookPath)
    : new Set<number>();

  // Restart-friendliness: on any run beyond the first, the new DB already has
  // rows keyed on legacy_x_id for whatever this table loaded last time. Skip
  // those IDs so a crashed / re-triggered load only processes what's actually
  // missing, instead of walking every row from row 1 through the (idempotent
  // but slow) upsert path again. Ongoing edits from old IRP are picked up by
  // the delta-sync service, not this loader.
  const { findLegacyMapping } =
    await import("./services/library-legacy-mapping.js");
  const mapping = findLegacyMapping(ele.table);
  if (mapping) {
    try {
      const loadedRows = (
        await db.execute(
          drizzleSql.raw(`
            SELECT ${mapping.legacyIdColumn} AS id
            FROM ${mapping.newTable}
            WHERE ${mapping.legacyIdColumn} IS NOT NULL
          `),
        )
      ).rows as Array<{ id: number }>;
      let skippedCount = 0;
      for (const r of loadedRows) {
        const id = Number(r.id);
        if (Number.isFinite(id) && !alreadySuccessful.has(id)) {
          alreadySuccessful.add(id);
          skippedCount++;
        }
      }
      if (skippedCount > 0) {
        log(
          `[library-load] ${ele.table}: skipping ${skippedCount} row(s) already present in ${mapping.newTable}`,
        );
      }
    } catch (err) {
      log(
        `[library-load] ${ele.table}: skip-lookup failed (${
          err instanceof Error ? err.message : String(err)
        }) — will process every row`,
      );
    }
  }

  // Prefer the ids already fetched during the planning phase — saves a
  // second run of `ele.sql` per table (some of those SELECTs have expensive
  // joins). Fall back to a live query only when we've been called outside
  // the top-level loader (e.g. a test that constructs its own context).
  const preplanned = ctx?.plannedIds.get(ele.table);
  const rows: { id: number }[] = preplanned
    ? preplanned.map((id) => ({ id }))
    : (
        (await mysqlConnection.query(ele.sql)) as [{ id: number }[], unknown]
      )[0];

  const selected = options.limitPerTable
    ? rows.slice(0, options.limitPerTable)
    : rows;

  let loaded = 0;
  let failed = 0;

  const CHUNK = 2_000;

  // Periodic in-flight heartbeat. Without this, a table that takes many
  // minutes emits nothing between "start" and "done", and every dashboard
  // widget stays frozen for the duration. Every 5 seconds we fire a
  // lightweight `library:master:updated` so the client's realtime hook
  // invalidates `library-*` queries and the widgets refetch fresh counts.
  const HEARTBEAT_MS = 5_000;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  const startHeartbeat = () => {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(async () => {
      try {
        const { emitLibraryEvent } =
          await import("./services/library-realtime.service.js");
        emitLibraryEvent("library:master:updated", {
          detail: {
            source: "library-load-heartbeat",
            table: ele.table,
            loaded,
            failed,
          },
        });
      } catch {
        // Never let a socket failure fail the load.
      }
    }, HEARTBEAT_MS);
  };
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };
  startHeartbeat();

  try {
    for (let offset = 0; offset < selected.length; offset += CHUNK) {
      const chunk = selected.slice(offset, offset + CHUNK);
      await primeLegacyRows(
        ele.table,
        chunk.map((r) => r.id),
      );

      // Bounded worker pool inside the chunk. Each worker pulls the next row
      // from `queue` — this handles the case where one resolver is much slower
      // than another (e.g. copy → book → publisher fan-out) without any
      // resolver hogging the whole worker slot.
      let cursor = 0;
      const runOne = async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= chunk.length) return;
          const row = chunk[idx];
          if (alreadySuccessful.has(row.id)) continue;

          let tmp: unknown;
          try {
            tmp = await ele.fn(row.id);
          } catch (err) {
            failed++;
            const msg = err instanceof Error ? err.message : String(err);
            log(`[library-load] ${ele.table} #${row.id} FAILED: ${msg}`);
            if (workbookPath) {
              await appendMigrationLogRow(
                workbookPath,
                row.id,
                "failed",
                msg,
              ).catch(() => undefined);
            }
            continue;
          }

          if (tmp) {
            loaded++;
            if (workbookPath) {
              await appendMigrationLogRow(workbookPath, row.id, "success", null)
                .then(() => alreadySuccessful.add(row.id))
                .catch(() => undefined);
            }
          } else {
            // Null return is not always an error — the resolvers return null
            // for a legacy row we cannot place. Counted as failed for the
            // summary but never crashes the load.
            failed++;
            if (workbookPath) {
              await appendMigrationLogRow(
                workbookPath,
                row.id,
                "failed",
                "migration returned no result",
              ).catch(() => undefined);
            }
          }
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(ROW_WORKERS, chunk.length) }, runOne),
      );

      // Chunk-boundary emit — pushes the row-based percent forward so the
      // dashboard's progress bar tracks real work instead of only moving when
      // an entire table finishes. Uses the shared cumulative rows counter, not
      // the local (loaded + failed) delta. Also carries rowsProcessed +
      // rowsTotal so the client can fit a recent-rate window and project a
      // fresh ETA without the "ratchet always up" behaviour of a since-start
      // projection.
      if (ctx) {
        const rowsDone = ctx.onRowsCompleted(chunk.length);
        try {
          const { emitLibraryLoadProgress } =
            await import("./services/library-realtime.service.js");
          emitLibraryLoadProgress({
            table: ele.table,
            loaded,
            failed,
            total: selected.length,
            done: false,
            percent: ctx.plannedTotalRows
              ? Math.min(
                  100,
                  Math.round((rowsDone / ctx.plannedTotalRows) * 100),
                )
              : undefined,
            layer: ctx.layerIndex,
            layerTotal: ctx.layerTotal,
            currentLayerTables: ctx.currentLayerTables,
            dependsOn: ctx.dependsOn,
            tablesDone: undefined,
            tablesTotal: ctx.tablesTotal,
            rowsProcessed: rowsDone,
            rowsTotal: ctx.plannedTotalRows,
          });
        } catch {
          // Never let a socket failure fail the load.
        }
      }
    }
  } finally {
    stopHeartbeat();
  }

  log(
    `[library-load] ${ele.table}: ${loaded} loaded, ${failed} failed of ${selected.length}`,
  );

  // Per-table completion emit — reports final counts + advances the "tables
  // done" counter (the banner uses it to say "17 of 26 tables done"). The
  // percent field uses the shared row-based total so the progress bar keeps
  // moving smoothly across table boundaries. Rows already accumulated via
  // chunk emits above; here we just publish the final table-done fact.
  try {
    const { emitLibraryLoadProgress } =
      await import("./services/library-realtime.service.js");
    const tablesDone = ctx?.onTableDone() ?? 1;
    const rowsCumulative = ctx?.plannedTotalRows
      ? // The chunk emits above already pushed this table's rows through
        // onRowsCompleted. We don't add again — just read the current
        // percent via a zero-increment call.
        ctx.onRowsCompleted(0)
      : 0;
    emitLibraryLoadProgress({
      table: ele.table,
      loaded,
      failed,
      total: selected.length,
      done: true,
      percent:
        ctx && ctx.plannedTotalRows
          ? Math.min(
              100,
              Math.round((rowsCumulative / ctx.plannedTotalRows) * 100),
            )
          : undefined,
      layer: ctx?.layerIndex,
      layerTotal: ctx?.layerTotal,
      currentLayerTables: ctx?.currentLayerTables,
      dependsOn: ctx?.dependsOn,
      tablesDone: ctx ? tablesDone : undefined,
      tablesTotal: ctx?.tablesTotal,
      rowsProcessed: ctx ? rowsCumulative : undefined,
      rowsTotal: ctx?.plannedTotalRows,
    });
  } catch {
    // Never let a socket failure fail the load.
  }

  return { table: ele.table, selected: selected.length, loaded, failed };
}

export async function loadLibrary(
  options: LoadLibraryOptions = {},
): Promise<LoadLibraryResult> {
  const writeExcel = options.writeExcelLog === true;
  const log = options.onProgress ?? ((m: string) => console.log(m));
  const result: LoadLibraryResult = {
    tables: [],
    totalLoaded: 0,
    totalFailed: 0,
  };

  if (writeExcel) getLibraryExcelBaseDir();

  const allowed = options.onlyTables?.length
    ? new Set(options.onlyTables)
    : null;

  // Layer-by-layer: everything in a layer runs in parallel, layers are
  // strictly sequential. Anything in `arr` not in a layer runs last.
  const layered = LOAD_LAYERS.map((layer) =>
    arr.filter(
      (e) => layer.includes(e.table) && (!allowed || allowed.has(e.table)),
    ),
  );
  const layeredNames = new Set(LOAD_LAYERS.flat());
  const leftovers = arr.filter(
    (e) => !layeredNames.has(e.table) && (!allowed || allowed.has(e.table)),
  );

  const layers = [...layered, leftovers].filter((l) => l.length > 0);
  const tablesTotal = layers.reduce((a, l) => a + l.length, 0);
  let tablesDone = 0;

  // ── Planning phase ───────────────────────────────────────────────────────
  // Fetch every table's row ids in parallel BEFORE any processing starts.
  // Two wins: (1) we know the true row count across all tables up-front so
  // the progress % reflects real work (not "we've done 20 of 26 tables"
  // when the remaining tables hold 90% of the rows); (2) we don't run each
  // `arr[i].sql` twice — the processing loop reads the cached ids.
  log(`[library-load] planning: counting rows across ${tablesTotal} table(s)…`);
  const plannedIds = new Map<string, number[]>();
  const flatTables = layers.flat();
  await Promise.all(
    flatTables.map(async (ele) => {
      try {
        const [rows] = (await mysqlConnection.query(ele.sql)) as [
          { id: number }[],
          unknown,
        ];
        const cap = options.limitPerTable ?? rows.length;
        plannedIds.set(
          ele.table,
          rows.slice(0, cap).map((r) => Number(r.id)),
        );
      } catch (err) {
        log(
          `[library-load] planning ${ele.table} failed: ${
            err instanceof Error ? err.message : String(err)
          } — treating as 0 rows`,
        );
        plannedIds.set(ele.table, []);
      }
    }),
  );
  const plannedTotalRows = [...plannedIds.values()].reduce(
    (a, ids) => a + ids.length,
    0,
  );
  log(
    `[library-load] planning done: ${plannedTotalRows.toLocaleString()} row(s) across ${flatTables.length} table(s)`,
  );

  // Shared row-progress counter — passed into every table so the % bar is
  // truly row-based, not table-count-based.
  let rowsProcessed = 0;
  const onRowsCompleted = (n: number) => {
    rowsProcessed += n;
    return rowsProcessed;
  };

  // Seed the initial snapshot with the total so the client's banner shows a
  // real 0% + planned-rows figure from the very first paint (rather than
  // holding on the "Starting…" placeholder until the first chunk finishes).
  // Carries rowsProcessed=0 + rowsTotal so the client-side rate hook has its
  // first sample immediately — otherwise it stays on "estimating…" until the
  // second emit lands (~2000 rows later), which can be many minutes on heavy
  // tables.
  try {
    const { emitLibraryLoadProgress } =
      await import("./services/library-realtime.service.js");
    emitLibraryLoadProgress({
      table: flatTables[0]?.table ?? "",
      loaded: 0,
      failed: 0,
      total: plannedTotalRows,
      done: false,
      percent: 0,
      tablesDone: 0,
      tablesTotal,
      rowsProcessed: 0,
      rowsTotal: plannedTotalRows,
    });
  } catch {
    // Never let a socket failure fail the load.
  }

  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li];
    const currentLayerTables = layer.map((e) => e.table);
    const dependsOn = li > 0 ? layers[li - 1].map((e) => e.table) : [];
    log(
      `[library-load] layer ${li + 1}/${layers.length}: ${currentLayerTables.join(", ")}${
        dependsOn.length ? ` (depends on: ${dependsOn.join(", ")})` : ""
      }`,
    );
    const layerResults = await Promise.all(
      layer.map((ele) =>
        loadLibraryTable(ele, options, log, {
          layerIndex: li + 1,
          layerTotal: layers.length,
          onTableDone: () => ++tablesDone,
          tablesTotal,
          currentLayerTables,
          dependsOn,
          plannedIds,
          plannedTotalRows,
          onRowsCompleted,
        }),
      ),
    );
    for (const r of layerResults) {
      result.tables.push(r);
      result.totalLoaded += r.loaded;
      result.totalFailed += r.failed;
    }
  }

  return result;
}

export async function loadLibraryUsers() {
  let [[result]] = (await mysqlConnection.query(`
    SELECT * FROM staffpersonaldetails WHERE id = 68;
  `)) as [OldStaff[], unknown];

  console.log(`result: `, result);
  result.email = "library@thebges.edu.in";

  const libraryUser = await upsertUser(result, "STAFF");
  console.log(`libraryUser: `, libraryUser);
}
