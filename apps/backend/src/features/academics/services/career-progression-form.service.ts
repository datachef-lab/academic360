import { db } from "@/db/index.js";
import {
  academicYearModel,
  careerProgressionFormCertificateModel,
  careerProgressionFormFieldModel,
  careerProgressionFormModel,
  certificateMasterModel,
  classModel,
  createCareerProgressionFormSchema,
  programCourseModel,
  promotionModel,
  sectionModel,
  sessionModel,
  shiftModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type {
  CareerProgressionFormCertificateDto,
  CareerProgressionFormDto,
} from "@repo/db/dtos/academics";
import { findCareerProgressionFormFieldsByCertificateId } from "./career-progression-form-field.service.js";

function computeCareerExportStudentStatus(student: {
  active: boolean | null;
  alumni: boolean | null;
  hasCancelledAdmission: boolean | null;
}): string {
  if (student.hasCancelledAdmission) return "Cancelled admission";
  if (student.alumni) return "Alumni";
  if (student.active === false) return "Inactive";
  return "Active";
}

async function loadPlacementForCareerExport(
  studentId: number,
  academicYearId: number,
  fallbackProgramCourseId: number | null,
): Promise<{
  programCourse: string;
  semester: string;
  shift: string;
  section: string;
}> {
  const promotionForYear = await db
    .select({ p: promotionModel })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
    .where(
      and(
        eq(promotionModel.studentId, studentId),
        eq(sessionModel.academicYearId, academicYearId),
      ),
    )
    .orderBy(desc(promotionModel.startDate), desc(promotionModel.createdAt))
    .limit(1);

  let promo = promotionForYear[0]?.p;
  if (!promo) {
    const [latest] = await db
      .select()
      .from(promotionModel)
      .where(eq(promotionModel.studentId, studentId))
      .orderBy(desc(promotionModel.startDate), desc(promotionModel.createdAt))
      .limit(1);
    promo = latest;
  }

  if (promo) {
    const [pc, cls, shf] = await Promise.all([
      db
        .select()
        .from(programCourseModel)
        .where(eq(programCourseModel.id, promo.programCourseId))
        .then((r) => r[0] ?? null),
      db
        .select()
        .from(classModel)
        .where(eq(classModel.id, promo.classId))
        .then((r) => r[0] ?? null),
      db
        .select()
        .from(shiftModel)
        .where(eq(shiftModel.id, promo.shiftId))
        .then((r) => r[0] ?? null),
    ]);

    let sec: typeof sectionModel.$inferSelect | null = null;
    if (promo.sectionId != null) {
      const [s] = await db
        .select()
        .from(sectionModel)
        .where(eq(sectionModel.id, promo.sectionId));
      sec = s ?? null;
    }

    return {
      programCourse: pc?.name ?? "",
      semester: (cls?.shortName ?? cls?.name ?? "").trim(),
      shift: (shf?.name ?? "").trim(),
      section: (sec?.name ?? "").trim(),
    };
  }

  if (fallbackProgramCourseId != null) {
    const [pc] = await db
      .select()
      .from(programCourseModel)
      .where(eq(programCourseModel.id, fallbackProgramCourseId));
    return {
      programCourse: pc?.name ?? "",
      semester: "",
      shift: "",
      section: "",
    };
  }

  return { programCourse: "", semester: "", shift: "", section: "" };
}

export type CareerProgressionSubmitPayload = {
  studentId: number;
  academicYearId: number;
  certificates: Array<{
    certificateMasterId: number;
    fields: Array<{
      certificateFieldMasterId: number;
      certificateFieldOptionMasterId?: number | null;
      value?: string | null;
    }>;
  }>;
};

export async function careerProgressionFormRowToDto(
  row: typeof careerProgressionFormModel.$inferSelect,
): Promise<CareerProgressionFormDto | null> {
  const [ay] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, row.academicYearId));

  if (!ay) return null;

  const certificateRows = await db
    .select()
    .from(careerProgressionFormCertificateModel)
    .where(
      eq(careerProgressionFormCertificateModel.careerProgressionFormId, row.id),
    )
    .orderBy(asc(careerProgressionFormCertificateModel.id));

  const certificates: CareerProgressionFormCertificateDto[] = [];
  for (const certRow of certificateRows) {
    const [certificateMaster] = await db
      .select()
      .from(certificateMasterModel)
      .where(eq(certificateMasterModel.id, certRow.certificateMasterId));

    if (!certificateMaster) continue;

    const fields = await findCareerProgressionFormFieldsByCertificateId(
      certRow.id,
    );

    certificates.push({
      id: certRow.id,
      careerProgressionFormId: certRow.careerProgressionFormId,
      createdAt: certRow.createdAt,
      updatedAt: certRow.updatedAt,
      certificateMaster,
      fields,
    });
  }

  return {
    id: row.id,
    studentId: row.studentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    academicYear: ay,
    certificates,
  };
}

