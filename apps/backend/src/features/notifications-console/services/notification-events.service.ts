import ExcelJS from "exceljs";
import { and, desc, eq, inArray, sql, count, type SQL } from "drizzle-orm";
import { db } from "@/db/index.js";
import { enqueueNotification } from "@/services/notificationClient.js";
import {
  uploadToS3,
  getBufferFromS3,
  createUploadConfig,
} from "@/services/s3.service.js";
import {
  notificationModel,
  notificationMasterModel,
  notificationMasterFieldModel,
  notificationContentModel,
  notificationEventModel,
  notificationEventShiftModel,
  notificationEventSectionModel,
  notificationEventGenderModel,
  notificationEventReligionModel,
  notificationEventCategoryModel,
  notificationEventQuotaTypeModel,
  userModel,
  studentModel,
  personalDetailsModel,
  promotionModel,
  programCourseModel,
  sessionModel,
} from "@repo/db/schemas";
import { listMasterFields } from "./notifications-console.service.js";
import { verificationMode } from "./notification-verification.service.js";

/**
 * In development/staging, a real campaign of thousands would still create
 * thousands of notifications — all redirected to the developer (dev) or the
 * staging staff (staging). Cap the actual sends to a small test batch there;
 * production is uncapped.
 */
const TEST_SEND_CAP = 5;

