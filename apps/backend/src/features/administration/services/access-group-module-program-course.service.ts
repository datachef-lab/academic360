import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import {
  AccessGroupModuleProgramCourse,
  AccessGroupModuleProgramCourseT,
  accessGroupModuleProgramCourseModel,
  accessGroupModuleProgramCourseClassModel,
} from "@repo/db/schemas/models/administration";
import { classModel } from "@repo/db/schemas/models/academics";
import { AccessGroupModuleProgramCourseDto } from "@repo/db/dtos/administration";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";

async function ensureUniqueAccessGroupModuleAndProgramCourse(
  accessGroupModuleId: number,
  programCourseId: number,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(
            accessGroupModuleProgramCourseModel.accessGroupModuleId,
            accessGroupModuleId,
          ),
          eq(
            accessGroupModuleProgramCourseModel.programCourseId,
            programCourseId,
          ),
          ne(accessGroupModuleProgramCourseModel.id, excludeId),
        )
      : and(
          eq(
            accessGroupModuleProgramCourseModel.accessGroupModuleId,
            accessGroupModuleId,
          ),
          eq(
            accessGroupModuleProgramCourseModel.programCourseId,
            programCourseId,
          ),
        );

  const [existing] = await db
    .select()
    .from(accessGroupModuleProgramCourseModel)
    .where(whereClause);

  return Boolean(existing);
}

async function modelToDto(
  model: typeof accessGroupModuleProgramCourseModel.$inferSelect | null,
): Promise<AccessGroupModuleProgramCourseDto | null> {
  if (!model) return null;

  const programCourseDto = await programCourseService.findById(
    model.programCourseId,
  );
  if (!programCourseDto) return null;

  const pcClassRows = await db
    .select()
    .from(accessGroupModuleProgramCourseClassModel)
    .where(
      eq(
        accessGroupModuleProgramCourseClassModel.accessGroupModuleProgramCourseId,
        model.id,
      ),
    );
  const pcClasses = [];
  for (const pcc of pcClassRows) {
    const [c] = await db
      .select()
      .from(classModel)
      .where(eq(classModel.id, pcc.classId))
      .limit(1);
    if (c) {
      const { classId: _c, ...rest } = pcc;
      pcClasses.push({ ...rest, class: c });
    }
  }

  const { programCourseId: _programCourseId, ...rest } = model;
  return {
    ...rest,
    programCourse: programCourseDto,
    classes: pcClasses,
  };
}

export async function createAccessGroupModuleProgramCourse(
  data: AccessGroupModuleProgramCourse,
): Promise<AccessGroupModuleProgramCourseDto> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AccessGroupModuleProgramCourseT;

  if (rest.accessGroupModuleId == null) {
    throw new Error("Access group module is required.");
  }
  if (rest.programCourseId == null) {
    throw new Error("Program course is required.");
  }

  if (
    await ensureUniqueAccessGroupModuleAndProgramCourse(
      rest.accessGroupModuleId,
      rest.programCourseId,
    )
  ) {
    throw new Error(
      "Access group module program course already exists for this access group module and program course.",
    );
  }

  const [created] = await db
    .insert(accessGroupModuleProgramCourseModel)
    .values(rest)
    .returning();

  const dto = await modelToDto(created ?? null);
  if (!dto)
    throw new Error(
      "Failed to map created access group module program course.",
    );
  return dto;
}

export async function getAllAccessGroupModuleProgramCourses(): Promise<
  AccessGroupModuleProgramCourseDto[]
> {
  const rows = await db.select().from(accessGroupModuleProgramCourseModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is AccessGroupModuleProgramCourseDto =>
    Boolean(dto),
  );
}

export async function findAccessGroupModuleProgramCourseById(
  id: number,
): Promise<AccessGroupModuleProgramCourseDto | null> {
  const [row] = await db
    .select()
    .from(accessGroupModuleProgramCourseModel)
    .where(eq(accessGroupModuleProgramCourseModel.id, id))
    .limit(1);

  return await modelToDto(row ?? null);
}

export async function updateAccessGroupModuleProgramCourse(
  id: number,
  data:
    | Partial<AccessGroupModuleProgramCourseT>
    | Partial<AccessGroupModuleProgramCourse>,
): Promise<AccessGroupModuleProgramCourseDto | null> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AccessGroupModuleProgramCourseT>;

  const [existing] = await db
    .select()
    .from(accessGroupModuleProgramCourseModel)
    .where(eq(accessGroupModuleProgramCourseModel.id, id))
    .limit(1);

  if (!existing) return null;

  const payloadKeys = Object.keys(rest);
  if (payloadKeys.length === 0) {
    return await modelToDto(existing);
  }

  const finalAccessGroupModuleId =
    (rest as Partial<AccessGroupModuleProgramCourseT>).accessGroupModuleId ??
    existing.accessGroupModuleId;
  const finalProgramCourseId =
    (rest as Partial<AccessGroupModuleProgramCourseT>).programCourseId ??
    existing.programCourseId;

  if (
    await ensureUniqueAccessGroupModuleAndProgramCourse(
      finalAccessGroupModuleId,
      finalProgramCourseId,
      id,
    )
  ) {
    throw new Error(
      "Access group module program course already exists for this access group module and program course.",
    );
  }

  const [updated] = await db
    .update(accessGroupModuleProgramCourseModel)
    .set(rest)
    .where(eq(accessGroupModuleProgramCourseModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteAccessGroupModuleProgramCourseSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(accessGroupModuleProgramCourseModel)
    .where(eq(accessGroupModuleProgramCourseModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(accessGroupModuleProgramCourseModel)
    .where(eq(accessGroupModuleProgramCourseModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group module program course deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group module program course.",
    records: [],
  };
}
