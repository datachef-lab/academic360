import { db } from "@/db/index.js";
import {
  subjectGroupingMainModel,
  subjectGroupingProgramCourseModel,
  subjectGroupingSubjectModel,
  academicYearModel,
  subjectTypeModel,
  programCourseModel,
  subjectModel,
} from "@repo/db/schemas/models";
import type { SubjectGroupingMainDto } from "@repo/db/dtos/course-design";
import type { SubjectGroupingMainT } from "@repo/db/schemas/models/course-design/subject-grouping-main.model";
import { and, eq, notInArray } from "drizzle-orm";

// DTO-shaped input used by frontend
export type CreateSubjectGroupingMainDtoInput = {
  academicYear: { id: number };
  subjectType: { id: number };
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  subjectGroupingProgramCourses?: { programCourse: { id: number } }[];
  subjectGroupingSubjects?: { subject: { id: number } }[];
};

export type UpdateSubjectGroupingMainDtoInput =
  Partial<CreateSubjectGroupingMainDtoInput>;

async function mapMainToDto(
  main: SubjectGroupingMainT,
): Promise<SubjectGroupingMainDto | null> {
  const [ay] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, main.academicYearId));
  const [st] = await db
    .select()
    .from(subjectTypeModel)
    .where(eq(subjectTypeModel.id, main.subjectTypeId));

  if (!ay || !st || !main.id) {
    return null;
  }

  const programCourses = await db
    .select({
      id: subjectGroupingProgramCourseModel.id,
      subjectGroupingMainId:
        subjectGroupingProgramCourseModel.subjectGroupingMainId,
      programCourseId: subjectGroupingProgramCourseModel.programCourseId,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        streamId: programCourseModel.streamId,
        courseId: programCourseModel.courseId,
        courseTypeId: programCourseModel.courseTypeId,
        courseLevelId: programCourseModel.courseLevelId,
        duration: programCourseModel.duration,
        totalSemesters: programCourseModel.totalSemesters,
        affiliationId: programCourseModel.affiliationId,
        regulationTypeId: programCourseModel.regulationTypeId,
        isActive: programCourseModel.isActive,
        createdAt: programCourseModel.createdAt,
        updatedAt: programCourseModel.updatedAt,
      },
    })
    .from(subjectGroupingProgramCourseModel)
    .leftJoin(
      programCourseModel,
      eq(
        subjectGroupingProgramCourseModel.programCourseId,
        programCourseModel.id,
      ),
    )
    .where(
      eq(subjectGroupingProgramCourseModel.subjectGroupingMainId, main.id!),
    );

  const subjects = await db
    .select({
      id: subjectGroupingSubjectModel.id,
      subjectGroupingMainId: subjectGroupingSubjectModel.subjectGroupingMainId,
      subjectId: subjectGroupingSubjectModel.subjectId,
      subject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
        createdAt: subjectModel.createdAt,
        updatedAt: subjectModel.updatedAt,
      },
    })
    .from(subjectGroupingSubjectModel)
    .leftJoin(
      subjectModel,
      eq(subjectGroupingSubjectModel.subjectId, subjectModel.id),
    )
    .where(eq(subjectGroupingSubjectModel.subjectGroupingMainId, main.id!));

  return {
    ...main,
    academicYear: ay,
    subjectType: st,
    subjectGroupingProgramCourses: programCourses,
    subjectGroupingSubjects: subjects,
  } as unknown as SubjectGroupingMainDto;
}

export async function createSubjectGroupingMainFromDto(
  input: CreateSubjectGroupingMainDtoInput,
): Promise<SubjectGroupingMainDto | null> {
  const base: SubjectGroupingMainT = {
    academicYearId: input.academicYear.id,
    subjectTypeId: input.subjectType.id,
    name: input.name,
    code: input.code ?? null,
    description: input.description ?? null,
    isActive: input.isActive ?? true,
  } as SubjectGroupingMainT;

  const [created] = await db
    .insert(subjectGroupingMainModel)
    .values(base)
    .returning();
  if (!created) return null;

  const mainId = created.id!;

  if (input.subjectGroupingProgramCourses?.length) {
    const rows = input.subjectGroupingProgramCourses
      .map((pc) => pc.programCourse?.id)
      .filter((id): id is number => !!id)
      .map((programCourseId) => ({
        subjectGroupingMainId: mainId,
        programCourseId,
      }));
    if (rows.length > 0) {
      await db
        .insert(subjectGroupingProgramCourseModel)
        .values(rows)
        .returning();
    }
  }

  if (input.subjectGroupingSubjects?.length) {
    const rows = input.subjectGroupingSubjects
      .map((s) => s.subject?.id)
      .filter((id): id is number => !!id)
      .map((subjectId) => ({ subjectGroupingMainId: mainId, subjectId }));
    if (rows.length > 0) {
      await db.insert(subjectGroupingSubjectModel).values(rows).returning();
    }
  }

  const [fresh] = await db
    .select()
    .from(subjectGroupingMainModel)
    .where(eq(subjectGroupingMainModel.id, mainId));
  if (!fresh) return null;
  return mapMainToDto(fresh as SubjectGroupingMainT);
}

