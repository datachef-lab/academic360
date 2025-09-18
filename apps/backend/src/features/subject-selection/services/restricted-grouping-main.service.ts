import { db } from "@/db/index.js";
import { restrictedGroupingMainModel } from "@repo/db/schemas/models/subject-selection";
import {
  RestrictedGroupingMain,
  RestrictedGroupingMainT,
} from "@repo/db/schemas/models/subject-selection/restricted-grouping-main.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import {
  RestrictedGroupingMainDto,
  RestrictedGroupingClassDto,
  RestrictedGroupingSubjectDto,
  RestrictedGroupingProgramCourseDto,
} from "@repo/db/dtos/subject-selection";
import {
  subjectModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import { restrictedGroupingClassModel } from "@repo/db/schemas/models/subject-selection";
import { restrictedGroupingSubjectModel } from "@repo/db/schemas/models/subject-selection";
import { restrictedGroupingProgramCourseModel } from "@repo/db/schemas/models/subject-selection";
import { classModel } from "@repo/db/schemas/models/academics";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import XLSX from "xlsx";
import fs from "fs";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";

// Bulk upload interface
export interface RestrictedGroupingMainBulkUploadResult {
  success: RestrictedGroupingMainDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

// DTO-shaped input used by frontend and for future compatibility
export type CreateRestrictedGroupingMainDtoInput = {
  subjectType: { id: number };
  subject: { id: number };
  isActive?: boolean;
  forClasses?: { class: { id: number } }[];
  cannotCombineWithSubjects?: { cannotCombineWithSubject: { id: number } }[];
  applicableProgramCourses?: { programCourse: { id: number } }[];
};

export type UpdateRestrictedGroupingMainDtoInput =
  Partial<CreateRestrictedGroupingMainDtoInput>;

export async function createRestrictedGroupingMain(
  data: RestrictedGroupingMain,
): Promise<RestrictedGroupingMainDto> {
  const [created] = await db
    .insert(restrictedGroupingMainModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getRestrictedGroupingMainById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created restricted grouping main");
  }
  return result;
}

// New: accept DTO-shaped payload and map to model + related records
export async function createRestrictedGroupingMainFromDto(
  input: CreateRestrictedGroupingMainDtoInput,
): Promise<RestrictedGroupingMainDto> {
  // 1) Validate foreign keys exist
  const [[foundSt], [foundSubj]] = await Promise.all([
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, input.subjectType.id)),
    db.select().from(subjectModel).where(eq(subjectModel.id, input.subject.id)),
  ]);
  if (!foundSt) {
    throw new Error(`SubjectType not found for id=${input.subjectType.id}`);
  }
  if (!foundSubj) {
    throw new Error(`Subject not found for id=${input.subject.id}`);
  }

  // 2) Check for existing main to prevent duplicates (same subjectType + subject)
  const [existingMain] = await db
    .select()
    .from(restrictedGroupingMainModel)
    .where(
      and(
        eq(restrictedGroupingMainModel.subjectTypeId, input.subjectType.id),
        eq(restrictedGroupingMainModel.subjectId, input.subject.id),
      ),
    );

  if (existingMain) {
    throw new Error(
      `Restricted grouping already exists for subject type ${input.subjectType.id} and subject ${input.subject.id}`,
    );
  }

  const base: RestrictedGroupingMain = {
    subjectTypeId: input.subjectType.id,
    subjectId: input.subject.id,
    isActive: input.isActive ?? true,
  } as RestrictedGroupingMain;

  const created = await createRestrictedGroupingMain(base);

  // 3) Add related records if provided
  if (input.forClasses && input.forClasses.length > 0) {
    for (const cls of input.forClasses) {
      const classId = cls?.class?.id;
      if (!classId) continue;
      await db
        .insert(restrictedGroupingClassModel)
        .values({ restrictedGroupingMainId: created.id!, classId })
        .returning();
    }
  }

  if (
    input.cannotCombineWithSubjects &&
    input.cannotCombineWithSubjects.length > 0
  ) {
    for (const subj of input.cannotCombineWithSubjects) {
      const subjId = subj?.cannotCombineWithSubject?.id;
      if (!subjId || subjId === created.subject.id) continue; // skip self-reference
      await db
        .insert(restrictedGroupingSubjectModel)
        .values({
          restrictedGroupingMainId: created.id!,
          cannotCombineWithSubjectId: subjId,
        })
        .returning();
    }
  }

  if (
    input.applicableProgramCourses &&
    input.applicableProgramCourses.length > 0
  ) {
    for (const pc of input.applicableProgramCourses) {
      const pcId = pc?.programCourse?.id;
      if (!pcId) continue;
      await db
        .insert(restrictedGroupingProgramCourseModel)
        .values({
          restrictedGroupingMainId: created.id!,
          programCourseId: pcId,
        })
        .returning();
    }
  }

  const refreshed = await getRestrictedGroupingMainById(created.id!);
  if (!refreshed) throw new Error("Failed to create restricted grouping main");
  return refreshed;
}

