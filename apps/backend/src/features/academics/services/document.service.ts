import { db } from "@/db";
import { documentTypeModel, DocumentTypeT } from "@repo/db/schemas";
import "dotenv/config";
import { and, eq, ilike, sql } from "drizzle-orm";
import {
  getBootMigrationMarker,
  setBootMigrationMarker,
} from "@/db/boot-migration-markers.js";
import { promises as fs } from "fs";
import path from "path";
import {
  extractS3KeyFromUrl,
  fileExistsInS3,
  getBufferFromS3,
} from "@/services/s3.service.js";

interface ScanExistingMarksheetFilesByRollNumbrProps {
  framework: "CCF" | "CBSE";
  stream: string;
  rollNumber: string;
  semester: number;
}

/**
 * The document types every install needs.
 *
 * `code` is the key code binds to — it is server-assigned, never shown in the
 * console and never editable, so staff can rename `name` freely without
 * breaking a lookup. `name` is still UNIQUE, but only as a display label.
 *
 * Colours follow the palette the certificate masters use (light bg, darker
 * text of the same hue).
 */
const defaultDocuments: DocumentTypeT[] = [
  // ── System-bound types (seq 1-5) ──────────────────────────────────────────
  {
    code: "EXAM_ADMIT_CARD",
    // Renamed from "Exam Admit Card". The CODE is deliberately unchanged: it is
    // what `DOCUMENT_TYPE_CODES` and every ledger writer bind to, and it exists
    // precisely so a display name can be changed without touching a lookup.
    name: "University Admit Card",
    description: "University semester examination admit card",
    domain: "EXAM",
    category: "EXAM_LINKED",
    issuingAuthority: "UNIVERSITY",
    // Issued only once the student's exam form is on record.
    eligibilityRule: "FORM_FILLUP_RECORDED",
    isRecurring: true,
    sequence: 1,
    bgColor: "#DBEAFE",
    textColor: "#1D4ED8",
  },
  {
    code: "CU_REGISTRATION_PDF",
    name: "CU Registration PDF",
    description: "Generated CU registration (adm-reg) form",
    domain: "PRE_CU_REGISTRATION",
    category: "SYSTEM_GENERATED",
    issuingAuthority: "COLLEGE",
    sequence: 3,
    bgColor: "#EDE9FE",
    textColor: "#6D28D9",
  },
  {
    code: "ID_CARD",
    name: "ID Card",
    description: "Student identity card issued by the college",
    domain: "ENROLMENT",
    category: "ADMINISTRATIVE",
    issuingAuthority: "COLLEGE",
    sequence: 4,
    bgColor: "#CCFBF1",
    textColor: "#0F766E",
  },
  {
    code: "CU_EXAM_FORM",
    name: "CU Exam Form",
    description: "CU examination form uploaded by the student",
    domain: "EXAM",
    category: "UPLOAD",
    isRecurring: true,
    sequence: 5,
    bgColor: "#FEF3C7",
    textColor: "#B45309",
  },

  // ── University-issued documents the college distributes (seq 6-8) ─────────
  // Physical documents that arrive from CU and are handed to the student, so
  // they run through the batch-receipt flow rather than being generated here.
  {
    code: "UNIVERSITY_MARKSHEET",
    name: "University Marksheet",
    description: "University semester marksheet issued by the university",
    domain: "EXAM",
    category: "EXAM_LINKED",
    issuingAuthority: "UNIVERSITY",
    // One per semester, unlike the degree and the registration certificate.
    isRecurring: true,
    sequence: 6,
    bgColor: "#E0E7FF",
    textColor: "#4338CA",
  },
  {
    code: "UNIVERSITY_DEGREE",
    name: "University Degree",
    description: "Degree certificate issued by the university on completion",
    domain: "EXAM",
    category: "ADMINISTRATIVE",
    issuingAuthority: "UNIVERSITY",
    sequence: 7,
    bgColor: "#FEE2E2",
    textColor: "#B91C1C",
  },
  {
    code: "UNIVERSITY_REGISTRATION_CERTIFICATE",
    name: "University Registration Certificate",
    description: "Registration certificate issued by the university",
    domain: "POST_CU_REGISTRATION",
    category: "ADMINISTRATIVE",
    issuingAuthority: "UNIVERSITY",
    sequence: 8,
    bgColor: "#FFEDD5",
    textColor: "#C2410C",
  },

  // ── Student-supplied admission uploads (seq 10+) ──────────────────────────
  // Collected from the applicant at admission; re-used later as the supporting
  // uploads of the CU registration form.
  {
    code: "CLASS_XII_MARKSHEET",
    name: "Class XII Marksheet",
    description: "Class XII Marksheet",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 10,
    bgColor: "#DBEAFE",
    textColor: "#1D4ED8",
  },
  {
    code: "AADHAAR_CARD",
    name: "Aadhaar Card",
    description: "Aadhaar Card",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 11,
    bgColor: "#FEF3C7",
    textColor: "#B45309",
  },
  {
    code: "APAAR_ID_CARD",
    name: "APAAR ID Card",
    description: "APAAR ID Card",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 12,
    bgColor: "#CCFBF1",
    textColor: "#0F766E",
  },
  {
    code: "FATHER_PHOTO_ID",
    name: "Father Photo ID",
    description: "Father Photo ID",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 13,
    bgColor: "#EDE9FE",
    textColor: "#6D28D9",
  },
  {
    code: "MOTHER_PHOTO_ID",
    name: "Mother Photo ID",
    description: "Mother Photo ID",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 14,
    bgColor: "#FCE7F3",
    textColor: "#BE185D",
  },
  {
    code: "EWS_CERTIFICATE",
    name: "EWS Certificate",
    description: "EWS Certificate",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 15,
    bgColor: "#DCFCE7",
    textColor: "#15803D",
  },
];

