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
 * Boot backfill entry. Walks current + prior 1 academic year correction
 * requests, evaluates each student's required set, and inserts PENDING
 * ledger rows for the missing ones.
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

  // Scope to the two most recent academic years by descending row order —
  // matches the "current + prior" heuristic without depending on the
  // `isCurrentYear` flag being set correctly.
  const scopeYears = (
    await db.execute(sql`
    SELECT id FROM academic_years ORDER BY id DESC LIMIT 2
  `)
  ).rows as { id: number }[];
  const scopeYearIds = scopeYears.map((y) => y.id);

  if (scopeYearIds.length === 0) {
    return { scanned: 0, inserted: 0, skipped: 0, note: "no academic years" };
  }

  const requests = (await db
    .select({
      id: cuRegistrationCorrectionRequestModel.id,
      studentId: cuRegistrationCorrectionRequestModel.studentId,
      academicYearId: cuRegistrationCorrectionRequestModel.academicYearId,
    })
    .from(cuRegistrationCorrectionRequestModel)
    .where(
      sql`${cuRegistrationCorrectionRequestModel.academicYearId} IN (${sql.raw(
        scopeYearIds.join(","),
      )})`,
    )) as { id: number; studentId: number; academicYearId: number | null }[];

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

      const resolved = await resolvePromotionForAcademicYear(
        req.studentId,
        req.academicYearId,
      );
      if (!resolved) {
        skippedNoPromotion++;
        continue;
      }
      const promotionId = resolved.promotionId;

      const snapshot = await loadStudentSnapshot(req.studentId);
      if (!snapshot) {
        skipped++;
        continue;
      }

      const required = requiredDocs(snapshot);

      for (const code of required) {
        const documentTypeId = typeIdByCode.get(code)!;
        // Only insert if there is no self-sourced ledger row for this
        // (promotion, docType) that isn't attached to a batch. This
        // matches BOTH the PENDING row we might have already written AND
        // the UPLOADED row a real upload produces (cureg-upload backfill
        // leaves documentBatchReceiptId null).
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
          skipped++;
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
        inserted++;
      }
    } catch (err) {
      failed++;
      log.warn(
        `cu_registration_correction_requests#${req.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { scanned, inserted, skipped, skippedNoPromotion, failed };
}