export async function getAllRestrictedGroupingMains(): Promise<
  RestrictedGroupingMainDto[]
> {
  const results = await db
    .select({
      id: restrictedGroupingMainModel.id,
      subjectTypeId: restrictedGroupingMainModel.subjectTypeId,
      subjectId: restrictedGroupingMainModel.subjectId,
      isActive: restrictedGroupingMainModel.isActive,
      createdAt: restrictedGroupingMainModel.createdAt,
      updatedAt: restrictedGroupingMainModel.updatedAt,
      subjectType: {
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        isActive: subjectTypeModel.isActive,
      },
      subject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(restrictedGroupingMainModel)
    .leftJoin(
      subjectTypeModel,
      eq(restrictedGroupingMainModel.subjectTypeId, subjectTypeModel.id),
    )
    .leftJoin(
      subjectModel,
      eq(restrictedGroupingMainModel.subjectId, subjectModel.id),
    );

  // Get related data for each main
  const resultsWithRelated = await Promise.all(
    results.map(async (main) => {
      // Get classes
      const classes = await db
        .select({
          id: restrictedGroupingClassModel.id,
          classId: restrictedGroupingClassModel.classId,
          class: {
            id: classModel.id,
            name: classModel.name,
            shortName: classModel.shortName,
            type: classModel.type,
            sequence: classModel.sequence,
            isActive: classModel.isActive,
            createdAt: classModel.createdAt,
            updatedAt: classModel.updatedAt,
          },
        })
        .from(restrictedGroupingClassModel)
        .leftJoin(
          classModel,
          eq(restrictedGroupingClassModel.classId, classModel.id),
        )
        .where(
          eq(restrictedGroupingClassModel.restrictedGroupingMainId, main.id),
        );

      // Get subjects that cannot be combined
      const cannotCombineSubjects = await db
        .select({
          id: restrictedGroupingSubjectModel.id,
          cannotCombineWithSubjectId:
            restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
          cannotCombineWithSubject: {
            id: subjectModel.id,
            name: subjectModel.name,
            code: subjectModel.code,
            isActive: subjectModel.isActive,
          },
        })
        .from(restrictedGroupingSubjectModel)
        .leftJoin(
          subjectModel,
          eq(
            restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
            subjectModel.id,
          ),
        )
        .where(
          eq(restrictedGroupingSubjectModel.restrictedGroupingMainId, main.id),
        );

      // Get applicable program courses
      const applicableProgramCourses = await db
        .select({
          id: restrictedGroupingProgramCourseModel.id,
          programCourseId: restrictedGroupingProgramCourseModel.programCourseId,
          programCourse: {
            id: programCourseModel.id,
            name: programCourseModel.name,
            shortName: programCourseModel.shortName,
            duration: programCourseModel.duration,
            totalSemesters: programCourseModel.totalSemesters,
            streamId: programCourseModel.streamId,
            courseId: programCourseModel.courseId,
            courseTypeId: programCourseModel.courseTypeId,
            courseLevelId: programCourseModel.courseLevelId,
            affiliationId: programCourseModel.affiliationId,
            regulationTypeId: programCourseModel.regulationTypeId,
            isActive: programCourseModel.isActive,
            createdAt: programCourseModel.createdAt,
            updatedAt: programCourseModel.updatedAt,
          },
        })
        .from(restrictedGroupingProgramCourseModel)
        .leftJoin(
          programCourseModel,
          eq(
            restrictedGroupingProgramCourseModel.programCourseId,
            programCourseModel.id,
          ),
        )
        .where(
          eq(
            restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
            main.id,
          ),
        );

      // Dedupe by underlying FK ids to avoid duplicates from joins or stale rows
      const dedupeBy = <T, K>(items: T[], getKey: (t: T) => K) => {
        const seen = new Set<K>();
        const out: T[] = [];
        for (const it of items) {
          const key = getKey(it);
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(it);
        }
        return out;
      };

      const classesUnique = dedupeBy(classes, (c) => c.classId as number);
      const cannotUnique = dedupeBy(
        cannotCombineSubjects,
        (s) => s.cannotCombineWithSubjectId as number,
      );
      const programsUnique = dedupeBy(
        applicableProgramCourses,
        (p) => p.programCourseId as number,
      );

      return {
        id: main.id,
        isActive: main.isActive,
        createdAt: main.createdAt,
        updatedAt: main.updatedAt,
        subjectType: main.subjectType || {
          id: 0,
          name: "Unknown Subject Type",
          code: null,
          sequence: null,
          isActive: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          legacySubjectTypeId: null,
        },
        subject: main.subject || {
          id: 0,
          name: "Unknown Subject",
          code: null,
          sequence: null,
          isActive: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          legacySubjectId: null,
        },
        forClasses: classesUnique.map((cls) => ({
          id: cls.id,
          class: cls.class || {
            id: 0,
            name: "Unknown Class",
            type: "SEMESTER" as const,
            shortName: null,
            sequence: null,
            isActive: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })),
        cannotCombineWithSubjects: cannotUnique.map((subj) => ({
          id: subj.id,
          cannotCombineWithSubject: subj.cannotCombineWithSubject || {
            id: 0,
            name: "Unknown Subject",
            code: null,
            sequence: null,
            isActive: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            legacySubjectId: null,
          },
        })),
        applicableProgramCourses: programsUnique.map((pc) => ({
          id: pc.id,
          programCourse: pc.programCourse || {
            id: 0,
            name: "Unknown Program Course",
            shortName: null,
            duration: 0,
            totalSemesters: 0,
            isActive: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            streamId: null,
            courseId: null,
            courseTypeId: null,
            courseLevelId: null,
            affiliationId: null,
            regulationTypeId: null,
          },
        })),
      };
    }),
  );

  return resultsWithRelated;
}

export async function getRestrictedGroupingMainsPaginated(options: {
  page: number;
  pageSize: number;
  search?: string;
  subjectType?: string; // code or name
  programCourseId?: number;
}): Promise<PaginatedResponse<RestrictedGroupingMainDto>> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 10));
  const offset = (page - 1) * pageSize;

  // Base select for mains with joins for filtering/search (select id only to avoid duplication noise)
  const baseQuery = db
    .select({
      id: restrictedGroupingMainModel.id,
    })
    .from(restrictedGroupingMainModel)
    .leftJoin(
      subjectTypeModel,
      eq(restrictedGroupingMainModel.subjectTypeId, subjectTypeModel.id),
    )
    .leftJoin(
      subjectModel,
      eq(restrictedGroupingMainModel.subjectId, subjectModel.id),
    )
    .leftJoin(
      restrictedGroupingProgramCourseModel,
      eq(
        restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
        restrictedGroupingMainModel.id,
      ),
    );

  const filters = [] as any[];
  const q = (options.search || "").trim();
  if (q) {
    filters.push(ilike(subjectModel.name, `%${q}%`));
  }
  if (options.subjectType) {
    filters.push(ilike(subjectTypeModel.code, `%${options.subjectType}%`));
  }
  if (options.programCourseId) {
    filters.push(
      eq(
        restrictedGroupingProgramCourseModel.programCourseId,
        options.programCourseId,
      ),
    );
  }

  // Fetch with filters, then compute unique ids and paginate ids (avoids duplicate rows caused by joins)
  const mains = await baseQuery.where(
    filters.length ? (and as any)(...filters) : (undefined as any),
  );

  const uniqueIds = Array.from(
    new Set(mains.map((m: any) => Number(m.id))),
  ).filter((n) => !Number.isNaN(n));
  const totalElements = uniqueIds.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const pageIds = uniqueIds.slice(offset, offset + pageSize);

  // Map each unique id to full DTO using helper
  const full = await Promise.all(
    pageIds.map((id) => getRestrictedGroupingMainById(id)),
  );
  const content = full.filter(Boolean) as RestrictedGroupingMainDto[];
  return { content, page, pageSize, totalPages, totalElements };
}

