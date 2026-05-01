import ExcelJS from "exceljs";
import { db } from "@/db/index.js";
import { and, asc, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { journalTypeModel } from "@repo/db/schemas/models/library/journal-type.model.js";
import { entryModeModel } from "@repo/db/schemas/models/library/entry-mode.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { bindingModel } from "@repo/db/schemas/models/library/binding.model.js";
import { libraryPeriodModel } from "@repo/db/schemas/models/library/library-period.model.js";
import { languageMediumModel } from "@repo/db/schemas/models/resources/languageMedium.model.js";
import { subjectGroupingMainModel } from "@repo/db/schemas/models/course-design/subject-grouping-main.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";

export type JournalListFilters = {
  page: number;
  limit: number;
  search?: string;
  subjectGroupId?: number;
  entryModeId?: number;
  languageId?: number;
  bindingId?: number;
  periodId?: number;
  publisherId?: number;
};

export type JournalExportFilters = Omit<JournalListFilters, "page" | "limit">;

export type JournalListRow = {
  id: number;
  title: string;
  issnNumber: string | null;
  sizeInCM: string | null;
  journalTypeName: string | null;
  publisherName: string | null;
  entryModeName: string | null;
  languageName: string | null;
  bindingName: string | null;
  periodName: string | null;
  subjectGroupName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JournalListResult = {
  rows: JournalListRow[];
  total: number;
  page: number;
  limit: number;
};

export type JournalDetail = {
  id: number;
  legacyJournalId: number | null;
  type: number | null;
  subjectGroupId: number | null;
  title: string;
  entryModeId: number | null;
  publisherId: number | null;
  languageId: number | null;
  bindingId: number | null;
  periodId: number | null;
  issnNumber: string | null;
  sizeInCM: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JournalUpsertInput = {
  title: string;
  type?: number | null;
  subjectGroupId?: number | null;
  entryModeId?: number | null;
  publisherId?: number | null;
  languageId?: number | null;
  bindingId?: number | null;
  periodId?: number | null;
  issnNumber?: string | null;
  sizeInCM?: string | null;
};

export type JournalLinkedBookRow = {
  id: number;
  title: string;
};

export type JournalMetaResult = {
  journalTypes: Array<{ id: number; name: string | null }>;
  entryModes: Array<{ id: number; name: string | null }>;
  publishers: Array<{ id: number; name: string | null }>;
  languages: Array<{ id: number; name: string | null }>;
  bindings: Array<{ id: number; name: string | null }>;
  periods: Array<{ id: number; name: string | null }>;
  subjectGroups: Array<{ id: number; name: string }>;
};

const buildListWhere = (
  filters: Omit<JournalListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    parts.push(
      or(
        ilike(journalModel.title, term),
        ilike(journalModel.issnNumber, term),
        ilike(journalTypeModel.name, term),
        ilike(publisherModel.name, term),
        ilike(entryModeModel.name, term),
        ilike(languageMediumModel.name, term),
        ilike(bindingModel.name, term),
        ilike(libraryPeriodModel.name, term),
        ilike(subjectGroupingMainModel.name, term),
      )!,
    );
  }
  if (filters.subjectGroupId != null && !Number.isNaN(filters.subjectGroupId)) {
    parts.push(eq(journalModel.subjectGroupId, filters.subjectGroupId));
  }
  if (filters.entryModeId != null && !Number.isNaN(filters.entryModeId)) {
    parts.push(eq(journalModel.entryModeId, filters.entryModeId));
  }
  if (filters.languageId != null && !Number.isNaN(filters.languageId)) {
    parts.push(eq(journalModel.languageId, filters.languageId));
  }
  if (filters.bindingId != null && !Number.isNaN(filters.bindingId)) {
    parts.push(eq(journalModel.bindingId, filters.bindingId));
  }
  if (filters.periodId != null && !Number.isNaN(filters.periodId)) {
    parts.push(eq(journalModel.periodId, filters.periodId));
  }
  if (filters.publisherId != null && !Number.isNaN(filters.publisherId)) {
    parts.push(eq(journalModel.publisherId, filters.publisherId));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findJournalsPaginated(
  filters: JournalListFilters,
): Promise<JournalListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);
  const searchTrimmed = rest.search?.trim();

  const countWithSearchJoins = () =>
    db
      .select({ total: count() })
      .from(journalModel)
      .leftJoin(journalTypeModel, eq(journalModel.type, journalTypeModel.id))
      .leftJoin(publisherModel, eq(journalModel.publisherId, publisherModel.id))
      .leftJoin(entryModeModel, eq(journalModel.entryModeId, entryModeModel.id))
      .leftJoin(
        languageMediumModel,
        eq(journalModel.languageId, languageMediumModel.id),
      )
      .leftJoin(bindingModel, eq(journalModel.bindingId, bindingModel.id))
      .leftJoin(
        libraryPeriodModel,
        eq(journalModel.periodId, libraryPeriodModel.id),
      )
      .leftJoin(
        subjectGroupingMainModel,
        eq(journalModel.subjectGroupId, subjectGroupingMainModel.id),
      );

  const [{ total }] = searchTrimmed
    ? await countWithSearchJoins().where(whereClause)
    : await db.select({ total: count() }).from(journalModel).where(whereClause);

  const rows = await db
    .select({
      id: journalModel.id,
      title: journalModel.title,
      issnNumber: journalModel.issnNumber,
      sizeInCM: journalModel.sizeInCM,
      journalTypeName: journalTypeModel.name,
      publisherName: publisherModel.name,
      entryModeName: entryModeModel.name,
      languageName: languageMediumModel.name,
      bindingName: bindingModel.name,
      periodName: libraryPeriodModel.name,
      subjectGroupName: subjectGroupingMainModel.name,
      createdAt: journalModel.createdAt,
      updatedAt: journalModel.updatedAt,
    })
    .from(journalModel)
    .leftJoin(journalTypeModel, eq(journalModel.type, journalTypeModel.id))
    .leftJoin(publisherModel, eq(journalModel.publisherId, publisherModel.id))
    .leftJoin(entryModeModel, eq(journalModel.entryModeId, entryModeModel.id))
    .leftJoin(
      languageMediumModel,
      eq(journalModel.languageId, languageMediumModel.id),
    )
    .leftJoin(bindingModel, eq(journalModel.bindingId, bindingModel.id))
    .leftJoin(
      libraryPeriodModel,
      eq(journalModel.periodId, libraryPeriodModel.id),
    )
    .leftJoin(
      subjectGroupingMainModel,
      eq(journalModel.subjectGroupId, subjectGroupingMainModel.id),
    )
    .where(whereClause)
    .orderBy(desc(journalModel.id))
    .limit(limit)
    .offset(offset);

  return {
    rows,
    total,
    page,
    limit,
  };
}

const formatExcelDateTime = (value: Date | string | null) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

export async function exportJournalsExcel(
  filters: JournalExportFilters,
): Promise<Buffer> {
  const whereClause = buildListWhere(filters);

  const rows = await db
    .select({
      id: journalModel.id,
      title: journalModel.title,
      issnNumber: journalModel.issnNumber,
      sizeInCM: journalModel.sizeInCM,
      journalTypeName: journalTypeModel.name,
      publisherName: publisherModel.name,
      entryModeName: entryModeModel.name,
      languageName: languageMediumModel.name,
      bindingName: bindingModel.name,
      periodName: libraryPeriodModel.name,
      subjectGroupName: subjectGroupingMainModel.name,
      createdAt: journalModel.createdAt,
      updatedAt: journalModel.updatedAt,
    })
    .from(journalModel)
    .leftJoin(journalTypeModel, eq(journalModel.type, journalTypeModel.id))
    .leftJoin(publisherModel, eq(journalModel.publisherId, publisherModel.id))
    .leftJoin(entryModeModel, eq(journalModel.entryModeId, entryModeModel.id))
    .leftJoin(
      languageMediumModel,
      eq(journalModel.languageId, languageMediumModel.id),
    )
    .leftJoin(bindingModel, eq(journalModel.bindingId, bindingModel.id))
    .leftJoin(
      libraryPeriodModel,
      eq(journalModel.periodId, libraryPeriodModel.id),
    )
    .leftJoin(
      subjectGroupingMainModel,
      eq(journalModel.subjectGroupId, subjectGroupingMainModel.id),
    )
    .where(whereClause)
    .orderBy(desc(journalModel.id))
    .limit(100_000);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Journals");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Title", key: "title", width: 42 },
    { header: "Journal type", key: "journalType", width: 22 },
    { header: "Subject group", key: "subjectGroup", width: 28 },
    { header: "Entry mode", key: "entryMode", width: 28 },
    { header: "Publisher", key: "publisher", width: 28 },
    { header: "Language", key: "language", width: 18 },
    { header: "Binding", key: "binding", width: 18 },
    { header: "Period / frequency", key: "period", width: 20 },
    { header: "ISSN", key: "issn", width: 18 },
    { header: "Size (cm)", key: "sizeCm", width: 12 },
    { header: "Created at", key: "createdAt", width: 22 },
    { header: "Updated at", key: "updatedAt", width: 22 },
  ];

  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      title: row.title ?? "",
      journalType: row.journalTypeName ?? "",
      subjectGroup: row.subjectGroupName ?? "",
      entryMode: row.entryModeName ?? "",
      publisher: row.publisherName ?? "",
      language: row.languageName ?? "",
      binding: row.bindingName ?? "",
      period: row.periodName ?? "",
      issn: row.issnNumber ?? "",
      sizeCm: row.sizeInCM ?? "",
      createdAt: formatExcelDateTime(row.createdAt),
      updatedAt: formatExcelDateTime(row.updatedAt),
    });
  }

  applyStandardExcelReportTableStyling(sheet);

  const result = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}

