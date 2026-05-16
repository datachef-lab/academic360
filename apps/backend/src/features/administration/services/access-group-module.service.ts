import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import {
  AccessGroupModule,
  AccessGroupModuleT,
  accessGroupModuleModel,
  accessGroupModuleProgramCourseModel,
  accessGroupModuleProgramCourseClassModel,
  appModuleModel,
} from "@repo/db/schemas/models/administration";
import { classModel } from "@repo/db/schemas/models/academics";
import {
  AccessGroupModuleDto,
  AccessGroupModuleProgramCourseDto,
} from "@repo/db/dtos/administration";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";

async function ensureUniqueAccessGroupAndAppModule(
  accessGroupId: number,
  appModuleId: number,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(accessGroupModuleModel.accessGroupId, accessGroupId),
          eq(accessGroupModuleModel.appModuleId, appModuleId),
          ne(accessGroupModuleModel.id, excludeId),
        )
      : and(
          eq(accessGroupModuleModel.accessGroupId, accessGroupId),
          eq(accessGroupModuleModel.appModuleId, appModuleId),
        );

  const [existing] = await db
    .select()
    .from(accessGroupModuleModel)
    .where(whereClause);

  return Boolean(existing);
}

async function modelToDto(
  model: typeof accessGroupModuleModel.$inferSelect | null,
): Promise<AccessGroupModuleDto | null> {
  if (!model) return null;

  const [appModule] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.id, model.appModuleId))
    .limit(1);

  if (!appModule) return null;

  const programCourseRows = await db
    .select()
    .from(accessGroupModuleProgramCourseModel)
    .where(
      eq(accessGroupModuleProgramCourseModel.accessGroupModuleId, model.id),
    );

  const programCourseAndClasses: AccessGroupModuleProgramCourseDto[] = [];
  for (const row of programCourseRows) {
    const programCourseDto = await programCourseService.findById(
      row.programCourseId,
    );
    if (programCourseDto) {
      const pcClassRows = await db
        .select()
        .from(accessGroupModuleProgramCourseClassModel)
        .where(
          eq(
            accessGroupModuleProgramCourseClassModel.accessGroupModuleProgramCourseId,
            row.id,
          ),
        );
      const pcClasses = [];
      for (const pcc of pcClassRows) {
        const [classRow] = await db
          .select()
          .from(classModel)
          .where(eq(classModel.id, pcc.classId))
          .limit(1);
        if (classRow) {
          const { classId: _classId, ...cRest } = pcc;
          pcClasses.push({ ...cRest, class: classRow });
        }
      }
      const { programCourseId: _pcId, ...rest } = row;
      programCourseAndClasses.push({
        ...rest,
        programCourse: programCourseDto,
        classes: pcClasses,
      });
    }
  }

  const { appModuleId: _appModuleId, ...rest } = model;
  return {
    ...rest,
    appModule,
    programCourseAndClasses,
  };
}

export async function createAccessGroupModule(data: AccessGroupModule) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AccessGroupModuleT;

  if (rest.accessGroupId == null) {
    throw new Error("Access group is required.");
  }
  if (rest.appModuleId == null) {
    throw new Error("App module is required.");
  }

  if (
    await ensureUniqueAccessGroupAndAppModule(
      rest.accessGroupId,
      rest.appModuleId,
    )
  ) {
    throw new Error(
      "Access group module already exists for this access group and app module.",
    );
  }

  const [created] = await db
    .insert(accessGroupModuleModel)
    .values(rest)
    .returning();

  const dto = await modelToDto(created ?? null);
  if (!dto) throw new Error("Failed to map created access group module.");
  return dto;
}

export async function getAllAccessGroupModules(): Promise<
  AccessGroupModuleDto[]
> {
  const rows = await db.select().from(accessGroupModuleModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is AccessGroupModuleDto => Boolean(dto));
}

export async function findAccessGroupModuleById(
  id: number,
): Promise<AccessGroupModuleDto | null> {
  const [row] = await db
    .select()
    .from(accessGroupModuleModel)
    .where(eq(accessGroupModuleModel.id, id))
    .limit(1);

  return await modelToDto(row ?? null);
}

export async function updateAccessGroupModule(
  id: number,
  data: Partial<AccessGroupModuleT> | Partial<AccessGroupModule>,
): Promise<AccessGroupModuleDto | null> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AccessGroupModuleT>;

  const [existing] = await db
    .select()
    .from(accessGroupModuleModel)
    .where(eq(accessGroupModuleModel.id, id))
    .limit(1);

  if (!existing) return null;

  const payloadKeys = Object.keys(rest);
  if (payloadKeys.length === 0) {
    return await modelToDto(existing);
  }

  const finalAccessGroupId =
    (rest as Partial<AccessGroupModuleT>).accessGroupId ??
    existing.accessGroupId;
  const finalAppModuleId =
    (rest as Partial<AccessGroupModuleT>).appModuleId ?? existing.appModuleId;

  if (
    await ensureUniqueAccessGroupAndAppModule(
      finalAccessGroupId,
      finalAppModuleId,
      id,
    )
  ) {
    throw new Error(
      "Access group module already exists for this access group and app module.",
    );
  }

  const [updated] = await db
    .update(accessGroupModuleModel)
    .set(rest)
    .where(eq(accessGroupModuleModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteAccessGroupModuleSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(accessGroupModuleModel)
    .where(eq(accessGroupModuleModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(accessGroupModuleModel)
    .where(eq(accessGroupModuleModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group module deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group module.",
    records: [],
  };
}
