import { db } from "@/db/index.js";
import { eq, inArray } from "drizzle-orm";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { streamModel } from "@repo/db/schemas/models/course-design/stream.model.js";
import { academicYearModel } from "@repo/db/schemas/models/academics/academic-year.model.js";
import { affiliationModel } from "@repo/db/schemas/models/course-design/affiliation.model.js";
import { regulationTypeModel } from "@repo/db/schemas/models/course-design/regulation-type.model.js";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model.js";
import { AcademicActivityDto, AcademicActivityScopeDto } from "@repo/db/dtos";
import {
  academicActivityModel,
  AcademicActivityT,
} from "@repo/db/schemas/models/academics/academic-activity.model.js";
import { academicActivityScopeModel } from "@repo/db/schemas/models/academics/academic-activity-scope.model.js";
import { academicActivityMasterModel } from "@repo/db/schemas/models/academics/academic-activity-master.model.js";

export type CreateAcademicActivityPayload = Omit<
  AcademicActivityT,
  "id" | "createdAt" | "updatedAt" | "lastUpdatedBy"
> & {
  scopes?: CreateScopePayload[];
};

export type UpdateAcademicActivityPayload = Partial<
  Omit<AcademicActivityT, "id" | "createdAt" | "updatedAt" | "lastUpdatedBy">
> & {
  scopes?: CreateScopePayload[];
};

export type CreateScopePayload = {
  streamId: number;
  classId: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isEnabled?: boolean;
};

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
  const masterIds = [
    ...new Set(activities.map((a) => a.academicActivityMasterId)),
  ];

  const [
    scopes,
    masters,
    academicYears,
    affiliations,
    regulationTypes,
    promotionStatuses,
  ] = await Promise.all([
    db
      .select({
        scope: academicActivityScopeModel,
        stream: streamModel,
        classEntity: classModel,
      })
      .from(academicActivityScopeModel)
      .innerJoin(
        streamModel,
        eq(streamModel.id, academicActivityScopeModel.streamId),
      )
      .innerJoin(
        classModel,
        eq(classModel.id, academicActivityScopeModel.classId),
      )
      .where(inArray(academicActivityScopeModel.academicActivityId, ids)),
    db
      .select()
      .from(academicActivityMasterModel)
      .where(inArray(academicActivityMasterModel.id, masterIds)),
    db.select().from(academicYearModel),
    db.select().from(affiliationModel),
    db.select().from(regulationTypeModel),
    db.select().from(promotionStatusModel),
  ]);

  const scopeMap = new Map<number, AcademicActivityScopeDto[]>();
  for (const row of scopes) {
    const activityId = row.scope.academicActivityId;
    const existing = scopeMap.get(activityId) ?? [];
    existing.push({
      id: row.scope.id,
      startDate: row.scope.startDate,
      endDate: row.scope.endDate,
      isEnabled: row.scope.isEnabled,
      createdAt: row.scope.createdAt,
      updatedAt: row.scope.updatedAt,
      stream: row.stream,
      class: row.classEntity,
    });
    scopeMap.set(activityId, existing);
  }

  const masterMap = new Map(masters.map((m) => [m.id, m]));
  const ayMap = new Map(academicYears.map((ay) => [ay.id, ay]));
  const affMap = new Map(affiliations.map((a) => [a.id, a]));
  const regMap = new Map(regulationTypes.map((r) => [r.id, r]));
  const psMap = new Map(promotionStatuses.map((p) => [p.id, p]));

  return activities.map((activity) => ({
    id: activity.id,
    audience: activity.audience,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    master: masterMap.get(activity.academicActivityMasterId)!,
    academicYear: ayMap.get(activity.academicYearId)!,
    affiliation: affMap.get(activity.affiliationId)!,
    regulationType: regMap.get(activity.regulationTypeId)!,
    appearType: psMap.get(activity.appearTypeId)!,
    scopes: scopeMap.get(activity.id) ?? [],
  }));
}