function marksheetS3Key(
  framework: string,
  year: number,
  stream: string,
  semester: number,
  rollNumber: string,
): string {
  return `marksheets/${framework}/${year}/${stream}/${semester}/${rollNumber}.pdf`;
}

function marksheetLocalPath(
  framework: string,
  year: number,
  stream: string,
  semester: number,
  rollNumber: string,
): string | null {
  const documentsPath = process.env.DOCUMENTS_PATH;
  if (!documentsPath) return null;
  return path.join(
    documentsPath,
    "marksheets",
    framework,
    String(year),
    stream,
    String(semester),
    `${rollNumber}.pdf`,
  );
}

const DOCUMENT_TYPES_SEED_MARKER = "document-types-seed-v1";

/**
 * Seeds the document types — EXACTLY ONCE per database.
 *
 * The marker is the whole point. Six of these rows predate the documents
 * module and are already referenced by
 * `cu_registration_document_uploads.document_id_fk`, and an admin may later
 * rename, recolour, deactivate or delete any type. Re-running on every boot
 * would resurrect deleted rows and stomp those edits, so once the marker
 * exists this returns immediately and never touches the table again.
 *
 * Pass `{ force: true }` to deliberately re-run it.
 */
export async function loadDefaultDocuments(opts?: {
  force?: boolean;
}): Promise<{
  skipped?: true;
  inserted?: number;
  classified?: number;
}> {
  if (!opts?.force) {
    const marker = await getBootMigrationMarker(DOCUMENT_TYPES_SEED_MARKER);
    if (marker) return { skipped: true };
  }

  let inserted = 0;
  let classified = 0;

  for (const document of defaultDocuments) {
    const [existing] = await db
      .select()
      .from(documentTypeModel)
      .where(ilike(documentTypeModel.name, document.name))
      .limit(1);

    if (!existing) {
      await db.insert(documentTypeModel).values(document);
      inserted++;
      continue;
    }

    // One-time classification backfill. The six pre-existing rows were created
    // before `domain` / `category` / `sequence` / the colours existed and still
    // carry the column defaults. Only fill what is still unset — never
    // overwrite a value an admin has chosen, never touch `name` (code binds to
    // it) and never touch `isActive` (deactivating is a deliberate act).
    const patch: Partial<typeof documentTypeModel.$inferInsert> = {};
    if (existing.sequence == null && document.sequence != null) {
      patch.sequence = document.sequence;
    }
    if (existing.bgColor == null && document.bgColor) {
      patch.bgColor = document.bgColor;
    }
    if (existing.textColor == null && document.textColor) {
      patch.textColor = document.textColor;
    }
    if (existing.domain === "OTHER" && document.domain) {
      patch.domain = document.domain;
    }
    if (
      existing.category === "ADMINISTRATIVE" &&
      document.category &&
      document.category !== "ADMINISTRATIVE"
    ) {
      patch.category = document.category;
    }

    if (Object.keys(patch).length > 0) {
      await db
        .update(documentTypeModel)
        .set(patch)
        .where(eq(documentTypeModel.id, existing.id));
      classified++;
    }
  }

  const result = { inserted, classified };
  await setBootMigrationMarker(DOCUMENT_TYPES_SEED_MARKER, result);
  return result;
}