export type SendTarget = {
  userId: number | null;
  name: string;
  type: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

/**
 * Who a send would actually reach in the current environment, and the test cap.
 * development → the developer contact; staging → the opted-in staging staff;
 * production → real recipients (no cap, empty target list).
 */
export async function getEventSendPreview(): Promise<{
  mode: "development" | "staging" | "production";
  cap: number | null;
  targets: SendTarget[];
}> {
  const mode = verificationMode();
  if (mode === "production") return { mode, cap: null, targets: [] };
  if (mode === "development") {
    return {
      mode,
      cap: TEST_SEND_CAP,
      targets: [
        {
          userId: null,
          name: "Developer",
          type: "DEVELOPER",
          email: process.env.DEVELOPER_EMAIL || null,
          phone: process.env.DEVELOPER_PHONE || null,
          whatsapp: process.env.DEVELOPER_PHONE || null,
        },
      ],
    };
  }
  // staging — the worker fans out to these opted-in staff accounts.
  const staff = await db
    .select({
      userId: userModel.id,
      name: userModel.name,
      type: userModel.type,
      email: userModel.email,
      phone: userModel.phone,
      whatsapp: userModel.whatsappNumber,
    })
    .from(userModel)
    .where(
      and(
        eq(userModel.type, "STAFF" as never),
        eq(userModel.sendStagingNotifications, true),
        sql`COALESCE(${userModel.isActive}, true) = true`,
        sql`COALESCE(${userModel.isSuspended}, false) = false`,
      ),
    );
  return {
    mode,
    cap: TEST_SEND_CAP,
    targets: staff.map((s) => ({
      userId: s.userId,
      name: s.name,
      type: s.type ? String(s.type) : null,
      email: s.email,
      phone: s.phone ?? s.whatsapp,
      whatsapp: s.whatsapp,
    })),
  };
}

/** Cap recipients to the test batch in non-production environments. */
function applyTestCap<T>(recipients: T[]): { toSend: T[]; capped: boolean } {
  if (verificationMode() === "production")
    return { toSend: recipients, capped: false };
  return {
    toSend: recipients.slice(0, TEST_SEND_CAP),
    capped: recipients.length > TEST_SEND_CAP,
  };
}

export class EventError extends Error {
  constructor(
    public code: "NOT_FOUND" | "INVALID_STATE" | "NO_MASTER" | "NO_RECIPIENTS",
    message: string,
  ) {
    super(message);
  }
}

// Active promotion only — one cohort row per student (mirrors the dashboard).
const ACTIVE_PROMOTION_JOIN = () =>
  and(
    eq(promotionModel.studentId, studentModel.id),
    sql`${promotionModel.endDate} IS NULL`,
    sql`COALESCE(${promotionModel.isDeprecated}, false) = false`,
    eq(promotionModel.isAlumni, false),
  );

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

export type ScopeInput = {
  // Single-value primary cohort (columns on the event).
  academicYearId?: number | null;
  programCourseId?: number | null;
  classId?: number | null;
  // Multi-select (child tables).
  shiftIds?: number[];
  sectionIds?: number[];
  genders?: string[];
  religionIds?: number[];
  categoryIds?: number[];
  quotaTypeIds?: number[];
};

/** Read the multi-select child-table scope for an event (not the event's own FKs). */
async function readChildScope(eventId: number) {
  const [sh, se, ge, re, ca, qt] = await Promise.all([
    db
      .select({ v: notificationEventShiftModel.shiftId })
      .from(notificationEventShiftModel)
      .where(eq(notificationEventShiftModel.notificationEventId, eventId)),
    db
      .select({ v: notificationEventSectionModel.sectionId })
      .from(notificationEventSectionModel)
      .where(eq(notificationEventSectionModel.notificationEventId, eventId)),
    db
      .select({ v: notificationEventGenderModel.gender })
      .from(notificationEventGenderModel)
      .where(eq(notificationEventGenderModel.notificationEventId, eventId)),
    db
      .select({ v: notificationEventReligionModel.religionId })
      .from(notificationEventReligionModel)
      .where(eq(notificationEventReligionModel.notificationEventId, eventId)),
    db
      .select({ v: notificationEventCategoryModel.categoryId })
      .from(notificationEventCategoryModel)
      .where(eq(notificationEventCategoryModel.notificationEventId, eventId)),
    db
      .select({ v: notificationEventQuotaTypeModel.quotaTypeId })
      .from(notificationEventQuotaTypeModel)
      .where(eq(notificationEventQuotaTypeModel.notificationEventId, eventId)),
  ]);
  return {
    shiftIds: sh.map((r) => r.v),
    sectionIds: se.map((r) => r.v),
    genders: ge.map((r) => String(r.v)),
    religionIds: re.map((r) => r.v),
    categoryIds: ca.map((r) => r.v),
    quotaTypeIds: qt.map((r) => r.v),
  };
}

/** Replace the multi-select child-table scope rows for an event. */
async function replaceChildScope(eventId: number, scope: ScopeInput) {
  await Promise.all([
    db
      .delete(notificationEventShiftModel)
      .where(eq(notificationEventShiftModel.notificationEventId, eventId)),
    db
      .delete(notificationEventSectionModel)
      .where(eq(notificationEventSectionModel.notificationEventId, eventId)),
    db
      .delete(notificationEventGenderModel)
      .where(eq(notificationEventGenderModel.notificationEventId, eventId)),
    db
      .delete(notificationEventReligionModel)
      .where(eq(notificationEventReligionModel.notificationEventId, eventId)),
    db
      .delete(notificationEventCategoryModel)
      .where(eq(notificationEventCategoryModel.notificationEventId, eventId)),
    db
      .delete(notificationEventQuotaTypeModel)
      .where(eq(notificationEventQuotaTypeModel.notificationEventId, eventId)),
  ]);
  const uniq = (a?: number[]) => [
    ...new Set((a ?? []).filter((n) => Number.isFinite(n) && n > 0)),
  ];
  const inserts: Promise<unknown>[] = [];
  const sh = uniq(scope.shiftIds);
  if (sh.length)
    inserts.push(
      db
        .insert(notificationEventShiftModel)
        .values(
          sh.map((shiftId) => ({ notificationEventId: eventId, shiftId })),
        ),
    );
  const se = uniq(scope.sectionIds);
  if (se.length)
    inserts.push(
      db
        .insert(notificationEventSectionModel)
        .values(
          se.map((sectionId) => ({ notificationEventId: eventId, sectionId })),
        ),
    );
  const ge = [...new Set((scope.genders ?? []).filter(Boolean))];
  if (ge.length)
    inserts.push(
      db.insert(notificationEventGenderModel).values(
        ge.map((gender) => ({
          notificationEventId: eventId,
          gender: gender as never,
        })),
      ),
    );
  const re = uniq(scope.religionIds);
  if (re.length)
    inserts.push(
      db.insert(notificationEventReligionModel).values(
        re.map((religionId) => ({
          notificationEventId: eventId,
          religionId,
        })),
      ),
    );
  const ca = uniq(scope.categoryIds);
  if (ca.length)
    inserts.push(
      db.insert(notificationEventCategoryModel).values(
        ca.map((categoryId) => ({
          notificationEventId: eventId,
          categoryId,
        })),
      ),
    );
  const qt = uniq(scope.quotaTypeIds);
  if (qt.length)
    inserts.push(
      db.insert(notificationEventQuotaTypeModel).values(
        qt.map((quotaTypeId) => ({
          notificationEventId: eventId,
          quotaTypeId,
        })),
      ),
    );
  await Promise.all(inserts);
}

export type ScopedStudent = {
  studentId: number;
  userId: number | null;
  uid: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
};

/** Full scope for an event = its single-value FKs + the multi-select child rows. */
async function readScope(eventId: number): Promise<ScopeInput> {
  const [ev] = await db
    .select({
      academicYearId: notificationEventModel.academicYearId,
      programCourseId: notificationEventModel.programCourseId,
      classId: notificationEventModel.classId,
    })
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, eventId))
    .limit(1);
  const child = await readChildScope(eventId);
  return {
    academicYearId: ev?.academicYearId ?? null,
    programCourseId: ev?.programCourseId ?? null,
    classId: ev?.classId ?? null,
    ...child,
  };
}