async function replaceScopes(
  academicActivityId: number,
  scopes: CreateScopePayload[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(academicActivityScopeModel)
      .where(
        eq(academicActivityScopeModel.academicActivityId, academicActivityId),
      );

    if (scopes.length > 0) {
      await tx.insert(academicActivityScopeModel).values(
        scopes.map((s) => ({
          academicActivityId,
          streamId: s.streamId,
          classId: s.classId,
          startDate: s.startDate ? new Date(s.startDate as string) : null,
          endDate: s.endDate ? new Date(s.endDate as string) : null,
          isEnabled: s.isEnabled ?? true,
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
  const [created] = await db
    .insert(academicActivityModel)
    .values({
      academicYearId: payload.academicYearId,
      academicActivityMasterId: payload.academicActivityMasterId,
      audience: payload.audience ?? "ALL",
      affiliationId: payload.affiliationId,
      regulationTypeId: payload.regulationTypeId,
      appearTypeId: payload.appearTypeId,
      lastUpdatedBy: userId ?? null,
    })
    .returning();

  if (payload.scopes?.length) {
    await replaceScopes(created.id, payload.scopes);
  }

  const enriched = await getAcademicActivityById(created.id);
  if (!enriched) throw new Error("Failed to fetch created academic activity");
  return enriched;
}

export async function updateAcademicActivity(
  id: number,
  payload: UpdateAcademicActivityPayload,
  userId?: number,
): Promise<AcademicActivityDto | null> {
  const [existing] = await db
    .select()
    .from(academicActivityModel)
    .where(eq(academicActivityModel.id, id));
  if (!existing) return null;

  const updateData: Partial<typeof academicActivityModel.$inferInsert> = {};
  if (payload.audience !== undefined) updateData.audience = payload.audience;
  if (payload.academicYearId !== undefined)
    updateData.academicYearId = payload.academicYearId;
  if (payload.academicActivityMasterId !== undefined)
    updateData.academicActivityMasterId = payload.academicActivityMasterId;
  if (payload.affiliationId !== undefined)
    updateData.affiliationId = payload.affiliationId;
  if (payload.regulationTypeId !== undefined)
    updateData.regulationTypeId = payload.regulationTypeId;
  if (payload.appearTypeId !== undefined)
    updateData.appearTypeId = payload.appearTypeId;
  updateData.lastUpdatedBy = userId ?? null;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(academicActivityModel)
      .set(updateData)
      .where(eq(academicActivityModel.id, id));
  }

  if (payload.scopes) {
    await replaceScopes(id, payload.scopes);
  }

  return getAcademicActivityById(id);
}

export async function deleteAcademicActivity(id: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx
      .delete(academicActivityScopeModel)
      .where(eq(academicActivityScopeModel.academicActivityId, id));
    const deleted = await tx
      .delete(academicActivityModel)
      .where(eq(academicActivityModel.id, id))
      .returning();
    return deleted.length > 0;
  });
}

export async function validateScopeReferences(
  scopes: CreateScopePayload[] = [],
): Promise<{ missingStreamIds: number[]; missingClassIds: number[] }> {
  const streamIds = normalizeIds(scopes.map((s) => s.streamId));
  const classIds = normalizeIds(scopes.map((s) => s.classId));

  const [streamRows, classRows] = await Promise.all([
    streamIds.length > 0
      ? db
          .select({ id: streamModel.id })
          .from(streamModel)
          .where(inArray(streamModel.id, streamIds))
      : [],
    classIds.length > 0
      ? db
          .select({ id: classModel.id })
          .from(classModel)
          .where(inArray(classModel.id, classIds))
      : [],
  ]);

  const foundStreamIds = new Set(streamRows.map((r) => r.id));
  const foundClassIds = new Set(classRows.map((r) => r.id));

  return {
    missingStreamIds: streamIds.filter((id) => !foundStreamIds.has(id)),
    missingClassIds: classIds.filter((id) => !foundClassIds.has(id)),
  };
}
