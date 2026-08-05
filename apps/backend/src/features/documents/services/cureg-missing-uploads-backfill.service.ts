// State-based backfill that inserts PENDING document_ledger rows for CU
// registration uploads a student was REQUIRED to submit but hasn't. Real
// uploads produce their own UPLOADED rows via cureg-upload-ledger-backfill;
// this fills in the gaps so admins can see the omissions in the passbook.
//
// Scope: current + prior 1 academic year. The predicates read mutable
// student fields (belongs_to_ews, family membership, aadhaar) — evaluating
// today against a 5-year-old correction request would produce misleading
// PENDINGs. If a historic snapshot table is added later, this scope can
// widen.
//
// Idempotency: NOT EXISTS check on (promotionId, documentTypeId,
// isSelfSourced=true, documentBatchReceiptId IS NULL). Skips insertion if
// either this backfill has already written the PENDING row, OR a real
// upload row has already been projected as UPLOADED under the same tuple.

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions";
import { documentLedgerModel } from "@repo/db/schemas/models/documents";
import { studentModel } from "@repo/db/schemas/models/user/student.model";
import { personalDetailsModel } from "@repo/db/schemas/models/user/personalDetails.model";
import { nationalityModel } from "@repo/db/schemas/models/resources/nationality.model";
import { familyModel } from "@repo/db/schemas/models/user/family.model";
import { personModel } from "@repo/db/schemas/models/user/person.model";
import { resolvePromotionForAcademicYear } from "@/features/batches/services/promotion-resolver.service.js";
import {
  DOCUMENT_TYPE_CODES,
  getDocumentTypeIdByCode,
  type DocumentTypeCode,
} from "./document-ledger.service.js";

const log = createLogger("cureg-missing-uploads-backfill");

const AADHAAR_PLACEHOLDER = "XXXX XXXX XXXX";

/** Six required-doc codes we can evaluate on the backend. Migration
 *  Certificate is intentionally excluded — the student console emits it
 *  conditionally, but no `document_types` row is seeded for it. */
const CANDIDATE_CODES: DocumentTypeCode[] = [
  DOCUMENT_TYPE_CODES.CLASS_XII_MARKSHEET,
  DOCUMENT_TYPE_CODES.APAAR_ID_CARD,
  DOCUMENT_TYPE_CODES.AADHAAR_CARD,
  DOCUMENT_TYPE_CODES.EWS_CERTIFICATE,
  DOCUMENT_TYPE_CODES.FATHER_PHOTO_ID,
  DOCUMENT_TYPE_CODES.MOTHER_PHOTO_ID,
];

/** Slice of a student's state needed to evaluate the six predicates. */
type StudentSnapshot = {
  belongsToEws: boolean;
  nationalityName: string | null;
  aadhaarCardNumber: string | null;
  hasFatherWithName: boolean;
  hasMotherWithName: boolean;
};

async function loadStudentSnapshot(
  studentId: number,
): Promise<StudentSnapshot | null> {
  const [student] = await db
    .select({
      userId: studentModel.userId,
      belongsToEws: studentModel.belongsToEWS,
    })
    .from(studentModel)
    .where(eq(studentModel.id, studentId))
    .limit(1);
  if (!student?.userId) return null;

  const [personalDetails] = await db
    .select({
      aadhaarCardNumber: personalDetailsModel.aadhaarCardNumber,
      nationalityName: nationalityModel.name,
    })
    .from(personalDetailsModel)
    .leftJoin(
      nationalityModel,
      eq(nationalityModel.id, personalDetailsModel.nationalityId),
    )
    .where(eq(personalDetailsModel.userId, student.userId))
    .limit(1);

  // Family → person: check for a FATHER / MOTHER row with a truthy name and
  // a title that isn't "LATE" (matches student-console conditions).
  const familyPersons = (await db
    .select({
      type: personModel.type,
      title: personModel.title,
      name: personModel.name,
    })
    .from(familyModel)
    .innerJoin(personModel, eq(personModel.familyId, familyModel.id))
    .where(eq(familyModel.userId, student.userId))) as {
    type: string | null;
    title: string | null;
    name: string | null;
  }[];

  const isPresent = (kind: "FATHER" | "MOTHER") =>
    familyPersons.some(
      (p) =>
        p.type === kind &&
        !!p.name?.trim() &&
        (p.title ?? "").toUpperCase() !== "LATE",
    );

  return {
    belongsToEws: Boolean(student.belongsToEws),
    nationalityName: personalDetails?.nationalityName ?? null,
    aadhaarCardNumber: personalDetails?.aadhaarCardNumber ?? null,
    hasFatherWithName: isPresent("FATHER"),
    hasMotherWithName: isPresent("MOTHER"),
  };
}

/** Predicate map — one function per code. Verbatim port of the six rules in
 *  apps/student-console/src/app/(console)/dashboard/admission-registration/page.tsx:2251-2318. */
function requiredDocs(snapshot: StudentSnapshot): DocumentTypeCode[] {
  const required: DocumentTypeCode[] = [];
  // Always required.
  required.push(DOCUMENT_TYPE_CODES.CLASS_XII_MARKSHEET);
  required.push(DOCUMENT_TYPE_CODES.APAAR_ID_CARD);

  // Nationality "Indian" + aadhaar present + not the "XXXX XXXX XXXX" placeholder.
  const aadhaar = snapshot.aadhaarCardNumber?.trim() ?? "";
  const isIndian = (snapshot.nationalityName ?? "").toLowerCase() === "indian";
  if (isIndian && aadhaar && aadhaar !== AADHAAR_PLACEHOLDER) {
    required.push(DOCUMENT_TYPE_CODES.AADHAAR_CARD);
  }

  if (snapshot.belongsToEws) {
    required.push(DOCUMENT_TYPE_CODES.EWS_CERTIFICATE);
  }
  if (snapshot.hasFatherWithName) {
    required.push(DOCUMENT_TYPE_CODES.FATHER_PHOTO_ID);
  }
  if (snapshot.hasMotherWithName) {
    required.push(DOCUMENT_TYPE_CODES.MOTHER_PHOTO_ID);
  }
  return required;
}