/** Resolve the students matching a scope (empty dimension = "any"). */
export async function resolveScopeStudents(
  scope: ScopeInput,
): Promise<ScopedStudent[]> {
  const parts = [
    scope.academicYearId
      ? eq(sessionModel.academicYearId, scope.academicYearId)
      : null,
    scope.programCourseId
      ? eq(promotionModel.programCourseId, scope.programCourseId)
      : null,
    scope.classId ? eq(promotionModel.classId, scope.classId) : null,
    scope.shiftIds?.length
      ? inArray(promotionModel.shiftId, scope.shiftIds)
      : null,
    scope.sectionIds?.length
      ? inArray(promotionModel.sectionId, scope.sectionIds)
      : null,
    scope.genders?.length
      ? inArray(personalDetailsModel.gender, scope.genders as never[])
      : null,
    scope.religionIds?.length
      ? inArray(personalDetailsModel.religionId, scope.religionIds)
      : null,
    scope.categoryIds?.length
      ? inArray(personalDetailsModel.categoryId, scope.categoryIds)
      : null,
    scope.quotaTypeIds?.length
      ? inArray(studentModel.quotaTypeId, scope.quotaTypeIds)
      : null,
  ].filter(Boolean) as SQL[];

  const rows = await db
    .selectDistinct({
      studentId: studentModel.id,
      userId: userModel.id,
      uid: studentModel.uid,
      name: userModel.name,
      email: userModel.email,
      whatsapp: userModel.whatsappNumber,
      phone: userModel.phone,
    })
    .from(studentModel)
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .innerJoin(promotionModel, ACTIVE_PROMOTION_JOIN())
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .where(parts.length ? and(...parts) : undefined);

  return rows.map((r) => ({
    studentId: r.studentId,
    userId: r.userId,
    uid: r.uid,
    name: r.name,
    email: r.email,
    whatsapp: r.whatsapp ?? r.phone,
  }));
}

// ---------------------------------------------------------------------------
// Events CRUD
// ---------------------------------------------------------------------------

export async function listEvents(f: {
  page: number;
  limit: number;
  search?: string | null;
}) {
  const where = f.search?.trim()
    ? sql`${notificationEventModel.name} ILIKE ${`%${f.search.trim()}%`}`
    : undefined;
  const [{ total }] = await db
    .select({ total: count() })
    .from(notificationEventModel)
    .where(where);
  const nid = notificationModel.id;
  const rows = await db
    .select({
      id: notificationEventModel.id,
      name: notificationEventModel.name,
      description: notificationEventModel.description,
      remarks: notificationEventModel.remarks,
      variant: notificationEventModel.variant,
      status: notificationEventModel.status,
      dataSourceMode: notificationEventModel.dataSourceMode,
      masterId: notificationEventModel.notificationMasterId,
      masterName: notificationMasterModel.name,
      uploadSummary: notificationEventModel.uploadSummary,
      createdAt: notificationEventModel.createdAt,
      total: sql<number>`count(${nid})`.mapWith(Number),
      sent: sql<number>`count(${nid}) filter (where ${notificationModel.status} = 'SENT')`.mapWith(
        Number,
      ),
      failed:
        sql<number>`count(${nid}) filter (where ${notificationModel.status} = 'FAILED')`.mapWith(
          Number,
        ),
    })
    .from(notificationEventModel)
    .leftJoin(
      notificationMasterModel,
      eq(
        notificationMasterModel.id,
        notificationEventModel.notificationMasterId,
      ),
    )
    .leftJoin(
      notificationModel,
      eq(notificationModel.notificationEventId, notificationEventModel.id),
    )
    .where(where)
    .groupBy(notificationEventModel.id, notificationMasterModel.name)
    .orderBy(
      desc(notificationEventModel.createdAt),
      desc(notificationEventModel.id),
    )
    .limit(f.limit)
    .offset((f.page - 1) * f.limit);
  return { rows, total: Number(total), page: f.page, limit: f.limit };
}

export type EventRecipientRow = {
  uid: string | null;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  status: string | null;
  values: Record<string, string>;
};

/**
 * Recipients for the read-only manage view. For a TRIGGERED event, reads the
 * real notifications (+ user + content); otherwise falls back to the staged
 * upload payload so DRAFT/READY events still show who they'll go to.
 */