export async function getSubjectGroupingMainById(
  id: number,
): Promise<SubjectGroupingMainDto | null> {
  const [main] = await db
    .select()
    .from(subjectGroupingMainModel)
    .where(eq(subjectGroupingMainModel.id, id));
  if (!main) return null;
  return mapMainToDto(main as SubjectGroupingMainT);
}

export async function getAllSubjectGroupingMains(): Promise<
  SubjectGroupingMainDto[]
> {
  const mains = await db.select().from(subjectGroupingMainModel);
  const dtos: SubjectGroupingMainDto[] = [];
  for (const m of mains) {
    const dto = await mapMainToDto(m as SubjectGroupingMainT);
    if (dto) dtos.push(dto);
  }
  return dtos;
}

export async function updateSubjectGroupingMainFromDto(
  id: number,
  input: UpdateSubjectGroupingMainDtoInput,
): Promise<SubjectGroupingMainDto | null> {
  const [existing] = await db
    .select()
    .from(subjectGroupingMainModel)
    .where(eq(subjectGroupingMainModel.id, id));
  if (!existing) return null;

  const patch: Partial<SubjectGroupingMainT> = {};
  if (input.academicYear?.id) patch.academicYearId = input.academicYear.id;
  if (input.subjectType?.id) patch.subjectTypeId = input.subjectType.id;
  if (typeof input.name === "string") patch.name = input.name;
  if (input.code !== undefined) patch.code = input.code;
  if (input.description !== undefined) patch.description = input.description;
  if (typeof input.isActive === "boolean") patch.isActive = input.isActive;

  if (Object.keys(patch).length > 0) {
    await db
      .update(subjectGroupingMainModel)
      .set(patch)
      .where(eq(subjectGroupingMainModel.id, id))
      .returning();
  }

  if (input.subjectGroupingProgramCourses) {
    const incomingIds = input.subjectGroupingProgramCourses
      .map((pc) => pc.programCourse?.id)
      .filter((pid): pid is number => !!pid);

    if (incomingIds.length === 0) {
      // No program-courses provided → remove all existing links
      await db
        .delete(subjectGroupingProgramCourseModel)
        .where(eq(subjectGroupingProgramCourseModel.subjectGroupingMainId, id));
    } else {
      // Delete links that are no longer present
      await db
        .delete(subjectGroupingProgramCourseModel)
        .where(
          and(
            eq(subjectGroupingProgramCourseModel.subjectGroupingMainId, id),
            notInArray(
              subjectGroupingProgramCourseModel.programCourseId,
              incomingIds,
            ),
          ),
        );

      // Insert new links that don't already exist
      const existing = await db
        .select({
          programCourseId: subjectGroupingProgramCourseModel.programCourseId,
        })
        .from(subjectGroupingProgramCourseModel)
        .where(eq(subjectGroupingProgramCourseModel.subjectGroupingMainId, id));

      const existingIds = new Set(existing.map((row) => row.programCourseId));
      const rowsToInsert = incomingIds
        .filter((programCourseId) => !existingIds.has(programCourseId))
        .map((programCourseId) => ({
          subjectGroupingMainId: id,
          programCourseId,
        }));

      if (rowsToInsert.length > 0) {
        await db
          .insert(subjectGroupingProgramCourseModel)
          .values(rowsToInsert)
          .returning();
      }
    }
  }

  if (input.subjectGroupingSubjects) {
    const incomingIds = input.subjectGroupingSubjects
      .map((s) => s.subject?.id)
      .filter((sid): sid is number => !!sid);

    if (incomingIds.length === 0) {
      // No subjects provided → remove all existing links
      await db
        .delete(subjectGroupingSubjectModel)
        .where(eq(subjectGroupingSubjectModel.subjectGroupingMainId, id));
    } else {
      // Delete links that are no longer present
      await db
        .delete(subjectGroupingSubjectModel)
        .where(
          and(
            eq(subjectGroupingSubjectModel.subjectGroupingMainId, id),
            notInArray(subjectGroupingSubjectModel.subjectId, incomingIds),
          ),
        );

      // Insert new links that don't already exist
      const existing = await db
        .select({
          subjectId: subjectGroupingSubjectModel.subjectId,
        })
        .from(subjectGroupingSubjectModel)
        .where(eq(subjectGroupingSubjectModel.subjectGroupingMainId, id));

      const existingIds = new Set(existing.map((row) => row.subjectId));
      const rowsToInsert = incomingIds
        .filter((subjectId) => !existingIds.has(subjectId))
        .map((subjectId) => ({ subjectGroupingMainId: id, subjectId }));

      if (rowsToInsert.length > 0) {
        await db
          .insert(subjectGroupingSubjectModel)
          .values(rowsToInsert)
          .returning();
      }
    }
  }

  return getSubjectGroupingMainById(id);
}

export async function deleteSubjectGroupingMain(
  id: number,
): Promise<SubjectGroupingMainDto | null> {
  const existing = await getSubjectGroupingMainById(id);
  if (!existing) return null;

  await db
    .delete(subjectGroupingProgramCourseModel)
    .where(eq(subjectGroupingProgramCourseModel.subjectGroupingMainId, id));
  await db
    .delete(subjectGroupingSubjectModel)
    .where(eq(subjectGroupingSubjectModel.subjectGroupingMainId, id));
  await db
    .delete(subjectGroupingMainModel)
    .where(eq(subjectGroupingMainModel.id, id));

  return existing;
}