export async function findAllCareerProgressionForms(
  studentId?: number,
  academicYearId?: number,
): Promise<CareerProgressionFormDto[]> {
  const conditions = [];
  if (studentId != null) {
    conditions.push(eq(careerProgressionFormModel.studentId, studentId));
  }
  if (academicYearId != null) {
    conditions.push(
      eq(careerProgressionFormModel.academicYearId, academicYearId),
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = whereClause
    ? await db
        .select()
        .from(careerProgressionFormModel)
        .where(whereClause)
        .orderBy(asc(careerProgressionFormModel.id))
    : await db
        .select()
        .from(careerProgressionFormModel)
        .orderBy(asc(careerProgressionFormModel.id));

  const dtos: Array<CareerProgressionFormDto | null> = await Promise.all(
    rows.map((r) => careerProgressionFormRowToDto(r)),
  );
  const list = dtos.filter((d): d is CareerProgressionFormDto => d !== null);

  if (list.length === 0) return list;

  const studentIds = [...new Set(list.map((d) => d.studentId))];
  const studentRows = await db
    .select({
      id: studentModel.id,
      uid: studentModel.uid,
      name: userModel.name,
      registrationNumber: studentModel.registrationNumber,
      rollNumber: studentModel.rollNumber,
      active: studentModel.active,
      alumni: studentModel.alumni,
      hasCancelledAdmission: studentModel.hasCancelledAdmission,
      programCourseId: studentModel.programCourseId,
    })
    .from(studentModel)
    .innerJoin(userModel, eq(studentModel.userId, userModel.id))
    .where(inArray(studentModel.id, studentIds));

  const byStudentId = new Map(studentRows.map((s) => [s.id, s]));

  const uniquePairs = Array.from(
    new Map(
      list.map((f) => {
        const ayId = f.academicYear.id;
        return [`${f.studentId}_${ayId ?? ""}`, f] as const;
      }),
    ).values(),
  ).filter((f) => f.academicYear.id != null);

  const placementCache = new Map<
    string,
    Awaited<ReturnType<typeof loadPlacementForCareerExport>>
  >();
  await Promise.all(
    uniquePairs.map(async (f) => {
      const ayId = f.academicYear.id as number;
      const base = byStudentId.get(f.studentId);
      const key = `${f.studentId}_${ayId}`;
      placementCache.set(
        key,
        await loadPlacementForCareerExport(
          f.studentId,
          ayId,
          base?.programCourseId ?? null,
        ),
      );
    }),
  );

  return list.map((d) => {
    const base = byStudentId.get(d.studentId);
    if (!base) return d;
    const ayId = d.academicYear.id;
    if (ayId == null) {
      return {
        ...d,
        student: {
          uid: base.uid,
          name: base.name,
          registrationNumber: base.registrationNumber,
          rollNumber: base.rollNumber,
          programCourse: "",
          semester: "",
          shift: "",
          section: "",
          studentStatus: computeCareerExportStudentStatus(base),
        },
      };
    }
    const place = placementCache.get(`${d.studentId}_${ayId}`)!;
    return {
      ...d,
      student: {
        uid: base.uid,
        name: base.name,
        registrationNumber: base.registrationNumber,
        rollNumber: base.rollNumber,
        programCourse: place.programCourse,
        semester: place.semester,
        shift: place.shift,
        section: place.section,
        studentStatus: computeCareerExportStudentStatus(base),
      },
    };
  });
}

export type CareerProgressionFormListItem = {
  id: number;
  studentId: number;
  studentUid: string;
  studentName: string;
  academicYear: typeof academicYearModel.$inferSelect;
  updatedAt: Date;
};

export async function findCareerProgressionFormsPaginated(params: {
  page: number;
  pageSize: number;
  studentId?: number;
  academicYearId?: number;
}): Promise<{
  items: CareerProgressionFormListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { page, pageSize, studentId, academicYearId } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (studentId != null) {
    conditions.push(eq(careerProgressionFormModel.studentId, studentId));
  }
  if (academicYearId != null) {
    conditions.push(
      eq(careerProgressionFormModel.academicYearId, academicYearId),
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(careerProgressionFormModel);
  const [countRow] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const total = countRow?.count ?? 0;

  const baseList = db
    .select({
      id: careerProgressionFormModel.id,
      studentId: careerProgressionFormModel.studentId,
      updatedAt: careerProgressionFormModel.updatedAt,
      academicYear: academicYearModel,
      studentUid: studentModel.uid,
      studentName: userModel.name,
    })
    .from(careerProgressionFormModel)
    .innerJoin(
      studentModel,
      eq(careerProgressionFormModel.studentId, studentModel.id),
    )
    .innerJoin(userModel, eq(studentModel.userId, userModel.id))
    .innerJoin(
      academicYearModel,
      eq(careerProgressionFormModel.academicYearId, academicYearModel.id),
    );

  const rows = await (whereClause ? baseList.where(whereClause) : baseList)
    .orderBy(desc(careerProgressionFormModel.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const items: CareerProgressionFormListItem[] = rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentUid: r.studentUid,
    studentName: r.studentName,
    academicYear: r.academicYear,
    updatedAt: r.updatedAt,
  }));

  return { items, total, page, pageSize };
}

export async function findCareerProgressionFormById(
  id: number,
): Promise<CareerProgressionFormDto | null> {
  const [row] = await db
    .select()
    .from(careerProgressionFormModel)
    .where(eq(careerProgressionFormModel.id, id));

  if (!row) return null;
  return careerProgressionFormRowToDto(row);
}

async function assertAcademicYearExists(id: number): Promise<boolean> {
  const [y] = await db
    .select({ id: academicYearModel.id })
    .from(academicYearModel)
    .where(eq(academicYearModel.id, id));
  return !!y;
}

async function assertStudentExists(id: number): Promise<boolean> {
  const [s] = await db
    .select({ id: studentModel.id })
    .from(studentModel)
    .where(eq(studentModel.id, id));
  return !!s;
}

export async function createCareerProgressionForm(
  data: typeof createCareerProgressionFormSchema._type,
): Promise<CareerProgressionFormDto | null> {
  if (!(await assertAcademicYearExists(data.academicYearId))) return null;
  if (!(await assertStudentExists(data.studentId))) return null;

  const [created] = await db
    .insert(careerProgressionFormModel)
    .values(data)
    .returning();

  if (!created) return null;
  return careerProgressionFormRowToDto(created);
}

export async function updateCareerProgressionForm(
  id: number,
  data: Partial<typeof createCareerProgressionFormSchema._type>,
): Promise<CareerProgressionFormDto | null> {
  const [existing] = await db
    .select()
    .from(careerProgressionFormModel)
    .where(eq(careerProgressionFormModel.id, id));

  if (!existing) return null;

  if (data.academicYearId != null) {
    if (!(await assertAcademicYearExists(data.academicYearId))) return null;
  }
  if (data.studentId != null) {
    if (!(await assertStudentExists(data.studentId))) return null;
  }

  const [updated] = await db
    .update(careerProgressionFormModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(careerProgressionFormModel.id, id))
    .returning();

  if (!updated) return null;
  return careerProgressionFormRowToDto(updated);
}

export async function deleteCareerProgressionForm(
  id: number,
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(careerProgressionFormModel)
    .where(eq(careerProgressionFormModel.id, id));

  if (!existing) return false;

  const certificates = await db
    .select({ id: careerProgressionFormCertificateModel.id })
    .from(careerProgressionFormCertificateModel)
    .where(
      eq(careerProgressionFormCertificateModel.careerProgressionFormId, id),
    );

  const certificateIdSet = new Set(certificates.map((c) => c.id));

  if (certificateIdSet.size > 0) {
    const allFields = await db.select().from(careerProgressionFormFieldModel);
    const fieldIdsToDelete = allFields
      .filter((f) => certificateIdSet.has(f.careerProgressionFormCertificateId))
      .map((f) => f.id);

    for (const fieldId of fieldIdsToDelete) {
      await db
        .delete(careerProgressionFormFieldModel)
        .where(eq(careerProgressionFormFieldModel.id, fieldId));
    }
  }

  await db
    .delete(careerProgressionFormCertificateModel)
    .where(
      eq(careerProgressionFormCertificateModel.careerProgressionFormId, id),
    );

  const deleted = await db
    .delete(careerProgressionFormModel)
    .where(eq(careerProgressionFormModel.id, id))
    .returning({ id: careerProgressionFormModel.id });

  return deleted.length > 0;
}

export async function submitCareerProgressionFormForCurrentYear(
  data: CareerProgressionSubmitPayload,
): Promise<CareerProgressionFormDto | null> {
  if (!(await assertAcademicYearExists(data.academicYearId))) return null;
  if (!(await assertStudentExists(data.studentId))) return null;

  const [existingForm] = await db
    .select()
    .from(careerProgressionFormModel)
    .where(
      and(
        eq(careerProgressionFormModel.studentId, data.studentId),
        eq(careerProgressionFormModel.academicYearId, data.academicYearId),
      ),
    )
    .limit(1);

  const form =
    existingForm ??
    (
      await db
        .insert(careerProgressionFormModel)
        .values({
          studentId: data.studentId,
          academicYearId: data.academicYearId,
        })
        .returning()
    )[0];

  if (!form) return null;

  const existingCertificates = await db
    .select({ id: careerProgressionFormCertificateModel.id })
    .from(careerProgressionFormCertificateModel)
    .where(
      eq(
        careerProgressionFormCertificateModel.careerProgressionFormId,
        form.id,
      ),
    );

  for (const cert of existingCertificates) {
    const fields = await db
      .select({ id: careerProgressionFormFieldModel.id })
      .from(careerProgressionFormFieldModel)
      .where(
        eq(
          careerProgressionFormFieldModel.careerProgressionFormCertificateId,
          cert.id,
        ),
      );

    for (const field of fields) {
      await db
        .delete(careerProgressionFormFieldModel)
        .where(eq(careerProgressionFormFieldModel.id, field.id));
    }
  }

  await db
    .delete(careerProgressionFormCertificateModel)
    .where(
      eq(
        careerProgressionFormCertificateModel.careerProgressionFormId,
        form.id,
      ),
    );

  for (const cert of data.certificates) {
    const [createdCert] = await db
      .insert(careerProgressionFormCertificateModel)
      .values({
        careerProgressionFormId: form.id,
        certificateMasterId: cert.certificateMasterId,
      })
      .returning();

    if (!createdCert) continue;

    for (const field of cert.fields) {
      await db.insert(careerProgressionFormFieldModel).values({
        careerProgressionFormCertificateId: createdCert.id,
        certificateFieldMasterId: field.certificateFieldMasterId,
        certificateFieldOptionMasterId:
          field.certificateFieldOptionMasterId ?? null,
        value: field.value ?? null,
      });
    }
  }

  return careerProgressionFormRowToDto(form);
}

/**
 * When a fee structure's academic year changes, copy career progression submissions from
 * `fromAcademicYearId` to `toAcademicYearId` for the given students (same certificate/field
 * data). Uses {@link submitCareerProgressionFormForCurrentYear} so the target year is upserted.
 * Skips students with no source form or no certificate rows with field data.
 */
export async function copyCareerProgressionFormsForAcademicYearMigration(
  fromAcademicYearId: number,
  toAcademicYearId: number,
  studentIds: number[],
): Promise<void> {
  if (fromAcademicYearId === toAcademicYearId || studentIds.length === 0) {
    return;
  }

  const unique = [...new Set(studentIds)];

  for (const studentId of unique) {
    const [sourceForm] = await db
      .select()
      .from(careerProgressionFormModel)
      .where(
        and(
          eq(careerProgressionFormModel.studentId, studentId),
          eq(careerProgressionFormModel.academicYearId, fromAcademicYearId),
        ),
      )
      .limit(1);

    if (!sourceForm) continue;

    const sourceCerts = await db
      .select()
      .from(careerProgressionFormCertificateModel)
      .where(
        eq(
          careerProgressionFormCertificateModel.careerProgressionFormId,
          sourceForm.id,
        ),
      );

    if (sourceCerts.length === 0) continue;

    const certificates: CareerProgressionSubmitPayload["certificates"] = [];

    for (const cert of sourceCerts) {
      const fieldRows = await db
        .select()
        .from(careerProgressionFormFieldModel)
        .where(
          eq(
            careerProgressionFormFieldModel.careerProgressionFormCertificateId,
            cert.id,
          ),
        );

      if (fieldRows.length === 0) continue;

      certificates.push({
        certificateMasterId: cert.certificateMasterId,
        fields: fieldRows.map((f) => ({
          certificateFieldMasterId: f.certificateFieldMasterId,
          certificateFieldOptionMasterId: f.certificateFieldOptionMasterId,
          value: f.value,
        })),
      });
    }

    if (certificates.length === 0) continue;

    await submitCareerProgressionFormForCurrentYear({
      studentId,
      academicYearId: toAcademicYearId,
      certificates,
    });
  }
}