export async function getRestrictedGroupingMainById(
  id: number,
): Promise<RestrictedGroupingMainDto | null> {
  const [result] = await db
    .select({
      id: restrictedGroupingMainModel.id,
      subjectTypeId: restrictedGroupingMainModel.subjectTypeId,
      subjectId: restrictedGroupingMainModel.subjectId,
      isActive: restrictedGroupingMainModel.isActive,
      createdAt: restrictedGroupingMainModel.createdAt,
      updatedAt: restrictedGroupingMainModel.updatedAt,
      subjectType: {
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        isActive: subjectTypeModel.isActive,
      },
      subject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(restrictedGroupingMainModel)
    .leftJoin(
      subjectTypeModel,
      eq(restrictedGroupingMainModel.subjectTypeId, subjectTypeModel.id),
    )
    .leftJoin(
      subjectModel,
      eq(restrictedGroupingMainModel.subjectId, subjectModel.id),
    )
    .where(eq(restrictedGroupingMainModel.id, id));

  if (!result) return null;

  // Get related data
  const classes = await db
    .select({
      id: restrictedGroupingClassModel.id,
      classId: restrictedGroupingClassModel.classId,
      class: {
        id: classModel.id,
        name: classModel.name,
        shortName: classModel.shortName,
        type: classModel.type,
        sequence: classModel.sequence,
        isActive: classModel.isActive,
        createdAt: classModel.createdAt,
        updatedAt: classModel.updatedAt,
      },
    })
    .from(restrictedGroupingClassModel)
    .leftJoin(
      classModel,
      eq(restrictedGroupingClassModel.classId, classModel.id),
    )
    .where(
      eq(restrictedGroupingClassModel.restrictedGroupingMainId, result.id),
    );

  const cannotCombineSubjects = await db
    .select({
      id: restrictedGroupingSubjectModel.id,
      cannotCombineWithSubjectId:
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
      cannotCombineWithSubject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(restrictedGroupingSubjectModel)
    .leftJoin(
      subjectModel,
      eq(
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
        subjectModel.id,
      ),
    )
    .where(
      eq(restrictedGroupingSubjectModel.restrictedGroupingMainId, result.id),
    );

  const applicableProgramCourses = await db
    .select({
      id: restrictedGroupingProgramCourseModel.id,
      programCourseId: restrictedGroupingProgramCourseModel.programCourseId,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        duration: programCourseModel.duration,
        totalSemesters: programCourseModel.totalSemesters,
        streamId: programCourseModel.streamId,
        courseId: programCourseModel.courseId,
        courseTypeId: programCourseModel.courseTypeId,
        courseLevelId: programCourseModel.courseLevelId,
        affiliationId: programCourseModel.affiliationId,
        regulationTypeId: programCourseModel.regulationTypeId,
        isActive: programCourseModel.isActive,
        createdAt: programCourseModel.createdAt,
        updatedAt: programCourseModel.updatedAt,
      },
    })
    .from(restrictedGroupingProgramCourseModel)
    .leftJoin(
      programCourseModel,
      eq(
        restrictedGroupingProgramCourseModel.programCourseId,
        programCourseModel.id,
      ),
    )
    .where(
      eq(
        restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
        result.id,
      ),
    );

  return {
    id: result.id,
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    subjectType: result.subjectType || {
      id: 0,
      name: "Unknown Subject Type",
      code: null,
      sequence: null,
      isActive: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      legacySubjectTypeId: null,
    },
    subject: result.subject || {
      id: 0,
      name: "Unknown Subject",
      code: null,
      sequence: null,
      isActive: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      legacySubjectId: null,
    },
    forClasses: classes.map((cls) => ({
      id: cls.id,
      class: cls.class || {
        id: 0,
        name: "Unknown Class",
        type: "SEMESTER" as const,
        shortName: null,
        sequence: null,
        isActive: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })),
    cannotCombineWithSubjects: cannotCombineSubjects.map((subj) => ({
      id: subj.id,
      cannotCombineWithSubject: subj.cannotCombineWithSubject || {
        id: 0,
        name: "Unknown Subject",
        code: null,
        sequence: null,
        isActive: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        legacySubjectId: null,
      },
    })),
    applicableProgramCourses: applicableProgramCourses.map((pc) => ({
      id: pc.id,
      programCourse: pc.programCourse || {
        id: 0,
        name: "Unknown Program Course",
        shortName: null,
        duration: 0,
        totalSemesters: 0,
        isActive: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        streamId: null,
        courseId: null,
        courseTypeId: null,
        courseLevelId: null,
        affiliationId: null,
        regulationTypeId: null,
      },
    })),
  };
}

export async function updateRestrictedGroupingMain(
  id: number,
  data: Partial<RestrictedGroupingMain>,
): Promise<RestrictedGroupingMainDto> {
  const [updated] = await db
    .update(restrictedGroupingMainModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(restrictedGroupingMainModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getRestrictedGroupingMainById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated restricted grouping main");
  }
  return result;
}

// New: DTO-based update with nested record reconciliation
export async function updateRestrictedGroupingMainFromDto(
  id: number,
  input: UpdateRestrictedGroupingMainDtoInput,
): Promise<RestrictedGroupingMainDto> {
  // 1) Update main fields if provided
  const partial: Partial<RestrictedGroupingMain> = {};
  if (input.subjectType?.id) partial.subjectTypeId = input.subjectType.id;
  if (input.subject?.id) partial.subjectId = input.subject.id;
  if (typeof input.isActive === "boolean") partial.isActive = input.isActive;
  if (Object.keys(partial).length > 0) {
    await updateRestrictedGroupingMain(id, partial);
  }

  // 2) Reconcile classes when provided on DTO
  if (Array.isArray(input.forClasses)) {
    // Fetch current classes for this main
    const currentClasses = await db
      .select({
        id: restrictedGroupingClassModel.id,
        classId: restrictedGroupingClassModel.classId,
      })
      .from(restrictedGroupingClassModel)
      .where(eq(restrictedGroupingClassModel.restrictedGroupingMainId, id));

    const currentIds = new Set(currentClasses.map((c) => c.classId));
    const desiredIds = new Set(
      input.forClasses.map((c) => c.class?.id).filter((v): v is number => !!v),
    );

    // Add missing classes
    for (const desiredId of desiredIds) {
      if (!currentIds.has(desiredId)) {
        await db
          .insert(restrictedGroupingClassModel)
          .values({ restrictedGroupingMainId: id, classId: desiredId });
      }
    }

    // Delete classes no longer desired
    for (const c of currentClasses) {
      if (
        typeof c.id === "number" &&
        typeof c.classId === "number" &&
        !desiredIds.has(c.classId)
      ) {
        await db
          .delete(restrictedGroupingClassModel)
          .where(eq(restrictedGroupingClassModel.id, c.id));
      }
    }
  }

  // 3) Reconcile cannot combine subjects when provided on DTO
  if (Array.isArray(input.cannotCombineWithSubjects)) {
    const currentSubjects = await db
      .select({
        id: restrictedGroupingSubjectModel.id,
        cannotCombineWithSubjectId:
          restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
      })
      .from(restrictedGroupingSubjectModel)
      .where(eq(restrictedGroupingSubjectModel.restrictedGroupingMainId, id));

    const currentIds = new Set(
      currentSubjects.map((s) => s.cannotCombineWithSubjectId),
    );
    const desiredIds = new Set(
      input.cannotCombineWithSubjects
        .map((s) => s.cannotCombineWithSubject?.id)
        .filter((v): v is number => !!v),
    );

    // Add missing subjects
    for (const desiredId of desiredIds) {
      if (!currentIds.has(desiredId)) {
        await db.insert(restrictedGroupingSubjectModel).values({
          restrictedGroupingMainId: id,
          cannotCombineWithSubjectId: desiredId,
        });
      }
    }

    // Delete subjects no longer desired
    for (const s of currentSubjects) {
      if (
        typeof s.id === "number" &&
        typeof s.cannotCombineWithSubjectId === "number" &&
        !desiredIds.has(s.cannotCombineWithSubjectId)
      ) {
        await db
          .delete(restrictedGroupingSubjectModel)
          .where(eq(restrictedGroupingSubjectModel.id, s.id));
      }
    }
  }

  // 4) Reconcile program courses when provided on DTO
  if (Array.isArray(input.applicableProgramCourses)) {
    const currentProgramCourses = await db
      .select({
        id: restrictedGroupingProgramCourseModel.id,
        programCourseId: restrictedGroupingProgramCourseModel.programCourseId,
      })
      .from(restrictedGroupingProgramCourseModel)
      .where(
        eq(restrictedGroupingProgramCourseModel.restrictedGroupingMainId, id),
      );

    const currentIds = new Set(
      currentProgramCourses.map((pc) => pc.programCourseId),
    );
    const desiredIds = new Set(
      input.applicableProgramCourses
        .map((pc) => pc.programCourse?.id)
        .filter((v): v is number => !!v),
    );

    // Add missing program courses
    for (const desiredId of desiredIds) {
      if (!currentIds.has(desiredId)) {
        await db
          .insert(restrictedGroupingProgramCourseModel)
          .values({ restrictedGroupingMainId: id, programCourseId: desiredId });
      }
    }

    // Delete program courses no longer desired
    for (const pc of currentProgramCourses) {
      if (
        typeof pc.id === "number" &&
        typeof pc.programCourseId === "number" &&
        !desiredIds.has(pc.programCourseId)
      ) {
        await db
          .delete(restrictedGroupingProgramCourseModel)
          .where(eq(restrictedGroupingProgramCourseModel.id, pc.id));
      }
    }
  }

  // 5) Return refreshed DTO
  const result = await getRestrictedGroupingMainById(id);
  if (!result)
    throw new Error("Failed to retrieve updated restricted grouping main");
  return result;
}

export async function deleteRestrictedGroupingMain(id: number) {
  // First delete related records
  await db
    .delete(restrictedGroupingClassModel)
    .where(eq(restrictedGroupingClassModel.restrictedGroupingMainId, id));

  await db
    .delete(restrictedGroupingSubjectModel)
    .where(eq(restrictedGroupingSubjectModel.restrictedGroupingMainId, id));

  await db
    .delete(restrictedGroupingProgramCourseModel)
    .where(
      eq(restrictedGroupingProgramCourseModel.restrictedGroupingMainId, id),
    );

  // Then delete main
  const [deleted] = await db
    .delete(restrictedGroupingMainModel)
    .where(eq(restrictedGroupingMainModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadRestrictedGroupingMains(
  file: Express.Multer.File,
): Promise<RestrictedGroupingMainBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: RestrictedGroupingMainDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const restrictedGroupingMainData: RestrictedGroupingMain = {
        subjectTypeId: row.subjectTypeId,
        subjectId: row.subjectId,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createRestrictedGroupingMain(
        restrictedGroupingMainData,
      );
      success.push(created);
    } catch (error) {
      errors.push({
        row: i + 2, // +2 because Excel is 1-indexed and we skip header
        data: Object.values(data[i] as any),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Clean up file
  fs.unlinkSync(file.path);

  return { success, errors };
}