const DOCUMENT_TYPES_SEED_V2_MARKER = "document-types-seed-v2";

/** Codes added after the v1 seed had already run on every environment. */
const V2_DOCUMENT_CODES = [
  "UNIVERSITY_MARKSHEET",
  "UNIVERSITY_DEGREE",
  "UNIVERSITY_REGISTRATION_CERTIFICATE",
] as const;

/**
 * Seeded by v1, now unwanted: fees are receipted through
 * `fee_student_receipt_numbers`, not the document passbook, so this type was
 * never written to and should not be offered.
 */
const V2_REMOVED_CODE = "FEE_RECEIPT";

/** The rename this step applies, and the ONLY name it will overwrite. */
const ADMIT_CARD_RENAME = {
  code: "EXAM_ADMIT_CARD",
  from: "Exam Admit Card",
  to: "University Admit Card",
} as const;

/**
 * Second document-types step: the three university-issued types, plus the
 * admit-card rename.
 *
 * v1 (`loadDefaultDocuments`) is marker-guarded and has already run everywhere,
 * so it will never insert these — it returns on the marker before reading the
 * list. Hence a second marker rather than bumping the first: re-running v1
 * would also re-apply its classification backfill to rows an admin has since
 * edited.
 *
 * Rules this step holds to, same as v1:
 *
 * - **Matches on `code`, not `name`.** v1 matched on name, which is exactly the
 *   thing an admin is free to change. A row whose name was edited is still
 *   found here.
 * - **Never resurrects a deleted row.** Once the marker is written this returns
 *   immediately; a type an admin deletes afterwards stays deleted.
 * - **Never overwrites an admin's rename.** The admit-card name is changed only
 *   while it still reads exactly "Exam Admit Card". If staff have already
 *   renamed it to something of their own, it is left alone.
 * - **Never fails the boot on a name clash.** `name` is UNIQUE; if a row with
 *   the target name already exists under a different code, the insert is
 *   skipped and reported instead of throwing.
 *
 * Pass `{ force: true }` to deliberately re-run it.
 */
