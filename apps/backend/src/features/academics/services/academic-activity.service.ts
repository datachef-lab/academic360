import { db } from "@/db/index.js";
import { eq, ilike, inArray } from "drizzle-orm";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { AcademicActivityDto } from "@repo/db/dtos";
import {
  academicActivityModel,
  AcademicActivityT,
} from "@repo/db/schemas/models/academics/academic-activity.model.js";
import { academicActivityClassScopeModel } from "@repo/db/schemas/models/academics/academic-activity-class-scope.model.js";
import { academicActivityProgramCourseScopeModel } from "@repo/db/schemas/models/academics/academic-activity-program-course-scope.model.js";

type UpsertAcademicActivityPayload = Partial<
  Omit<
    AcademicActivityT,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "lastUpdatedBy"
    | "classes"
    | "programCourses"
  >
> & {
  id?: number;
  name?: string;
  classIds?: number[];
  programCourseIds?: number[];
};

type CreateAcademicActivityPayload = Omit<UpsertAcademicActivityPayload, "id">;

function normalizeIds(ids?: number[]): number[] {
  if (!ids?.length) return [];
  return [
    ...new Set(
      ids.filter((id) => Number.isFinite(id) && id > 0).map((id) => Number(id)),
    ),
  ];
}

async function enrichAcademicActivities(
  activityIds?: number[],
): Promise<AcademicActivityDto[]> {
  const whereClause =
    activityIds && activityIds.length > 0
      ? inArray(academicActivityModel.id, activityIds)
      : undefined;

  const activities = await db
    .select()
    .from(academicActivityModel)
    .where(whereClause)
    .orderBy(academicActivityModel.id);

  if (activities.length === 0) return [];

  const ids = activities.map((a) => a.id);

  const classScopes = await db
    .select({
      scopeId: academicActivityClassScopeModel.id,
      academicActivityId: academicActivityClassScopeModel.academicActivityId,
      createdAt: academicActivityClassScopeModel.createdAt,
      updatedAt: academicActivityClassScopeModel.updatedAt,
      classEntity: classModel,
    })
    .from(academicActivityClassScopeModel)
    .innerJoin(
      classModel,
      eq(classModel.id, academicActivityClassScopeModel.classId),
    )
    .where(inArray(academicActivityClassScopeModel.academicActivityId, ids));

  const programCourseScopes = await db
    .select({
      scopeId: academicActivityProgramCourseScopeModel.id,
      academicActivityId:
        academicActivityProgramCourseScopeModel.academicActivityId,
      createdAt: academicActivityProgramCourseScopeModel.createdAt,
      updatedAt: academicActivityProgramCourseScopeModel.updatedAt,
      programCourseEntity: programCourseModel,
    })
    .from(academicActivityProgramCourseScopeModel)
    .innerJoin(
      programCourseModel,
      eq(
        programCourseModel.id,
        academicActivityProgramCourseScopeModel.programCourseId,
      ),
    )
    .where(
      inArray(academicActivityProgramCourseScopeModel.academicActivityId, ids),
    );

  const classScopeMap = new Map<number, AcademicActivityDto["classes"]>();
  for (const scope of classScopes) {
    const existing = classScopeMap.get(scope.academicActivityId) ?? [];
    existing.push({
      id: scope.scopeId,
      academicActivityId: scope.academicActivityId,
      createdAt: scope.createdAt,
      updatedAt: scope.updatedAt,
      class: scope.classEntity,
    });
    classScopeMap.set(scope.academicActivityId, existing);
  }

  const programScopeMap = new Map<
    number,
    AcademicActivityDto["programCourses"]
  >();
  for (const scope of programCourseScopes) {
    const existing = programScopeMap.get(scope.academicActivityId) ?? [];
    existing.push({
      id: scope.scopeId,
      academicActivityId: scope.academicActivityId,
      createdAt: scope.createdAt,
      updatedAt: scope.updatedAt,
      programCourse: scope.programCourseEntity,
    });
    programScopeMap.set(scope.academicActivityId, existing);
  }

  return activities.map((activity) => ({
    ...activity,
    classes: classScopeMap.get(activity.id) ?? [],
    programCourses: programScopeMap.get(activity.id) ?? [],
  }));
}

async function replaceScopes(
  academicActivityId: number,
  classIds: number[],
  programCourseIds: number[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(academicActivityClassScopeModel)
      .where(
        eq(
          academicActivityClassScopeModel.academicActivityId,
          academicActivityId,
        ),
      );

    if (classIds.length > 0) {
      await tx.insert(academicActivityClassScopeModel).values(
        classIds.map((classId) => ({
          academicActivityId,
          classId,
        })),
      );
    }

    await tx
      .delete(academicActivityProgramCourseScopeModel)
      .where(
        eq(
          academicActivityProgramCourseScopeModel.academicActivityId,
          academicActivityId,
        ),
      );

    if (programCourseIds.length > 0) {
      await tx.insert(academicActivityProgramCourseScopeModel).values(
        programCourseIds.map((programCourseId) => ({
          academicActivityId,
          programCourseId,
        })),
      );
    }
  });
}

export async function getAllAcademicActivities(): Promise<
  AcademicActivityDto[]
> {
  return enrichAcademicActivities();
}

export async function getAcademicActivityById(
  id: number,
): Promise<AcademicActivityDto | null> {
  const rows = await enrichAcademicActivities([id]);
  return rows[0] ?? null;
}