/**
 * Per-student projector: evaluates the six required-doc predicates for
 * one student against one academic year and writes PENDING ledger rows
 * for whichever docs are required but not already covered.
 *
 * Callable from both the boot backfill (which scans in bulk) and the
 * old-DB migration path (which processes one student at a time as their
 * CU-reg correction request is created or found). Idempotent on the
 * same (promotion, documentType, isSelfSourced=true, batchId=null)
 * tuple that the backfill uses, so a repeated call after a real upload
 * lands is a zero-write no-op.
 *
 * `typeIdByCode` is an optional pre-warmed cache — callers doing bulk
 * work should build it once and pass it in; single-shot callers can
 * omit and pay one round-trip per doc code.
 */
export async function ensureCuRegPendingLedgerForStudent(input: {
  studentId: number;
  academicYearId: number;
  typeIdByCode?: Map<DocumentTypeCode, number>;
}): Promise<{ inserted: number; skipped: number; noPromotion: boolean }> {
  const summary = { inserted: 0, skipped: 0, noPromotion: false };

  const resolved = await resolvePromotionForAcademicYear(
    input.studentId,
    input.academicYearId,
  );
  if (!resolved) {
    summary.noPromotion = true;
    return summary;
  }
  const promotionId = resolved.promotionId;

  const snapshot = await loadStudentSnapshot(input.studentId);
  if (!snapshot) return summary;

  const cache = input.typeIdByCode ?? new Map<DocumentTypeCode, number>();
  const resolveTypeId = async (code: DocumentTypeCode) => {
    const hit = cache.get(code);
    if (hit != null) return hit;
    const id = await getDocumentTypeIdByCode(code);
    cache.set(code, id);
    return id;
  };

  const required = requiredDocs(snapshot);
  for (const code of required) {
    const documentTypeId = await resolveTypeId(code);
    // Only insert if there is no self-sourced ledger row for this
    // (promotion, docType) that isn't attached to a batch. This matches
    // BOTH the PENDING row we might have already written AND the
    // UPLOADED row a real upload produces (cureg-upload backfill leaves
    // documentBatchReceiptId null).
    const existing = (await db
      .select({ id: documentLedgerModel.id })
      .from(documentLedgerModel)
      .where(
        and(
          eq(documentLedgerModel.promotionId, promotionId),
          eq(documentLedgerModel.documentTypeId, documentTypeId),
          eq(documentLedgerModel.isSelfSourced, true),
          isNull(documentLedgerModel.documentBatchReceiptId),
        ),
      )
      .limit(1)) as { id: number }[];
    if (existing.length > 0) {
      summary.skipped++;
      continue;
    }

    await db.insert(documentLedgerModel).values({
      documentTypeId,
      documentBatchReceiptId: null,
      promotionId,
      isSelfSourced: true,
      status: "PENDING",
      link: null,
      collectedAt: null,
      providedBy: null,
    });
    summary.inserted++;
  }

  return summary;
}

/**
 * Boot backfill entry. Walks EVERY cu_registration_correction_request in
 * the DB regardless of academic year, evaluates each student's required
 * set, and inserts PENDING ledger rows for the missing ones. Widened
 * from "current + prior 1" to "all years" so no student is left with an
 * invisible omission just because their request predates the cutoff.
 *
 * Trade-off: predicates read MUTABLE fields (belongs_to_ews, family
 * membership) — a student who was EWS in 2023 but isn't now would get a
 * PENDING EWS row against their old 2023 request. Acceptable because
 * (a) real historic uploads project as UPLOADED via cureg-upload
 * backfill and take precedence, and (b) the pending row is easily
 * dismissed by an admin, whereas an invisible omission is worse.
 */
export async function runCuRegMissingUploadsBackfill(): Promise<
  Record<string, unknown>
> {
  // Warm the code → type-id cache before the tight loop so we don't do six
  // roundtrips per correction request.
  const typeIdByCode = new Map<DocumentTypeCode, number>();
  for (const code of CANDIDATE_CODES) {
    typeIdByCode.set(code, await getDocumentTypeIdByCode(code));
  }

  const requests = (await db
    .select({
      id: cuRegistrationCorrectionRequestModel.id,
      studentId: cuRegistrationCorrectionRequestModel.studentId,
      academicYearId: cuRegistrationCorrectionRequestModel.academicYearId,
    })
    .from(cuRegistrationCorrectionRequestModel)) as {
    id: number;
    studentId: number;
    academicYearId: number | null;
  }[];

  let scanned = 0;
  let inserted = 0;
  let skipped = 0;
  let skippedNoPromotion = 0;
  let failed = 0;

  for (const req of requests) {
    scanned++;
    try {
      if (!req.academicYearId) {
        skipped++;
        continue;
      }

      const result = await ensureCuRegPendingLedgerForStudent({
        studentId: req.studentId,
        academicYearId: req.academicYearId,
        typeIdByCode,
      });
      if (result.noPromotion) skippedNoPromotion++;
      inserted += result.inserted;
      skipped += result.skipped;
    } catch (err) {
      failed++;
      log.warn(
        `cu_registration_correction_requests#${req.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { scanned, inserted, skipped, skippedNoPromotion, failed };
}