export async function getEventRecipients(id: number): Promise<{
  fields: string[];
  recipients: EventRecipientRow[];
  triggered: boolean;
}> {
  const [ev] = await db
    .select({
      masterId: notificationEventModel.notificationMasterId,
      status: notificationEventModel.status,
      recipientsFileKey: notificationEventModel.recipientsFileKey,
    })
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  const fields = ev.masterId ? await eventMasterFields(ev.masterId) : [];

  if (ev.status === "TRIGGERED") {
    const notifs = await db
      .select({
        id: notificationModel.id,
        status: notificationModel.status,
        uid: studentModel.uid,
        name: userModel.name,
        whatsapp: userModel.whatsappNumber,
        phone: userModel.phone,
        email: userModel.email,
      })
      .from(notificationModel)
      .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .where(eq(notificationModel.notificationEventId, id))
      .orderBy(notificationModel.id);

    // Per-field content values keyed by notification id.
    const contents = notifs.length
      ? await db
          .select({
            notificationId: notificationContentModel.notificationId,
            field: notificationMasterFieldModel.name,
            content: notificationContentModel.content,
          })
          .from(notificationContentModel)
          .leftJoin(
            notificationMasterFieldModel,
            eq(
              notificationMasterFieldModel.id,
              notificationContentModel.whatsappFieldId,
            ),
          )
          .where(
            inArray(
              notificationContentModel.notificationId,
              notifs.map((n) => n.id),
            ),
          )
      : [];
    const valuesByNotif = new Map<number, Record<string, string>>();
    for (const c of contents) {
      if (!c.field) continue;
      const m = valuesByNotif.get(c.notificationId) ?? {};
      m[c.field] = String(c.content ?? "");
      valuesByNotif.set(c.notificationId, m);
    }

    return {
      fields,
      triggered: true,
      recipients: notifs.map((n) => ({
        uid: n.uid,
        name: n.name,
        whatsapp: n.whatsapp ?? n.phone,
        email: n.email,
        status: n.status,
        values: valuesByNotif.get(n.id) ?? {},
      })),
    };
  }

  // Not triggered — show the staged payload.
  if (!ev.recipientsFileKey)
    return { fields, triggered: false, recipients: [] };
  const { matched } = await readRecipientPayload(ev.recipientsFileKey);
  return {
    fields,
    triggered: false,
    recipients: matched.map((m) => ({
      uid: m.uid,
      name: m.name,
      whatsapp: m.whatsapp,
      email: null,
      status: null,
      values: m.values,
    })),
  };
}

export async function getEvent(id: number) {
  const [ev] = await db
    .select()
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) return null;
  const scope = await readScope(id);
  return { ...ev, scope };
}

export async function createEvent(input: {
  name: string;
  description?: string | null;
  remarks?: string | null;
  notificationMasterId: number;
  variant: string;
  dataSourceMode?: string;
  scope: ScopeInput;
  /** S3 key of a payload staged by parseEventRecipients — makes the event READY. */
  recipientsFileKey?: string | null;
  createdByUserId: number;
}) {
  // If a staged recipient payload is attached, recompute its summary from S3
  // (never trust client-side counts) and create the event as READY.
  let uploadSummary: { matched: number; unmatched: string[] } | null = null;
  if (input.recipientsFileKey) {
    const payload = await readRecipientPayload(input.recipientsFileKey);
    uploadSummary = {
      matched: payload.matched.length,
      unmatched: payload.unmatched,
    };
  }

  const [ev] = await db
    .insert(notificationEventModel)
    .values({
      name: input.name.trim(),
      description: input.description ?? null,
      remarks: input.remarks ?? null,
      notificationMasterId: input.notificationMasterId,
      variant: input.variant as never,
      dataSourceMode: (input.dataSourceMode ?? "UPLOAD") as never,
      status: uploadSummary ? "READY" : "DRAFT",
      recipientsFileKey: input.recipientsFileKey ?? null,
      uploadSummary,
      academicYearId: input.scope.academicYearId ?? null,
      programCourseId: input.scope.programCourseId ?? null,
      classId: input.scope.classId ?? null,
      createdByUserId: input.createdByUserId,
      updatedByUserId: input.createdByUserId,
    })
    .returning();
  await replaceChildScope(ev.id, input.scope);
  return ev;
}

export async function updateEvent(
  id: number,
  input: {
    name?: string;
    description?: string | null;
    remarks?: string | null;
    variant?: string;
    dataSourceMode?: string;
    scope?: ScopeInput;
    updatedByUserId: number;
  },
) {
  const [ev] = await db
    .select({ status: notificationEventModel.status })
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  if (ev.status === "TRIGGERED")
    throw new EventError(
      "INVALID_STATE",
      "A triggered event cannot be edited.",
    );

  const values: Record<string, unknown> = {
    updatedByUserId: input.updatedByUserId,
  };
  if (input.name !== undefined) values.name = input.name.trim();
  if (input.description !== undefined) values.description = input.description;
  if (input.remarks !== undefined) values.remarks = input.remarks;
  if (input.variant !== undefined) values.variant = input.variant;
  if (input.dataSourceMode !== undefined)
    values.dataSourceMode = input.dataSourceMode;
  if (input.scope) {
    values.academicYearId = input.scope.academicYearId ?? null;
    values.programCourseId = input.scope.programCourseId ?? null;
    values.classId = input.scope.classId ?? null;
  }
  const [row] = await db
    .update(notificationEventModel)
    .set(values)
    .where(eq(notificationEventModel.id, id))
    .returning();
  if (input.scope) await replaceChildScope(id, input.scope);
  return row;
}

export async function deleteEvent(id: number) {
  const [ev] = await db
    .select({ status: notificationEventModel.status })
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  if (ev.status === "TRIGGERED")
    throw new EventError(
      "INVALID_STATE",
      "A triggered event cannot be deleted.",
    );
  await replaceChildScope(id, {}); // clears all child scope rows
  await db
    .delete(notificationEventModel)
    .where(eq(notificationEventModel.id, id));
}

