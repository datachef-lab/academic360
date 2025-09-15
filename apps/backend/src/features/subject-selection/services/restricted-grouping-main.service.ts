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

// Bulk upload interface
export interface RestrictedGroupingMainBulkUploadResult {
  success: RestrictedGroupingMainDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

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
    }),
  );

  return resultsWithRelated;
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