export async function loadDocumentTypesV2(opts?: { force?: boolean }): Promise<{
  skipped?: true;
  inserted: number;
  renamed: number;
  removed: number;
  conflicts: string[];
}> {
  if (!opts?.force) {
    const marker = await getBootMigrationMarker(DOCUMENT_TYPES_SEED_V2_MARKER);
    if (marker) {
      return {
        skipped: true,
        inserted: 0,
        renamed: 0,
        removed: 0,
        conflicts: [],
      };
    }
  }

  let inserted = 0;
  let renamed = 0;
  const conflicts: string[] = [];

  for (const code of V2_DOCUMENT_CODES) {
    const document = defaultDocuments.find((d) => d.code === code);
    if (!document) continue;

    const [byCode] = await db
      .select({ id: documentTypeModel.id })
      .from(documentTypeModel)
      .where(eq(documentTypeModel.code, code))
      .limit(1);
    if (byCode) continue;

    const [byName] = await db
      .select({ id: documentTypeModel.id, code: documentTypeModel.code })
      .from(documentTypeModel)
      .where(ilike(documentTypeModel.name, document.name))
      .limit(1);
    if (byName) {
      conflicts.push(
        `"${document.name}" already exists under code ${byName.code} (id ${byName.id}) — ${code} not inserted`,
      );
      continue;
    }

    await db.insert(documentTypeModel).values(document);
    inserted++;
  }

  // Rename only the untouched original.
  const renamedRows = await db
    .update(documentTypeModel)
    .set({ name: ADMIT_CARD_RENAME.to })
    .where(
      and(
        eq(documentTypeModel.code, ADMIT_CARD_RENAME.code),
        eq(documentTypeModel.name, ADMIT_CARD_RENAME.from),
      ),
    )
    .returning({ id: documentTypeModel.id });
  renamed = renamedRows.length;

  // Remove the fee-receipt type v1 seeded — but only when nothing points at it.
  // A document type is referenced from three places; deleting a referenced row
  // would raise an FK error and take the whole boot down, so the count decides.
  let removed = 0;
  const [feeReceipt] = await db
    .select({ id: documentTypeModel.id })
    .from(documentTypeModel)
    .where(eq(documentTypeModel.code, V2_REMOVED_CODE))
    .limit(1);

  if (feeReceipt) {
    const [{ refs }] = (
      await db.execute(sql`
        SELECT (
          (SELECT count(*) FROM document_ledger WHERE document_type_id_fk = ${feeReceipt.id})
        + (SELECT count(*) FROM document_batch_receipts WHERE document_type_id_fk = ${feeReceipt.id})
        + (SELECT count(*) FROM cu_registration_document_uploads WHERE document_id_fk = ${feeReceipt.id})
        )::int AS refs`)
    ).rows as unknown as { refs: number }[];

    if (refs === 0) {
      await db
        .delete(documentTypeModel)
        .where(eq(documentTypeModel.id, feeReceipt.id));
      removed = 1;
    } else {
      conflicts.push(
        `${V2_REMOVED_CODE} (id ${feeReceipt.id}) still has ${refs} referencing row(s) — left in place`,
      );
    }
  }

  const result = { inserted, renamed, removed, conflicts };
  await setBootMigrationMarker(DOCUMENT_TYPES_SEED_V2_MARKER, result);
  return result;
}

export async function scanExistingMarksheetFilesByRollNumber({
  framework,
  stream,
  rollNumber,
  semester,
}: ScanExistingMarksheetFilesByRollNumbrProps): Promise<
  { year: number; filePath: string }[]
> {
  const fileItems: { year: number; filePath: string }[] = [];

  for (let year = 2017; year <= new Date().getFullYear(); year++) {
    const s3Key = marksheetS3Key(framework, year, stream, semester, rollNumber);
    const existsInS3 = await fileExistsInS3(s3Key);
    if (existsInS3) {
      fileItems.push({ year, filePath: s3Key });
      continue;
    }

    const localPath = marksheetLocalPath(
      framework,
      year,
      stream,
      semester,
      rollNumber,
    );
    if (!localPath) continue;

    try {
      await fs.access(localPath);
      fileItems.push({ year, filePath: localPath });
    } catch {
      // File doesn't exist locally either.
    }
  }

  return fileItems;
}

export async function getFile(filePath: string): Promise<Buffer | null> {
  try {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      const key = extractS3KeyFromUrl(filePath);
      if (!key) return null;
      return await getBufferFromS3(key);
    }

    if (filePath.startsWith("marksheets/")) {
      return await getBufferFromS3(filePath);
    }

    const absolutePath = path.resolve(filePath);
    return await fs.readFile(absolutePath);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return null;
  }
}