export async function createAcademicActivity(
  payload: CreateAcademicActivityPayload,
  userId?: number,
): Promise<AcademicActivityDto> {
  if (!payload.name?.trim()) {
    throw new Error("Activity name is required");
  }

  const classIds = normalizeIds(payload.classIds);
  const programCourseIds = normalizeIds(payload.programCourseIds);

  const [created] = await db
    .insert(academicActivityModel)
    .values({
      name: payload.name.trim(),
      description: payload.description ?? null,
      audience: payload.audience ?? "ALL",
      startDate: payload.startDate ?? new Date(),
      endDate: payload.endDate ?? null,
      remarks: payload.remarks ?? null,
      isEnabled: payload.isEnabled ?? false,
      lastUpdatedBy: userId ?? null,
    })
    .returning();

  await replaceScopes(created.id, classIds, programCourseIds);

  const enriched = await getAcademicActivityById(created.id);
  if (!enriched) throw new Error("Failed to fetch created academic activity");
  return enriched;
}

export async function updateAcademicActivity(
  id: number,
  payload: UpsertAcademicActivityPayload,
  userId?: number,
): Promise<AcademicActivityDto | null> {
  const [existing] = await db
    .select()
    .from(academicActivityModel)
    .where(eq(academicActivityModel.id, id));
  if (!existing) return null;

  const classIds = payload.classIds
    ? normalizeIds(payload.classIds)
    : undefined;
  const programCourseIds = payload.programCourseIds
    ? normalizeIds(payload.programCourseIds)
    : undefined;

  const updateData: Partial<typeof academicActivityModel.$inferInsert> = {};
  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.description !== undefined)
    updateData.description = payload.description ?? null;
  if (payload.audience !== undefined) updateData.audience = payload.audience;
  if (payload.startDate !== undefined) updateData.startDate = payload.startDate;
  if (payload.endDate !== undefined)
    updateData.endDate = payload.endDate ?? null;
  if (payload.remarks !== undefined)
    updateData.remarks = payload.remarks ?? null;
  if (payload.isEnabled !== undefined) updateData.isEnabled = payload.isEnabled;
  updateData.lastUpdatedBy = userId ?? null;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(academicActivityModel)
      .set(updateData)
      .where(eq(academicActivityModel.id, id));
  }

  if (classIds || programCourseIds) {
    const current = await getAcademicActivityById(id);
    const resolvedClassIds =
      classIds ??
      current?.classes
        .map((c) => c.class.id)
        .filter((id): id is number => typeof id === "number") ??
      [];
    const resolvedProgramIds =
      programCourseIds ??
      current?.programCourses
        .map((p) => p.programCourse.id)
        .filter((id): id is number => typeof id === "number") ??
      [];
    await replaceScopes(id, resolvedClassIds, resolvedProgramIds);
  }

  return getAcademicActivityById(id);
}

export async function deleteAcademicActivity(id: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx
      .delete(academicActivityClassScopeModel)
      .where(eq(academicActivityClassScopeModel.academicActivityId, id));
    await tx
      .delete(academicActivityProgramCourseScopeModel)
      .where(
        eq(academicActivityProgramCourseScopeModel.academicActivityId, id),
      );
    const deleted = await tx
      .delete(academicActivityModel)
      .where(eq(academicActivityModel.id, id))
      .returning();
    return deleted.length > 0;
  });
}

export async function upsertAcademicActivity(
  payload: UpsertAcademicActivityPayload,
  userId?: number,
): Promise<AcademicActivityDto> {
  if (payload.id) {
    const updated = await updateAcademicActivity(payload.id, payload, userId);
    if (!updated) {
      throw new Error(`Academic activity with id ${payload.id} not found`);
    }
    return updated;
  }

  if (!payload.name?.trim()) {
    throw new Error("Either id or name is required for upsert");
  }

  const [existingByName] = await db
    .select()
    .from(academicActivityModel)
    .where(ilike(academicActivityModel.name, payload.name.trim()))
    .limit(1);

  if (existingByName) {
    const updated = await updateAcademicActivity(
      existingByName.id,
      payload,
      userId,
    );
    if (!updated) {
      throw new Error("Failed to update existing academic activity");
    }
    return updated;
  }

  return createAcademicActivity(payload, userId);
}

export async function upsertAcademicActivities(
  payloads: UpsertAcademicActivityPayload[],
  userId?: number,
): Promise<AcademicActivityDto[]> {
  const result: AcademicActivityDto[] = [];
  for (const payload of payloads) {
    result.push(await upsertAcademicActivity(payload, userId));
  }
  return result;
}

export async function validateScopeReferences(
  classIds: number[] = [],
  programCourseIds: number[] = [],
): Promise<{ missingClassIds: number[]; missingProgramCourseIds: number[] }> {
  const normalizedClassIds = normalizeIds(classIds);
  const normalizedProgramIds = normalizeIds(programCourseIds);

  const classRows =
    normalizedClassIds.length > 0
      ? await db
          .select({ id: classModel.id })
          .from(classModel)
          .where(inArray(classModel.id, normalizedClassIds))
      : [];

  const programRows =
    normalizedProgramIds.length > 0
      ? await db
          .select({ id: programCourseModel.id })
          .from(programCourseModel)
          .where(inArray(programCourseModel.id, normalizedProgramIds))
      : [];

  const foundClassIds = new Set(classRows.map((r) => r.id));
  const foundProgramIds = new Set(programRows.map((r) => r.id));

  return {
    missingClassIds: normalizedClassIds.filter((id) => !foundClassIds.has(id)),
    missingProgramCourseIds: normalizedProgramIds.filter(
      (id) => !foundProgramIds.has(id),
    ),
  };
}
