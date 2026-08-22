import { and, count, desc, eq, ilike, ne, or, sql, SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  deleteFromS3,
  getSignedUrlForFile,
  uploadToS3,
} from "@/services/s3.service.js";
import {
  classModel,
  idCardIssueModel,
  idCardTemplateModel,
  programCourseModel,
  promotionModel,
  sessionModel,
  studentModel,
  userModel,
} from "@repo/db/schemas/index.js";
import { asc } from "drizzle-orm";
import {
  deleteIdCardLedgerEntry,
  upsertIdCardLedgerEntry,
} from "@/features/documents/services/document-ledger.service.js";

export type IdCardIssueStatus = "ISSUED" | "RENEWED" | "REISSUED" | "DRAFT";
/** The real (finalized) statuses — DRAFT is a transient pre-save state. */
export type IdCardFinalStatus = "ISSUED" | "RENEWED" | "REISSUED";

export type IssueListFilters = {
  page: number;
  limit: number;
  search?: string;
  studentId?: number;
  academicYearId?: number;
  issueStatus?: IdCardIssueStatus;
  fromDate?: string;
  toDate?: string;
};

export type CreateIssueInput = {
  studentId: number;
  templateId: number;
  issueStatus?: IdCardIssueStatus;
  renewedFromIssueId?: number | null;
  rfidNumber?: string | null;
  validFrom?: string | null;
  validTill?: string | null;
  nameSnapshot?: string | null;
  courseSnapshot?: string | null;
  bloodGroupSnapshot?: string | null;
  mobileSnapshot?: string | null;
  sportsQuotaSnapshot?: string | null;
  uidSnapshot?: string | null;
  remarks?: string | null;
  issuedByUserId?: number | null;
  printedByUserId?: number | null;
};

export type FinalizeIssueInput = {
  rfidNumber: string;
  issueStatus: IdCardFinalStatus;
  remarks?: string | null;
  renewedFromIssueId?: number | null;
  // The person who saved (finalized) the card becomes the issuer.
  issuedByUserId?: number | null;
};

const IDCARD_ISSUES_FOLDER = "idcard/issues";

const presignKey = async (key: string | null | undefined) =>
  key ? await getSignedUrlForFile(key, 60 * 60).catch(() => null) : null;

