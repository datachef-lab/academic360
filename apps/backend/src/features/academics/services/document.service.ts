import { db } from "@/db";
import { documentTypeModel, DocumentTypeT } from "@repo/db/schemas";
import "dotenv/config";
import { eq, ilike } from "drizzle-orm";
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
 * `name` is UNIQUE and is what code binds to — `cu-registration-batch-submit`
 * looks the CU registration form up by the literal "CU Registration PDF", and
 * the supporting-upload names below are matched the same way. Renaming any of
 * these in the console silently breaks that link; a sturdier binding is a
 * separate discussion.
 *
 * Colours follow the palette the certificate masters use (light bg, darker
 * text of the same hue).
 */
const defaultDocuments: DocumentTypeT[] = [
  // ── System-bound types (seq 1-5) ──────────────────────────────────────────
  {
    name: "Exam Admit Card",
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
    name: "Fee Receipt",
    description: "Semester fee receipt / challan generated for the student",
    domain: "FEES",
    category: "SYSTEM_GENERATED",
    issuingAuthority: "COLLEGE",
    isRecurring: true,
    sequence: 2,
    bgColor: "#DCFCE7",
    textColor: "#15803D",
  },
  {
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
    name: "CU Exam Form",
    description: "CU examination form uploaded by the student",
    domain: "EXAM",
    category: "UPLOAD",
    isRecurring: true,
    sequence: 5,
    bgColor: "#FEF3C7",
    textColor: "#B45309",
  },

  // ── Student-supplied admission uploads (seq 10+) ──────────────────────────
  // Collected from the applicant at admission; re-used later as the supporting
  // uploads of the CU registration form.
  {
    name: "Class XII Marksheet",
    description: "Class XII Marksheet",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 10,
    bgColor: "#DBEAFE",
    textColor: "#1D4ED8",
  },
  {
    name: "Aadhaar Card",
    description: "Aadhaar Card",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 11,
    bgColor: "#FEF3C7",
    textColor: "#B45309",
  },
  {
    name: "APAAR ID Card",
    description: "APAAR ID Card",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 12,
    bgColor: "#CCFBF1",
    textColor: "#0F766E",
  },
  {
    name: "Father Photo ID",
    description: "Father Photo ID",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 13,
    bgColor: "#EDE9FE",
    textColor: "#6D28D9",
  },
  {
    name: "Mother Photo ID",
    description: "Mother Photo ID",
    domain: "ADMISSION",
    category: "UPLOAD",
    sequence: 14,
    bgColor: "#FCE7F3",
    textColor: "#BE185D",
  },
  {
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