/** Preview: matched student count + a small sample. */
export async function resolveEventScopePreview(id: number) {
  const scope = await readScope(id);
  return resolveScopePreviewFromInput(scope);
}

/** Scope preview without an event row — used by the wizard before creation. */
export async function resolveScopePreviewFromInput(scope: ScopeInput) {
  const students = await resolveScopeStudents(scope);
  return {
    count: students.length,
    sample: students.slice(0, 10).map((s) => ({ uid: s.uid, name: s.name })),
  };
}

// ---------------------------------------------------------------------------
// Recipient upload (by student UID)
// ---------------------------------------------------------------------------

/** Ordered stored (db) field names for the event's master. */
async function eventMasterFields(masterId: number): Promise<string[]> {
  const fields = await listMasterFields(masterId);
  return fields.filter((f) => f.source === "db").map((f) => f.name);
}

/** Apply the shared styled header row (bold dark text on light grey, borders, freeze). */
function styleTemplateHeader(ws: ExcelJS.Worksheet, colCount: number) {
  const header = ws.getRow(1);
  header.height = 20;
  header.font = { bold: true, color: { argb: "FF1F2937" }, size: 11 };
  header.alignment = { vertical: "middle", horizontal: "left" };
  for (let c = 1; c <= colCount; c++) {
    const cell = header.getCell(c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFB0B7C3" } },
      bottom: { style: "thin", color: { argb: "FFB0B7C3" } },
      left: { style: "thin", color: { argb: "FFB0B7C3" } },
      right: { style: "thin", color: { argb: "FFB0B7C3" } },
    };
  }
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: colCount },
  };
}

/**
 * Headers-only recipient template for a master. Only `uid` is a manual column —
 * the remaining columns are the master's fields (in meta sequence). Recipient
 * name/whatsapp are resolved from the uid, so they are NOT columns here.
 */
export async function buildMasterTemplate(
  masterId: number,
  prefill?: ScopeInput,
) {
  const [master] = await db
    .select({ id: notificationMasterModel.id })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.id, masterId))
    .limit(1);
  if (!master) throw new EventError("NO_MASTER", "Master not found.");
  const fields = await eventMasterFields(masterId);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Recipients");
  ws.columns = [
    { header: "uid", key: "uid", width: 22 },
    ...fields.map((f) => ({ header: f, key: f, width: 24 })),
  ];
  styleTemplateHeader(ws, 1 + fields.length);
  if (prefill) {
    const students = await resolveScopeStudents(prefill);
    for (const s of students) ws.addRow({ uid: s.uid });
  }
  return wb;
}

/** Template for an existing event (AUTO_FETCH gets the scoped uids pre-filled). */
export async function buildEventTemplate(id: number) {
  const [ev] = await db
    .select({
      masterId: notificationEventModel.notificationMasterId,
      dataSourceMode: notificationEventModel.dataSourceMode,
    })
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  if (!ev.masterId) throw new EventError("NO_MASTER", "Event has no master.");
  const prefill =
    ev.dataSourceMode === "AUTO_FETCH" ? await readScope(id) : undefined;
  return buildMasterTemplate(ev.masterId, prefill);
}

type ParsedRecipient = {
  uid: string;
  userId: number | null;
  name: string | null;
  whatsapp: string | null;
  values: Record<string, string>;
};

export type ParseResult = {
  fileKey: string;
  matched: number;
  /** uids with no student record at all. */
  unknownUids: string[];
  /** uids whose student has no active promotion (not currently enrolled). */
  notEnrolled: string[];
  fields: string[];
  sample: ParsedRecipient[];
};

/**
 * Parse an uploaded sheet against a master's fields, match rows to students by
 * uid, and require an ACTIVE promotion (currently enrolled) — the two mandatory
 * checks. Enrollment is checked against the student's live active promotion in
 * ANY year, not the console-selected year (students' active promotion often
 * trails the console's working academic year). Name + whatsapp resolve from the
 * uid. Stages the matched payload in S3; no event row is touched.
 */
