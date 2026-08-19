import { db } from "@/db/index.js";
import { serviceAlumniIntakeModel } from "@repo/db/schemas/models/service-requests/service-alumni-intake.model.js";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { uploadToS3, getSignedUrlForFile, FileTypeConfigs } from "@/services/s3.service.js";
import {
  s3Configured,
  isLocalKey,
  saveIdProofLocally,
  localKeyToUrl,
} from "../local-id-proof-storage.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateAlumniIntakeInput {
  fullName: string;
  yearOfPassing: string;
  courseStream: string;
  universityRegNo?: string;
  collegeRollNo?: string;
  mobileWhatsapp: string;
  email: string;
  idProofType: "OLD_ID_CARD" | "AADHAAR" | "PASSPORT" | "OTHER";
  /** Optional file uploaded by the caller; stored in S3 */
  idProofFile?: Express.Multer.File;
}

// ---------------------------------------------------------------------------
// createAlumniIntake
// ---------------------------------------------------------------------------

/**
 * Creates an alumni intake record.
 * If a file is provided it is validated, uploaded to S3, and only the S3 key
 * is persisted (never a public URL).
 */
export async function createAlumniIntake(
  input: CreateAlumniIntakeInput,
): Promise<typeof serviceAlumniIntakeModel.$inferSelect> {
  let idProofS3Key: string | null = null;

  if (input.idProofFile) {
    // Validate: only images + PDF accepted for ID proof
    const allowed = [
      ...FileTypeConfigs.IMAGES,
      ...FileTypeConfigs.PDF_ONLY,
    ];
    if (!allowed.includes(input.idProofFile.mimetype)) {
      throw new ApiError(
        400,
        `ID proof file type '${input.idProofFile.mimetype}' is not allowed. Accepted: JPEG, PNG, WebP, PDF.`,
      );
    }
    if (input.idProofFile.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "ID proof file must be ≤ 5 MB");
    }

    if (s3Configured()) {
      const result = await uploadToS3(input.idProofFile, {
        folder: "service-requests/id-proofs",
        maxFileSizeMB: 5,
        allowedMimeTypes: allowed,
        makePublic: false,
        metadata: {
          email: input.email,
          idProofType: input.idProofType,
        },
      });
      idProofS3Key = result.key;
    } else {
      // TESTING fallback: no S3 configured → store under public dir.
      const local = await saveIdProofLocally(input.idProofFile);
      idProofS3Key = local.key;
    }
  }

  const [intake] = await db
    .insert(serviceAlumniIntakeModel)
    .values({
      fullName: input.fullName,
      yearOfPassing: input.yearOfPassing,
      courseStream: input.courseStream,
      universityRegNo: input.universityRegNo ?? null,
      collegeRollNo: input.collegeRollNo ?? null,
      mobileWhatsapp: input.mobileWhatsapp,
      email: input.email,
      idProofType: input.idProofType,
      idProofS3Key,
      idProofVerified: false,
      contactVerified: false,
    })
    .returning();

  return intake;
}

// ---------------------------------------------------------------------------
// getAlumniIntake
// ---------------------------------------------------------------------------

export async function getAlumniIntake(
  id: number,
): Promise<typeof serviceAlumniIntakeModel.$inferSelect | null> {
  const [intake] = await db
    .select()
    .from(serviceAlumniIntakeModel)
    .where(eq(serviceAlumniIntakeModel.id, id));
  return intake ?? null;
}

// ---------------------------------------------------------------------------
// getIdProofSignedUrl  — serve ID proof to authorized clerks only
// ---------------------------------------------------------------------------

/**
 * Returns a time-limited pre-signed S3 URL for the ID proof file.
 * Never expose the raw S3 key or a public URL to the frontend.
 *
 * @param expiresIn  URL validity in seconds (default 15 minutes)
 */
export async function getIdProofSignedUrl(
  intakeId: number,
  expiresIn: number = 900,
): Promise<string> {
  const intake = await getAlumniIntake(intakeId);
  if (!intake) {
    throw new ApiError(404, `Alumni intake ${intakeId} not found`);
  }
  if (!intake.idProofS3Key) {
    throw new ApiError(404, "No ID proof file uploaded for this intake");
  }

  // TESTING fallback: locally-stored proof is served as a static public URL.
  if (isLocalKey(intake.idProofS3Key)) {
    return localKeyToUrl(intake.idProofS3Key);
  }

  return getSignedUrlForFile(intake.idProofS3Key, expiresIn);
}

// ---------------------------------------------------------------------------
// markIdProofVerified  — called by clerk after manual review
// ---------------------------------------------------------------------------

export async function markIdProofVerified(
  intakeId: number,
  verified: boolean = true,
): Promise<typeof serviceAlumniIntakeModel.$inferSelect> {
  const [updated] = await db
    .update(serviceAlumniIntakeModel)
    .set({ idProofVerified: verified, updatedAt: new Date() })
    .where(eq(serviceAlumniIntakeModel.id, intakeId))
    .returning();

  if (!updated) {
    throw new ApiError(404, `Alumni intake ${intakeId} not found`);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// markContactVerified  — called after successful OTP verification
// ---------------------------------------------------------------------------

export async function markContactVerified(
  intakeId: number,
): Promise<typeof serviceAlumniIntakeModel.$inferSelect> {
  const [updated] = await db
    .update(serviceAlumniIntakeModel)
    .set({ contactVerified: true, updatedAt: new Date() })
    .where(eq(serviceAlumniIntakeModel.id, intakeId))
    .returning();

  if (!updated) {
    throw new ApiError(404, `Alumni intake ${intakeId} not found`);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// uploadIdProof  — can be called separately after intake creation
// ---------------------------------------------------------------------------

export async function uploadIdProof(
  intakeId: number,
  file: Express.Multer.File,
): Promise<typeof serviceAlumniIntakeModel.$inferSelect> {
  const intake = await getAlumniIntake(intakeId);
  if (!intake) {
    throw new ApiError(404, `Alumni intake ${intakeId} not found`);
  }

  const allowed = [...FileTypeConfigs.IMAGES, ...FileTypeConfigs.PDF_ONLY];
  if (!allowed.includes(file.mimetype)) {
    throw new ApiError(
      400,
      `File type '${file.mimetype}' is not allowed. Accepted: JPEG, PNG, WebP, PDF.`,
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new ApiError(400, "ID proof file must be ≤ 5 MB");
  }

  let key: string;
  if (s3Configured()) {
    const result = await uploadToS3(file, {
      folder: "service-requests/id-proofs",
      maxFileSizeMB: 5,
      allowedMimeTypes: allowed,
      makePublic: false,
      metadata: {
        intakeId: String(intakeId),
        idProofType: intake.idProofType,
      },
    });
    key = result.key;
  } else {
    const local = await saveIdProofLocally(file);
    key = local.key;
  }

  const [updated] = await db
    .update(serviceAlumniIntakeModel)
    .set({
      idProofS3Key: key,
      idProofVerified: false, // Reset — re-verification required for new upload
      updatedAt: new Date(),
    })
    .where(eq(serviceAlumniIntakeModel.id, intakeId))
    .returning();

  return updated;
}
