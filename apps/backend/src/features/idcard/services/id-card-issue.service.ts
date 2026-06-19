import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  deleteFromS3,
  getSignedUrlForFile,
  uploadToS3,
} from "@/services/s3.service.js";
import {
  idCardIssueModel,
  idCardTemplateModel,
  studentModel,
  userModel,
} from "@repo/db/schemas/index.js";

export type IssueListFilters = {
  page: number;
  limit: number;
  search?: string;
  studentId?: number;
  academicYearId?: number;
  issueStatus?: "ISSUED" | "RENEWED" | "REISSUED";
  fromDate?: string;
  toDate?: string;
};

export type CreateIssueInput = {
  studentId: number;
  templateId: number;
  issueStatus?: "ISSUED" | "RENEWED" | "REISSUED";
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

  const rows = await db
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
    .where(where)
    .orderBy(desc(idCardIssueModel.issueDate))
    .limit(limit)
    .offset(offset);

  const data = await Promise.all(
    rows.map(async (r) => ({
      ...r.issue,
      frontImageUrl: await presignKey(r.issue.frontImageKey),
      photoImageUrl: await presignKey(r.issue.photoImageKey),
      template: r.template,
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
});

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
  if (!values.validFrom && template.validFrom)
    values.validFrom = template.validFrom as unknown as string;
  if (!values.validTill && template.validTill)
    values.validTill = template.validTill as unknown as string;

  const [created] = await db
    .insert(idCardIssueModel)
    .values(values)
    .returning({ id: idCardIssueModel.id });
  const issueId = created.id;

  let frontImageKey: string | null = null;
  let photoImageKey: string | null = null;

  try {
    if (files.frontImage) {
      const ext = files.frontImage.originalname.split(".").pop() || "png";
      const uploaded = await uploadToS3(files.frontImage, {
        folder: `${IDCARD_ISSUES_FOLDER}/${issueId}`,
        customFileName: `front.${ext}`,
        contentType: files.frontImage.mimetype,
        maxFileSizeMB: 10,
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/webp",
        ],
      });
      frontImageKey = uploaded.key;
    }
    if (files.photoImage) {
      const ext = files.photoImage.originalname.split(".").pop() || "png";
      const uploaded = await uploadToS3(files.photoImage, {
        folder: `${IDCARD_ISSUES_FOLDER}/${issueId}`,
        customFileName: `photo.${ext}`,
        contentType: files.photoImage.mimetype,
        maxFileSizeMB: 10,
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/webp",
        ],
      });
      photoImageKey = uploaded.key;
    }
  } catch (err) {
    await db.delete(idCardIssueModel).where(eq(idCardIssueModel.id, issueId));
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

  if (values.rfidNumber && values.rfidNumber !== student.rfidNumber) {
    await db
      .update(studentModel)
      .set({ rfidNumber: values.rfidNumber, updatedAt: new Date() })
      .where(eq(studentModel.id, student.id));
  }

  return issueId;
}

export async function deleteIssue(id: number) {
  const [existing] = await db
    .select()
    .from(idCardIssueModel)
    .where(eq(idCardIssueModel.id, id))
    .limit(1);
  if (!existing) throw new ApiError(404, "Issue not found.");

  await db.delete(idCardIssueModel).where(eq(idCardIssueModel.id, id));
  if (existing.frontImageKey)
    await deleteFromS3(existing.frontImageKey).catch(() => undefined);
  if (existing.photoImageKey)
    await deleteFromS3(existing.photoImageKey).catch(() => undefined);
}