export async function parseEventRecipients(
  masterId: number,
  file: Express.Multer.File,
): Promise<ParseResult> {
  const fields = await eventMasterFields(masterId);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(file.buffer as never);
  const ws = wb.worksheets[0];
  if (!ws)
    throw new EventError("INVALID_STATE", "The uploaded file has no sheets.");

  // Header row → column index map (case-insensitive).
  const header: Record<string, number> = {};
  ws.getRow(1).eachCell((cell, col) => {
    const key = String(cell.value ?? "")
      .trim()
      .toLowerCase();
    if (key) header[key] = col;
  });
  const uidCol = header["uid"];
  if (!uidCol)
    throw new EventError(
      "INVALID_STATE",
      "The sheet must have a 'uid' column.",
    );

  const parsed: Array<{ uid: string; values: Record<string, string> }> = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const uid = String(row.getCell(uidCol).value ?? "").trim();
    if (!uid) continue;
    const values: Record<string, string> = {};
    for (const f of fields) {
      const col = header[f.toLowerCase()];
      values[f] = col ? String(row.getCell(col).value ?? "").trim() : "";
    }
    parsed.push({ uid, values });
  }

  const uids = [...new Set(parsed.map((p) => p.uid))];

  // (1) Which uids have a student at all?
  const students = uids.length
    ? await db
        .select({
          uid: studentModel.uid,
          userId: studentModel.userId,
          name: userModel.name,
          whatsapp: userModel.whatsappNumber,
          phone: userModel.phone,
        })
        .from(studentModel)
        .innerJoin(userModel, eq(userModel.id, studentModel.userId))
        .where(inArray(studentModel.uid, uids))
    : [];
  const byUid = new Map(students.map((s) => [s.uid, s]));

  // (2) Which of those have an ACTIVE promotion (are currently enrolled)?
  const enrolled = uids.length
    ? new Set(
        (
          await db
            .selectDistinct({ uid: studentModel.uid })
            .from(studentModel)
            .innerJoin(promotionModel, ACTIVE_PROMOTION_JOIN())
            .where(inArray(studentModel.uid, uids))
        ).map((r) => r.uid),
      )
    : new Set<string>();

  const matched: ParsedRecipient[] = [];
  const unknownUids: string[] = [];
  const notEnrolled: string[] = [];
  for (const p of parsed) {
    const s = byUid.get(p.uid);
    if (!s?.userId) {
      unknownUids.push(p.uid);
      continue;
    }
    if (!enrolled.has(p.uid)) {
      notEnrolled.push(p.uid);
      continue;
    }
    matched.push({
      uid: p.uid,
      userId: s.userId,
      name: s.name,
      whatsapp: s.whatsapp ?? s.phone,
      values: p.values,
    });
  }

  // Stage the matched payload in S3 — the event references it at creation time.
  const payload = Buffer.from(
    JSON.stringify({ matched, unmatched: [...unknownUids, ...notEnrolled] }),
    "utf8",
  );
  const uploaded = await uploadToS3(
    {
      buffer: payload,
      originalname: `event-recipients-${Date.now()}.json`,
      mimetype: "application/json",
      size: payload.length,
    } as Express.Multer.File,
    createUploadConfig("notification-events/recipients", {
      maxFileSizeMB: 25,
      allowedMimeTypes: ["application/json"],
    }),
  );

  return {
    fileKey: uploaded.key,
    matched: matched.length,
    unknownUids,
    notEnrolled,
    fields,
    sample: matched.slice(0, 10),
  };
}

/** Attach parsed recipients to an EXISTING event (manage flow for old drafts). */
export async function uploadEventRecipients(
  id: number,
  file: Express.Multer.File,
) {
  const [ev] = await db
    .select({
      masterId: notificationEventModel.notificationMasterId,
      status: notificationEventModel.status,
    })
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  if (ev.status === "TRIGGERED")
    throw new EventError(
      "INVALID_STATE",
      "A triggered event cannot accept new recipients.",
    );
  if (!ev.masterId) throw new EventError("NO_MASTER", "Event has no master.");

  const result = await parseEventRecipients(ev.masterId, file);
  await db
    .update(notificationEventModel)
    .set({
      recipientsFileKey: result.fileKey,
      uploadSummary: {
        matched: result.matched,
        unmatched: [...result.unknownUids, ...result.notEnrolled],
      },
      status: "READY",
    })
    .where(eq(notificationEventModel.id, id));
  return result;
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

async function readRecipientPayload(key: string) {
  const buf = await getBufferFromS3(key);
  if (!buf)
    return { matched: [] as ParsedRecipient[], unmatched: [] as string[] };
  return JSON.parse(buf.toString("utf8")) as {
    matched: ParsedRecipient[];
    unmatched: string[];
  };
}

/** Fan out one notification per matched recipient through the send engine. */
type EnqueueRecipient = {
  userId: number | null;
  values: Record<string, string>;
};

/**
 * Fan out one notification per recipient through the send engine. Counts ACTUAL
 * successful enqueues — a failed/unreachable notification-system must not be
 * reported as sent.
 */
async function enqueueEventRecipients(
  ev: {
    id: number;
    name: string;
    variant: unknown;
    notificationMasterId: number | null;
  },
  recipients: EnqueueRecipient[],
  // Staging only: route each send to exactly these staff contacts (the worker's
  // staging branch honours otherUsers* over the blanket staff fan-out).
  stagingTargets?: { emails: string[]; whatsapp: string[] },
) {
  const fields = ev.notificationMasterId
    ? await eventMasterFields(ev.notificationMasterId)
    : [];
  const variant = String(ev.variant ?? "WHATSAPP");
  const CHUNK = 20;
  let enqueued = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const slice = recipients.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      slice.map((rec) => {
        const bodyValues = fields.map((f) => rec.values[f] ?? "");
        const templateData: Record<string, string> = {};
        for (const f of fields) templateData[f] = rec.values[f] ?? "";
        const dto = {
          userId: rec.userId,
          variant,
          type: "EVENT" as const,
          message: ev.name,
          notificationMasterId: ev.notificationMasterId,
          otherUsersEmails: stagingTargets?.emails.length
            ? stagingTargets.emails
            : undefined,
          otherUsersWhatsAppNumbers: stagingTargets?.whatsapp.length
            ? stagingTargets.whatsapp
            : undefined,
          notificationEvent: {
            id: ev.id,
            bodyValues: variant === "WHATSAPP" ? bodyValues : undefined,
            templateData: variant === "EMAIL" ? templateData : undefined,
          },
        };
        return enqueueNotification(dto as never);
      }),
    );
    for (const r of results) {
      if (
        r.status === "fulfilled" &&
        (r.value as { id?: number } | undefined)?.id
      )
        enqueued++;
      else failed++;
    }
  }
  return { enqueued, failed };
}