export async function getJournalById(
  id: number,
): Promise<JournalDetail | null> {
  const [row] = await db
    .select({
      id: journalModel.id,
      legacyJournalId: journalModel.legacyJournalId,
      type: journalModel.type,
      subjectGroupId: journalModel.subjectGroupId,
      title: journalModel.title,
      entryModeId: journalModel.entryModeId,
      publisherId: journalModel.publisherId,
      languageId: journalModel.languageId,
      bindingId: journalModel.bindingId,
      periodId: journalModel.periodId,
      issnNumber: journalModel.issnNumber,
      sizeInCM: journalModel.sizeInCM,
      createdAt: journalModel.createdAt,
      updatedAt: journalModel.updatedAt,
    })
    .from(journalModel)
    .where(eq(journalModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createJournal(
  input: JournalUpsertInput,
): Promise<number> {
  const [inserted] = await db
    .insert(journalModel)
    .values({
      title: input.title.trim(),
      type: input.type ?? null,
      subjectGroupId: input.subjectGroupId ?? null,
      entryModeId: input.entryModeId ?? null,
      publisherId: input.publisherId ?? null,
      languageId: input.languageId ?? null,
      bindingId: input.bindingId ?? null,
      periodId: input.periodId ?? null,
      issnNumber: input.issnNumber?.trim() || null,
      sizeInCM: input.sizeInCM?.trim() || null,
    })
    .returning({ id: journalModel.id });
  return inserted.id;
}

export async function updateJournal(
  id: number,
  input: JournalUpsertInput,
): Promise<void> {
  await db
    .update(journalModel)
    .set({
      title: input.title.trim(),
      type: input.type ?? null,
      subjectGroupId: input.subjectGroupId ?? null,
      entryModeId: input.entryModeId ?? null,
      publisherId: input.publisherId ?? null,
      languageId: input.languageId ?? null,
      bindingId: input.bindingId ?? null,
      periodId: input.periodId ?? null,
      issnNumber: input.issnNumber?.trim() || null,
      sizeInCM: input.sizeInCM?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(journalModel.id, id));
}

export async function deleteJournal(id: number): Promise<void> {
  await db.delete(journalModel).where(eq(journalModel.id, id));
}

export async function listBooksLinkedToJournal(
  journalId: number,
): Promise<JournalLinkedBookRow[]> {
  return db
    .select({
      id: bookModel.id,
      title: bookModel.title,
    })
    .from(bookModel)
    .where(eq(bookModel.journalId, journalId))
    .orderBy(asc(bookModel.title));
}

export async function getJournalMeta(): Promise<JournalMetaResult> {
  const [
    journalTypes,
    entryModes,
    publishers,
    languages,
    bindings,
    periods,
    subjectGroups,
  ] = await Promise.all([
    db
      .select({ id: journalTypeModel.id, name: journalTypeModel.name })
      .from(journalTypeModel)
      .orderBy(desc(journalTypeModel.id)),
    db
      .select({ id: entryModeModel.id, name: entryModeModel.name })
      .from(entryModeModel)
      .orderBy(desc(entryModeModel.id)),
    db
      .select({ id: publisherModel.id, name: publisherModel.name })
      .from(publisherModel)
      .orderBy(desc(publisherModel.id))
      .limit(500),
    db
      .select({ id: languageMediumModel.id, name: languageMediumModel.name })
      .from(languageMediumModel)
      .orderBy(desc(languageMediumModel.id)),
    db
      .select({ id: bindingModel.id, name: bindingModel.name })
      .from(bindingModel)
      .orderBy(desc(bindingModel.id)),
    db
      .select({ id: libraryPeriodModel.id, name: libraryPeriodModel.name })
      .from(libraryPeriodModel)
      .orderBy(desc(libraryPeriodModel.id)),
    db
      .select({
        id: subjectGroupingMainModel.id,
        name: subjectGroupingMainModel.name,
      })
      .from(subjectGroupingMainModel)
      .orderBy(desc(subjectGroupingMainModel.id))
      .limit(500),
  ]);

  return {
    journalTypes,
    entryModes,
    publishers,
    languages,
    bindings,
    periods,
    subjectGroups,
  };
}