const buildWhere = (
  f: Omit<IssueListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (f.studentId != null)
    parts.push(eq(idCardIssueModel.studentId, f.studentId));
  if (f.issueStatus)
    parts.push(eq(idCardIssueModel.issueStatus, f.issueStatus));
  if (f.search?.trim()) {
    const term = `%${f.search.trim()}%`;
    const p = or(
      ilike(idCardIssueModel.uidSnapshot, term),
      ilike(idCardIssueModel.nameSnapshot, term),
      ilike(idCardIssueModel.rfidNumber, term),
    );
    if (p) parts.push(p);
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function listIssuesPaginated(filters: IssueListFilters) {
  const { page, limit, ...rest } = filters;
  const where = buildWhere(rest);
  const offset = (page - 1) * limit;

  const [{ total }] = await db
    .select({ total: count() })
    .from(idCardIssueModel)
    .where(where);

  const issuerUser = alias(userModel, "issuer_user");
  const rows = await db
    .select({
      issue: idCardIssueModel,
      template: idCardTemplateModel,
      student: studentModel,
      user: userModel,
      issuerName: issuerUser.name,
      issuerImage: issuerUser.image,
    })
    .from(idCardIssueModel)
    .leftJoin(
      idCardTemplateModel,
      eq(idCardTemplateModel.id, idCardIssueModel.templateId),
    )
    .leftJoin(studentModel, eq(studentModel.id, idCardIssueModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(issuerUser, eq(issuerUser.id, idCardIssueModel.issuedByUserId))
    .where(where)
    .orderBy(desc(idCardIssueModel.createdAt))
    .limit(limit)
    .offset(offset);

  const data = await Promise.all(
    rows.map(async (r) => ({
      ...r.issue,
      frontImageUrl: await presignKey(r.issue.frontImageKey),
      photoImageUrl: await presignKey(r.issue.photoImageKey),
      template: r.template,
      issuedBy: { name: r.issuerName ?? null, image: r.issuerImage ?? null },
      student: r.student
        ? {
            id: r.student.id,
            uid: r.student.uid,
            name: r.user?.name ?? null,
            rfidNumber: r.student.rfidNumber,
          }
        : null,
    })),
  );

  return { rows: data, total, page, limit };
}

export async function getIssueById(id: number) {
  const [row] = await db
    .select({
      issue: idCardIssueModel,
      template: idCardTemplateModel,
      student: studentModel,
      user: userModel,
    })
    .from(idCardIssueModel)
    .leftJoin(
      idCardTemplateModel,
      eq(idCardTemplateModel.id, idCardIssueModel.templateId),
    )
    .leftJoin(studentModel, eq(studentModel.id, idCardIssueModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(eq(idCardIssueModel.id, id))
    .limit(1);

  if (!row) return null;

  return {
    ...row.issue,
    frontImageUrl: await presignKey(row.issue.frontImageKey),
    photoImageUrl: await presignKey(row.issue.photoImageKey),
    template: row.template,
    student: row.student
      ? {
          id: row.student.id,
          uid: row.student.uid,
          name: row.user?.name ?? null,
          rfidNumber: row.student.rfidNumber,
        }
      : null,
  };
}

export async function getMostRecentIssueForStudent(studentId: number) {
  const [row] = await db
    .select()
    .from(idCardIssueModel)
    .where(eq(idCardIssueModel.studentId, studentId))
    .orderBy(desc(idCardIssueModel.issueDate))
    .limit(1);
  return row ?? null;
}

const normalizeIssue = (input: CreateIssueInput) => ({
  studentId: input.studentId,
  templateId: input.templateId,
  issueStatus: input.issueStatus ?? ("ISSUED" as const),
  renewedFromIssueId: input.renewedFromIssueId ?? null,
  rfidNumber: input.rfidNumber?.trim() || null,
  validFrom: input.validFrom || null,
  validTill: input.validTill || null,
  nameSnapshot: input.nameSnapshot?.trim() || null,
  courseSnapshot: input.courseSnapshot?.trim() || null,
  bloodGroupSnapshot: input.bloodGroupSnapshot?.trim() || null,
  mobileSnapshot: input.mobileSnapshot?.trim() || null,
  sportsQuotaSnapshot: input.sportsQuotaSnapshot?.trim() || null,
  uidSnapshot: input.uidSnapshot?.trim() || null,
  remarks: input.remarks?.trim() || null,
  issuedByUserId: input.issuedByUserId ?? null,
  printedByUserId: input.printedByUserId ?? null,
});

/**
 * RFID must be globally unique across ALL students and cards — including the
 * same student's own prior RFID. An RFID identifies one physical card, so a
 * reissue always gets a fresh number; re-entering any number already in use
 * (on `students.rfid_number` or a non-draft issue) is a conflict. Returns the
 * conflicting student's uid/name for a clear message, or null when it's free.
 */
export async function findRfidConflict(
  rfid: string,
): Promise<{ uid: string | null; name: string | null } | null> {
  const value = rfid.trim();
  if (!value) return null;

  const [byStudent] = await db
    .select({ uid: studentModel.uid, name: userModel.name })
    .from(studentModel)
    .leftJoin(userModel, eq(studentModel.userId, userModel.id))
    .where(eq(studentModel.rfidNumber, value))
    .limit(1);
  if (byStudent)
    return { uid: byStudent.uid ?? null, name: byStudent.name ?? null };

  const [byIssue] = await db
    .select({ uid: studentModel.uid, name: userModel.name })
    .from(idCardIssueModel)
    .innerJoin(studentModel, eq(idCardIssueModel.studentId, studentModel.id))
    .leftJoin(userModel, eq(studentModel.userId, userModel.id))
    .where(
      and(
        eq(idCardIssueModel.rfidNumber, value),
        ne(idCardIssueModel.issueStatus, "DRAFT"),
      ),
    )
    .limit(1);
  if (byIssue) return { uid: byIssue.uid ?? null, name: byIssue.name ?? null };

  return null;
}

export async function createIssue(
  input: CreateIssueInput,
  files: { frontImage?: Express.Multer.File; photoImage?: Express.Multer.File },
) {
  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, input.studentId))
    .limit(1);
  if (!student) throw new ApiError(404, "Student not found.");

  const [template] = await db
    .select()
    .from(idCardTemplateModel)
    .where(eq(idCardTemplateModel.id, input.templateId))
    .limit(1);
  if (!template) throw new ApiError(404, "Template not found.");
  if (template.disabled) throw new ApiError(400, "Template is disabled.");

  const values = normalizeIssue(input);

  if (!values.uidSnapshot) values.uidSnapshot = student.uid;

  const isDraft = values.issueStatus === "DRAFT";

  // The issuer is recorded only when the card is SAVED (finalized), never at
  // print/draft time — a printed-but-unsaved draft has no issuer yet. (The
  // printer is tracked separately via printedByUserId.)
  if (isDraft) values.issuedByUserId = null;

  // A student has at most ONE open draft at a time: re-printing replaces the
  // previous unsaved draft (and cleans up its S3 objects) so drafts don't pile
  // up. Drafts never have a document_ledger row (that's created on save), so a
  // plain delete is enough here — nothing to unlink.
  if (isDraft) {
    const openDrafts = await db
      .select({
        id: idCardIssueModel.id,
        frontImageKey: idCardIssueModel.frontImageKey,
        photoImageKey: idCardIssueModel.photoImageKey,
      })
      .from(idCardIssueModel)
      .where(
        and(
          eq(idCardIssueModel.studentId, input.studentId),
          eq(idCardIssueModel.issueStatus, "DRAFT"),
        ),
      );
    await Promise.all(
      openDrafts.map(async (d) => {
        await db.delete(idCardIssueModel).where(eq(idCardIssueModel.id, d.id));
        await Promise.all([
          d.frontImageKey
            ? deleteFromS3(d.frontImageKey).catch(() => undefined)
            : undefined,
          d.photoImageKey
            ? deleteFromS3(d.photoImageKey).catch(() => undefined)
            : undefined,
        ]);
      }),
    );
  }

  let issueId: number;
  // The document_ledger row is created only for a REAL card, never for a DRAFT:
  //  - DRAFT (print): insert only; the ledger entry is written later, on save
  //    (finalizeIssue). printed_at uses DB now() so it stores IST wall-clock.
  //  - non-draft (direct issue): create the card and its passbook entry together
  //    in one transaction — a real card must never exist without a ledger row.
  // ledgerId is null for drafts, so the S3-failure rollback below no-ops the
  // ledger delete for them.
  let ledgerId: number | null = null;
  if (isDraft) {
    const [created] = await db
      .insert(idCardIssueModel)
      .values({ ...values, printedAt: sql`now()` })
      .returning({ id: idCardIssueModel.id });
    issueId = created.id;
  } else {
    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(idCardIssueModel)
        .values({ ...values, printedAt: null })
        .returning({
          id: idCardIssueModel.id,
          studentId: idCardIssueModel.studentId,
          issueDate: idCardIssueModel.issueDate,
          issuedByUserId: idCardIssueModel.issuedByUserId,
          frontImageUrl: idCardIssueModel.frontImageUrl,
          documentLedgerId: idCardIssueModel.documentLedgerId,
          createdAt: idCardIssueModel.createdAt,
          updatedAt: idCardIssueModel.updatedAt,
        });
      const ledger = await upsertIdCardLedgerEntry(created, tx);
      return { issueId: created.id, ledgerId: ledger };
    });
    issueId = result.issueId;
    ledgerId = result.ledgerId;
  }

  let frontImageKey: string | null = null;
  let photoImageKey: string | null = null;

  const ALLOWED_IMAGE_MIME = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];
  try {
    // Upload both images in parallel — they're independent objects and each can
    // be up to 10MB, so serial uploads doubled the print latency for no reason.
    const [frontUploaded, photoUploaded] = await Promise.all([
      files.frontImage
        ? uploadToS3(files.frontImage, {
            folder: `${IDCARD_ISSUES_FOLDER}/${issueId}`,
            customFileName: `front.${files.frontImage.originalname.split(".").pop() || "png"}`,
            contentType: files.frontImage.mimetype,
            maxFileSizeMB: 10,
            allowedMimeTypes: ALLOWED_IMAGE_MIME,
          })
        : Promise.resolve(null),
      files.photoImage
        ? uploadToS3(files.photoImage, {
            folder: `${IDCARD_ISSUES_FOLDER}/${issueId}`,
            customFileName: `photo.${files.photoImage.originalname.split(".").pop() || "png"}`,
            contentType: files.photoImage.mimetype,
            maxFileSizeMB: 10,
            allowedMimeTypes: ALLOWED_IMAGE_MIME,
          })
        : Promise.resolve(null),
    ]);
    frontImageKey = frontUploaded?.key ?? null;
    photoImageKey = photoUploaded?.key ?? null;
  } catch (err) {
    // Compensating rollback for the S3 failure — the ledger entry has to go with
    // the issue, otherwise it orphans (the FK lives on the issue side).
    await db.transaction(async (tx) => {
      await deleteIdCardLedgerEntry(issueId, ledgerId, tx);
      await tx.delete(idCardIssueModel).where(eq(idCardIssueModel.id, issueId));
    });
    throw err;
  }

  if (frontImageKey || photoImageKey) {
    await db
      .update(idCardIssueModel)
      .set({
        frontImageKey: frontImageKey ?? undefined,
        photoImageKey: photoImageKey ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(idCardIssueModel.id, issueId));
  }

  // Drafts carry no rfid yet (it's entered at finalize); only sync + broadcast
  // for real issues so DRAFT rows never touch student.rfid or the tracker counts.
  if (
    !isDraft &&
    values.rfidNumber &&
    values.rfidNumber !== student.rfidNumber
  ) {
    await db
      .update(studentModel)
      .set({ rfidNumber: values.rfidNumber, updatedAt: new Date() })
      .where(eq(studentModel.id, student.id));
  }

  if (!isDraft) void broadcastIdCardTrackerUpdate(student.id);

  return issueId;
}

/**
 * Finalize a DRAFT into a real issue: validates global RFID uniqueness, then
 * sets the real type, the rfid, saved_at and remarks, creates the card's
 * document_ledger entry (a saved card must have one), syncs students.rfid_number,
 * and broadcasts the tracker update.
 */
export async function finalizeIssue(
  issueId: number,
  input: FinalizeIssueInput,
): Promise<number> {
  const rfid = input.rfidNumber?.trim() || "";
  if (!rfid) throw new ApiError(400, "RFID is required to save the ID card.");

  const [issue] = await db
    .select()
    .from(idCardIssueModel)
    .where(eq(idCardIssueModel.id, issueId))
    .limit(1);
  if (!issue) throw new ApiError(404, "Draft ID card not found.");
  if (issue.issueStatus !== "DRAFT")
    throw new ApiError(409, "This ID card has already been saved.");

  const conflict = await findRfidConflict(rfid);
  if (conflict) {
    const who = conflict.uid
      ? `${conflict.name ?? "another student"} (${conflict.uid})`
      : (conflict.name ?? "another student");
    throw new ApiError(
      409,
      `RFID ${rfid} is already assigned to ${who}. Each RFID must be unique.`,
    );
  }

  const issuedByUserId = input.issuedByUserId ?? issue.issuedByUserId ?? null;

  // Save + passbook entry in one transaction: a saved card is a real issued card,
  // so it must be projected into the student's document_ledger. The draft carried
  // no ledger row (created only on save), so create it here. upsert is idempotent
  // on documentLedgerId and writes the FK back onto the issue itself.
  await db.transaction(async (tx) => {
    await tx
      .update(idCardIssueModel)
      .set({
        issueStatus: input.issueStatus,
        rfidNumber: rfid,
        remarks: input.remarks?.trim() || issue.remarks || null,
        renewedFromIssueId:
          input.renewedFromIssueId ?? issue.renewedFromIssueId ?? null,
        // Issuer is stamped here (on save), not at print/draft time.
        issuedByUserId,
        // DB-side now() → IST wall-clock (pool session tz), consistent with the
        // other stored timestamps and the IST-assuming display formatters.
        savedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(idCardIssueModel.id, issueId));

    await upsertIdCardLedgerEntry(
      {
        id: issueId,
        studentId: issue.studentId,
        issueDate: issue.issueDate,
        issuedByUserId,
        frontImageUrl: issue.frontImageUrl ?? null,
        documentLedgerId: issue.documentLedgerId ?? null,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      },
      tx,
    );
  });

  const [student] = await db
    .select({ id: studentModel.id, rfidNumber: studentModel.rfidNumber })
    .from(studentModel)
    .where(eq(studentModel.id, issue.studentId))
    .limit(1);
  if (student && rfid !== student.rfidNumber) {
    await db
      .update(studentModel)
      .set({ rfidNumber: rfid, updatedAt: new Date() })
      .where(eq(studentModel.id, student.id));
  }

  void broadcastIdCardTrackerUpdate(issue.studentId);

  return issueId;
}

/**
 * Push the realtime-tracker "ID card issued" counts to online viewers after an
 * issue is created/removed. Mirrors the subject-selection pattern: broadcast
 * the room for the student's academic year plus the unfiltered room. Never
 * fails the mutation.
 */
async function broadcastIdCardTrackerUpdate(studentId: number): Promise<void> {
  try {
    const { scheduleRealtimeTrackerBroadcast } =
      await import("@/features/realtime-tracker/realtime-tracker.socket.js");
    const { promotionModel, sessionModel } =
      await import("@repo/db/schemas/index.js");
    const [row] = await db
      .select({ academicYearId: sessionModel.academicYearId })
      .from(promotionModel)
      .innerJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .where(eq(promotionModel.studentId, studentId))
      .orderBy(desc(promotionModel.id))
      .limit(1);
    scheduleRealtimeTrackerBroadcast("affiliation", "idcard_issue_change", {});
    if (row?.academicYearId) {
      scheduleRealtimeTrackerBroadcast("affiliation", "idcard_issue_change", {
        academicYearIds: [row.academicYearId],
      });
    }
  } catch (e) {
    console.error("[idcard] tracker broadcast failed:", (e as Error)?.message);
  }
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDDMMYYYY = (d: Date) =>
  `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;

/**
 * Compute the "Program course" auto validity for a student's ID card:
 * Semester-I promotion `dateOfJoining` + the program course's `duration`
 * (in years). Returns the date formatted DD-MM-YYYY plus the inputs used,
 * or nulls if either piece is missing.
 */
export async function getStudentIdCardValidity(studentId: number) {
  const [student] = await db
    .select({ id: studentModel.id })
    .from(studentModel)
    .where(eq(studentModel.id, studentId))
    .limit(1);
  if (!student) throw new ApiError(404, "Student not found.");

  // Pick the Semester-I promotion (class name "SEMESTER I"); if not found,
  // fall back to the earliest promotion by dateOfJoining / startDate.
  const promotions = await db
    .select({
      dateOfJoining: promotionModel.dateOfJoining,
      startDate: promotionModel.startDate,
      className: classModel.name,
      duration: programCourseModel.duration,
      // Registration academic year = the academic year of the Sem-1
      // promotion's session (promotion -> session -> session.academicYear).
      registrationAcademicYearId: sessionModel.academicYearId,
    })
    .from(promotionModel)
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .where(eq(promotionModel.studentId, studentId))
    .orderBy(asc(promotionModel.dateOfJoining));

  if (promotions.length === 0) {
    return {
      validTill: null,
      dateOfJoining: null,
      durationYears: null,
      registrationAcademicYearId: null,
    };
  }

  const semOne =
    promotions.find(
      (p) => (p.className ?? "").trim().toUpperCase() === "SEMESTER I",
    ) ??
    promotions.find((p) => p.dateOfJoining != null) ??
    promotions[0];

  const joining = semOne.dateOfJoining ?? semOne.startDate ?? null;
  const durationYears = semOne.duration ?? null;
  const registrationAcademicYearId = semOne.registrationAcademicYearId ?? null;

  if (!joining || durationYears == null) {
    return {
      validTill: null,
      dateOfJoining: joining ? formatDDMMYYYY(new Date(joining)) : null,
      durationYears,
      registrationAcademicYearId,
    };
  }

  const join = new Date(joining);
  const till = new Date(join);
  till.setFullYear(till.getFullYear() + durationYears);

  return {
    validTill: formatDDMMYYYY(till),
    dateOfJoining: formatDDMMYYYY(join),
    durationYears,
    registrationAcademicYearId,
  };
}

export async function deleteIssue(id: number) {
  const [existing] = await db
    .select()
    .from(idCardIssueModel)
    .where(eq(idCardIssueModel.id, id))
    .limit(1);
  if (!existing) throw new ApiError(404, "Issue not found.");

  // The passbook entry goes with the card; the FK lives on the issue, so it must
  // be cleared and deleted in the same transaction or it orphans.
  await db.transaction(async (tx) => {
    await deleteIdCardLedgerEntry(id, existing.documentLedgerId, tx);
    await tx.delete(idCardIssueModel).where(eq(idCardIssueModel.id, id));
  });

  if (existing.frontImageKey)
    await deleteFromS3(existing.frontImageKey).catch(() => undefined);
  if (existing.photoImageKey)
    await deleteFromS3(existing.photoImageKey).catch(() => undefined);

  if (existing.studentId) void broadcastIdCardTrackerUpdate(existing.studentId);
}