/**
 * In staging, resolve the selected staff ids to their contacts — but only
 * accept ids that are genuinely opted-in active staging staff (never route to
 * an arbitrary user). Returns undefined outside staging.
 */
async function resolveStagingTargets(
  staffUserIds: number[] | undefined,
): Promise<{ emails: string[]; whatsapp: string[] } | undefined> {
  if (verificationMode() !== "staging") return undefined;
  if (!staffUserIds?.length)
    throw new EventError(
      "NO_RECIPIENTS",
      "Select at least one staging staff recipient.",
    );
  const rows = await db
    .select({
      email: userModel.email,
      whatsapp: userModel.whatsappNumber,
      phone: userModel.phone,
    })
    .from(userModel)
    .where(
      and(
        inArray(userModel.id, staffUserIds),
        eq(userModel.type, "STAFF" as never),
        eq(userModel.sendStagingNotifications, true),
        sql`COALESCE(${userModel.isActive}, true) = true`,
        sql`COALESCE(${userModel.isSuspended}, false) = false`,
      ),
    );
  if (rows.length === 0)
    throw new EventError(
      "NO_RECIPIENTS",
      "None of the selected recipients are eligible staging staff.",
    );
  return {
    emails: rows.map((r) => r.email).filter(Boolean) as string[],
    whatsapp: rows
      .map((r) => r.whatsapp ?? r.phone)
      .filter(Boolean) as string[],
  };
}

export async function triggerEvent(id: number, staffUserIds?: number[]) {
  const [ev] = await db
    .select()
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  if (ev.status === "TRIGGERED")
    throw new EventError(
      "INVALID_STATE",
      "This event has already been triggered.",
    );
  if (!ev.notificationMasterId)
    throw new EventError("NO_MASTER", "Event has no master.");
  if (!ev.recipientsFileKey)
    throw new EventError(
      "NO_RECIPIENTS",
      "Upload recipients before triggering.",
    );

  const { matched } = await readRecipientPayload(ev.recipientsFileKey);
  if (matched.length === 0)
    throw new EventError("NO_RECIPIENTS", "No matched recipients to send to.");

  const stagingTargets = await resolveStagingTargets(staffUserIds);
  const { toSend, capped } = applyTestCap(matched);
  const { enqueued, failed } = await enqueueEventRecipients(
    ev,
    toSend,
    stagingTargets,
  );
  if (enqueued === 0)
    throw new EventError(
      "NO_RECIPIENTS",
      "None of the notifications could be queued — the notification service may be unreachable.",
    );

  await db
    .update(notificationEventModel)
    .set({ status: "TRIGGERED" })
    .where(eq(notificationEventModel.id, id));

  return { enqueued, failed, capped, totalRecipients: matched.length };
}

/** Rebuild {userId, values} for the FAILED notifications of a triggered event. */
async function failedEventRecipients(eventId: number, fields: string[]) {
  const failedNotifs = await db
    .select({ id: notificationModel.id, userId: notificationModel.userId })
    .from(notificationModel)
    .where(
      and(
        eq(notificationModel.notificationEventId, eventId),
        eq(notificationModel.status, "FAILED"),
      ),
    );
  if (failedNotifs.length === 0) return [];
  const contents = await db
    .select({
      notificationId: notificationContentModel.notificationId,
      field: notificationMasterFieldModel.name,
      content: notificationContentModel.content,
    })
    .from(notificationContentModel)
    .leftJoin(
      notificationMasterFieldModel,
      eq(
        notificationMasterFieldModel.id,
        notificationContentModel.whatsappFieldId,
      ),
    )
    .where(
      inArray(
        notificationContentModel.notificationId,
        failedNotifs.map((n) => n.id),
      ),
    );
  const valuesByNotif = new Map<number, Record<string, string>>();
  for (const c of contents) {
    if (!c.field) continue;
    const m = valuesByNotif.get(c.notificationId) ?? {};
    m[c.field] = String(c.content ?? "");
    valuesByNotif.set(c.notificationId, m);
  }
  return failedNotifs.map((n) => {
    const v = valuesByNotif.get(n.id) ?? {};
    // Ensure every master field key exists (empty when the row had none).
    for (const f of fields) if (!(f in v)) v[f] = "";
    return { userId: n.userId, values: v };
  });
}

/** Re-enqueue the FAILED recipients of a triggered event (verifier-OTP-gated). */
export async function resendEventFailed(id: number, staffUserIds?: number[]) {
  const [ev] = await db
    .select()
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  if (ev.status !== "TRIGGERED")
    throw new EventError("INVALID_STATE", "Only a sent event can be resent.");

  const fields = ev.notificationMasterId
    ? await eventMasterFields(ev.notificationMasterId)
    : [];
  const recipients = await failedEventRecipients(id, fields);
  if (recipients.length === 0)
    throw new EventError(
      "NO_RECIPIENTS",
      "There are no failed recipients to resend.",
    );

  const stagingTargets = await resolveStagingTargets(staffUserIds);
  const { toSend, capped } = applyTestCap(recipients);
  const { enqueued, failed } = await enqueueEventRecipients(
    ev,
    toSend,
    stagingTargets,
  );
  if (enqueued === 0)
    throw new EventError(
      "NO_RECIPIENTS",
      "None of the notifications could be queued — the notification service may be unreachable.",
    );
  return { enqueued, failed, capped, totalRecipients: recipients.length };
}

/** Excel of the FAILED recipients (uid, name, whatsapp, reason + field values). */
export async function buildFailedRecipientsWorkbook(id: number) {
  const [ev] = await db
    .select({
      masterId: notificationEventModel.notificationMasterId,
      name: notificationEventModel.name,
    })
    .from(notificationEventModel)
    .where(eq(notificationEventModel.id, id))
    .limit(1);
  if (!ev) throw new EventError("NOT_FOUND", "Event not found.");
  const fields = ev.masterId ? await eventMasterFields(ev.masterId) : [];

  const notifs = await db
    .select({
      id: notificationModel.id,
      failedReason: notificationModel.failedReason,
      uid: studentModel.uid,
      name: userModel.name,
      whatsapp: userModel.whatsappNumber,
      phone: userModel.phone,
    })
    .from(notificationModel)
    .leftJoin(userModel, eq(userModel.id, notificationModel.userId))
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .where(
      and(
        eq(notificationModel.notificationEventId, id),
        eq(notificationModel.status, "FAILED"),
      ),
    )
    .orderBy(notificationModel.id);

  const contents = notifs.length
    ? await db
        .select({
          notificationId: notificationContentModel.notificationId,
          field: notificationMasterFieldModel.name,
          content: notificationContentModel.content,
        })
        .from(notificationContentModel)
        .leftJoin(
          notificationMasterFieldModel,
          eq(
            notificationMasterFieldModel.id,
            notificationContentModel.whatsappFieldId,
          ),
        )
        .where(
          inArray(
            notificationContentModel.notificationId,
            notifs.map((n) => n.id),
          ),
        )
    : [];
  const valuesByNotif = new Map<number, Record<string, string>>();
  for (const c of contents) {
    if (!c.field) continue;
    const m = valuesByNotif.get(c.notificationId) ?? {};
    m[c.field] = String(c.content ?? "");
    valuesByNotif.set(c.notificationId, m);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Failed");
  ws.columns = [
    { header: "uid", key: "uid", width: 22 },
    { header: "name", key: "name", width: 26 },
    { header: "whatsapp", key: "whatsapp", width: 16 },
    { header: "failed_reason", key: "reason", width: 44 },
    ...fields.map((f) => ({ header: f, key: f, width: 22 })),
  ];
  styleTemplateHeader(ws, 4 + fields.length);
  for (const n of notifs) {
    const v = valuesByNotif.get(n.id) ?? {};
    ws.addRow({
      uid: n.uid ?? "",
      name: n.name ?? "",
      whatsapp: n.whatsapp ?? n.phone ?? "",
      reason: n.failedReason ?? "",
      ...Object.fromEntries(fields.map((f) => [f, v[f] ?? ""])),
    });
  }
  return wb;
}

/** Live delivery status from the notifications linked to this event. */
export async function getEventStatus(id: number) {
  const [row] = await db
    .select({
      total: count(),
      sent: sql<number>`count(*) filter (where ${notificationModel.status} = 'SENT')`.mapWith(
        Number,
      ),
      pending:
        sql<number>`count(*) filter (where ${notificationModel.status} = 'PENDING')`.mapWith(
          Number,
        ),
      failed:
        sql<number>`count(*) filter (where ${notificationModel.status} = 'FAILED')`.mapWith(
          Number,
        ),
    })
    .from(notificationModel)
    .where(eq(notificationModel.notificationEventId, id));
  return {
    total: Number(row?.total ?? 0),
    sent: Number(row?.sent ?? 0),
    pending: Number(row?.pending ?? 0),
    failed: Number(row?.failed ?? 0),
  };
}
