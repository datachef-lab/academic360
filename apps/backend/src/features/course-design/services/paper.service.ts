import { db } from "@/db/index.js";
import { eq, and, or, ilike, countDistinct, desc, SQL } from "drizzle-orm";
import { Paper, paperModel } from "@repo/db/schemas/models/course-design";
import { PaperDto } from "@repo/db/dtos/course-design";
import {
  createPaperComponent,
  // updatePaperComponent,
  // deletePaperComponent,
  findPaperComponentsByPaperId,
} from "./paper-component.service.js";
import XLSX from "xlsx";
import fs from "fs";
import {
  createTopic,
  getTopicsByPaperId,
  updateTopic,
} from "./topic.service.js";
import { paperComponentModel } from "@repo/db/schemas/models/course-design";
import { examComponentModel } from "@repo/db/schemas/models/course-design";
import { classModel } from "@repo/db/schemas/models/academics";
import { topicModel } from "@repo/db/schemas/models/course-design";
import { marksheetPaperMappingModel } from "@repo/db/schemas/models/academics";
import { batchStudentPaperModel } from "@repo/db/schemas/models/course-design";
import { getSubjectById } from "./subject.service";
import { findById as findAffiliationById } from "@/features/course-design/services/affiliation.service.js";
import { findById as findRegulationTypeById } from "@/features/course-design/services/regulation-type.service.js";
import { findAcademicYearById } from "@/features/academics/services/academic-year.service";
import { getSubjectTypeById } from "./subject-type.service";
import { findById as findProgramCourseById } from "@/features/course-design/services/program-course.service.js";
import { findClassById } from "@/features/academics/services/class.service";
// import { findCourseById } from "./course.service";
// import { findAcademicYearById } from "@/features/academics/services/academic-year.service";
// import { findClassById } from "@/features/academics/services/class.service";
// import { getSubjectById } from "./subject.service";
// import { getAffiliationById } from "./affiliation.service";
// import { getRegulationTypeById } from "./regulation-type.service";
// import { getSubjectTypeById } from "./subject-type.service";
// import { getPaperComponentById } from "../controllers/paper-component.controller";

// Separate detailed DTO for expanded responses (embedded entities)
export interface PaperDetailedDto
  extends Omit<
    PaperDto,
    | "subjectId"
    | "affiliationId"
    | "regulationTypeId"
    | "academicYearId"
    | "subjectTypeId"
    | "programCourseId"
    | "classId"
  > {
  subject: unknown;
  affiliation: unknown;
  regulationType: unknown;
  academicYear: unknown;
  subjectType: unknown;
  programCourse: unknown;
  class: unknown;
}

export interface BulkUploadResult {
  success: Paper[];
  errors: Array<{ row: number; data: unknown[]; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Bulk upload papers
export const bulkUploadPapers = async (
  filePath: string,
  io?: any,
  uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = {
    success: [],
    errors: [],
    summary: { total: 0, successful: 0, failed: 0 },
  };

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    result.summary.total = data.length - 1;

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;

      try {
        const paperData = {
          subjectId: row[0] ? parseInt(row[0].toString()) : null,
          affiliationId: row[1] ? parseInt(row[1].toString()) : null,
          regulationTypeId: row[2] ? parseInt(row[2].toString()) : null,
          academicYearId: row[3] ? parseInt(row[3].toString()) : null,
          subjectTypeId: row[4] ? parseInt(row[4].toString()) : null,
          programCourseId: row[5] ? parseInt(row[5].toString()) : null,
          classId: row[6] ? parseInt(row[6].toString()) : null,
          name: row[7]?.toString()?.trim(),
          code: row[8]?.toString()?.trim(),
          isOptional:
            row[9]?.toString()?.toLowerCase() === "true" || row[9] === true,
          sequence: row[10] ? parseInt(row[10].toString()) : null,
          isActive:
            row[11]?.toString()?.toLowerCase() !== "false" && row[11] !== false,
        };

        // Validate required fields
        if (
          !paperData.subjectId ||
          !paperData.affiliationId ||
          !paperData.regulationTypeId ||
          !paperData.academicYearId ||
          !paperData.subjectTypeId ||
          !paperData.programCourseId ||
          !paperData.classId ||
          !paperData.name ||
          !paperData.code
        ) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: "All required fields must be provided",
          });
          result.summary.failed++;
          continue;
        }

        // Check for duplicates (name + code combination)
        const existingPaper = await db
          .select()
          .from(paperModel)
          .where(
            and(
              eq(paperModel.name, paperData.name),
              eq(paperModel.code, paperData.code),
            ),
          );

        if (existingPaper.length > 0) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Paper with name "${paperData.name}" and code "${paperData.code}" already exists`,
          });
          result.summary.failed++;
          continue;
        }

        // Insert the paper
        const [newPaper] = await db
          .insert(paperModel)
          .values({
            subjectId: paperData.subjectId,
            affiliationId: paperData.affiliationId,
            regulationTypeId: paperData.regulationTypeId,
            academicYearId: paperData.academicYearId,
            subjectTypeId: paperData.subjectTypeId,
            programCourseId: paperData.programCourseId,
            classId: paperData.classId,
            name: paperData.name,
            code: paperData.code,
            isOptional: paperData.isOptional,
            sequence: paperData.sequence ?? undefined,
            isActive: paperData.isActive,
          })
          .returning();

        result.success.push(newPaper);
        result.summary.successful++;
      } catch (error: unknown) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.summary.failed++;
      }

      // Emit progress
      if (io && uploadSessionId) {
        io.to(uploadSessionId).emit("bulk-upload-progress", {
          processed: i,
          total: data.length - 1,
          percent: Math.round((i / (data.length - 1)) * 100),
        });
      }
    }

    // Clean up file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Emit completion
    if (io && uploadSessionId) {
      if (result.errors.length > 0) {
        io.to(uploadSessionId).emit("bulk-upload-failed", {
          errorCount: result.errors.length,
        });
      } else {
        io.to(uploadSessionId).emit("bulk-upload-done", {
          successCount: result.success.length,
        });
      }
    }

    return result;
  } catch (error: unknown) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(
      `Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export async function createPaper(data: PaperDto) {
  const { components, topics, ...props } = data;

  let [existingPaper] = await db
    .select()
    .from(paperModel)
    .where(
      and(
        eq(paperModel.code, data.code),
        eq(paperModel.subjectId, data.subjectId!),
        eq(paperModel.programCourseId, data.programCourseId!),
        eq(paperModel.classId, data.classId!),
        eq(paperModel.affiliationId, data.affiliationId),
        eq(paperModel.regulationTypeId, data.regulationTypeId),
        eq(paperModel.academicYearId, data?.academicYearId!),
        ilike(paperModel.name, data.name.trim()),
      ),
    );
  if (!existingPaper) {
    const [created] = await db
      .insert(paperModel)
      .values({
        name: data.name,
        code: data.code,
        isOptional: props.isOptional ?? false,
        sequence: props.sequence ?? undefined,
        isActive: props.isActive ?? true,
        subjectId: data.subjectId!,
        subjectTypeId: data.subjectTypeId!,
        affiliationId: data.affiliationId,
        regulationTypeId: data.regulationTypeId,
        academicYearId: data.academicYearId!,
        programCourseId: data.programCourseId!,
        classId: data.classId!,
      })
      .returning();
    existingPaper = created;
  }

  for (const component of components) {
    // Only create components with valid marks and credit
    if ((component.fullMarks || 0) > 0 && (component.credit || 0) > 0) {
      await createPaperComponent({ ...component, paperId: existingPaper.id! });
    }
  }
  for (const topic of topics) {
    await createTopic({ ...topic, paperId: existingPaper.id! });
  }
  return existingPaper;
}

export async function createPapers(data: PaperDto[]) {
  const createdPapers: Paper[] = [];

  for (const paper of data) {
    const [existingPaper] = await db
      .select()
      .from(paperModel)
      .where(
        and(
          eq(paperModel.code, paper.code),
          eq(paperModel.subjectId, paper.subjectId!),
          eq(paperModel.programCourseId, paper.programCourseId!),
          eq(paperModel.classId, paper.classId!),
          eq(paperModel.affiliationId, paper.affiliationId),
          eq(paperModel.regulationTypeId, paper.regulationTypeId),
          eq(paperModel.academicYearId, paper.academicYearId!),
        ),
      );

    if (existingPaper) {
      console.log("Paper already exists:", existingPaper);
      createdPapers.push(existingPaper);
      continue; // Skip to the next paper if it already exists
    }

    const newPaper = await createPaper(paper);
    if (newPaper) {
      createdPapers.push(newPaper);
    }
  }

  return (
    await Promise.all(
      createdPapers.map(async (paper) => await modelToDto(paper)),
    )
  ).filter((paper) => paper !== null) as PaperDto[]; // Ensure we return only valid PaperDto objects
}

export async function getPaperById(id: number) {
  // Fetch paper with all related data including direct foreign key relationships
  const [paper] = await db
    .select()
    .from(paperModel)
    .where(eq(paperModel.id, id));

  if (!paper) {
    return null;
  }

  // Return the complete paper object with components
  return await modelToDto(paper as Paper);
}

// Detailed version (embedded relations)
export async function getPaperDetailedById(id: number) {
  const [paper] = await db
    .select()
    .from(paperModel)
    .where(eq(paperModel.id, id));
  if (!paper) return null;
  return await modelToDetailedDto(paper as Paper);
}

export async function getAllPapers() {
  const papers = await db.select().from(paperModel);

  return (
    await Promise.all(
      papers.map(async (paper) => await modelToDto(paper as Paper)),
    )
  ).filter((paper) => paper !== null) as PaperDto[]; // Ensure we return only valid PaperDto objects
}

export async function getPapersPaginated(
  page: number = 1,
  pageSize: number = 10,
) {
  const [{ total }] = await db
    .select({ total: countDistinct(paperModel.id) })
    .from(paperModel);

  const offset = (Math.max(1, page) - 1) * Math.max(1, pageSize);

  const rows = await db
    .select()
    .from(paperModel)
    .orderBy(desc(paperModel.id))
    .limit(Math.max(1, pageSize))
    .offset(offset);

  const content = (
    await Promise.all(
      rows.map(async (paper) => await modelToDto(paper as Paper)),
    )
  ).filter(Boolean) as PaperDto[];

  const totalElements = Number(total || 0);
  const totalPages = Math.max(
    1,
    Math.ceil(totalElements / Math.max(1, pageSize)),
  );

  return {
    content,
    page: Math.max(1, page),
    pageSize: Math.max(1, pageSize),
    totalPages,
    totalElements,
  };
}

interface PaperFilters {
  subjectId?: number;
  affiliationId?: number;
  regulationTypeId?: number;
  academicYearId?: number;
  subjectTypeId?: number;
  programCourseId?: number;
  classId?: number;
  isOptional?: boolean;
  searchText?: string;
}

export async function getPapersFilteredPaginated(
  filters: PaperFilters,
  page: number = 1,
  pageSize: number = 10,
) {
  // Build basic filter conditions first
  const conditions: SQL[] = [] as unknown as SQL[];
  if (filters.subjectId)
    conditions.push(eq(paperModel.subjectId, filters.subjectId));
  if (filters.affiliationId)
    conditions.push(eq(paperModel.affiliationId, filters.affiliationId));
  if (filters.regulationTypeId)
    conditions.push(eq(paperModel.regulationTypeId, filters.regulationTypeId));
  if (filters.academicYearId)
    conditions.push(eq(paperModel.academicYearId, filters.academicYearId));
  if (filters.subjectTypeId)
    conditions.push(eq(paperModel.subjectTypeId, filters.subjectTypeId));
  if (filters.programCourseId)
    conditions.push(eq(paperModel.programCourseId, filters.programCourseId));
  if (filters.classId) conditions.push(eq(paperModel.classId, filters.classId));
  if (filters.isOptional !== undefined)
    conditions.push(eq(paperModel.isOptional, filters.isOptional));

  // Import models only when needed
  const { subjectModel } = await import(
    "@repo/db/schemas/models/course-design"
  );
  const { affiliationModel } = await import(
    "@repo/db/schemas/models/course-design"
  );
  const { regulationTypeModel } = await import(
    "@repo/db/schemas/models/course-design"
  );
  const { academicYearModel } = await import(
    "@repo/db/schemas/models/academics"
  );
  const { subjectTypeModel } = await import(
    "@repo/db/schemas/models/course-design"
  );
  const { programCourseModel } = await import(
    "@repo/db/schemas/models/course-design"
  );
  const { classModel } = await import("@repo/db/schemas/models/academics");

  // Add search conditions if searchText is provided
  let searchConditions: SQL[] = [];
  if (filters.searchText && filters.searchText.trim()) {
    const searchPattern = `%${filters.searchText.trim().toLowerCase()}%`;
    searchConditions = [
      ilike(paperModel.name, searchPattern),
      ilike(paperModel.code, searchPattern),
      ilike(subjectModel.name, searchPattern),
      ilike(affiliationModel.name, searchPattern),
      ilike(regulationTypeModel.name, searchPattern),
      ilike(academicYearModel.year, searchPattern),
      ilike(subjectTypeModel.name, searchPattern),
      ilike(subjectTypeModel.code, searchPattern),
      ilike(programCourseModel.name, searchPattern),
      ilike(classModel.name, searchPattern),
    ];
  }

  // Combine all conditions
  const allConditions = [...conditions];
  if (searchConditions.length > 0) {
    allConditions.push(or(...searchConditions) as SQL);
  }

  const finalWhereClause =
    allConditions.length > 0 ? (and(...allConditions) as SQL) : undefined;

  // Ultra-optimized query - minimal joins for maximum speed
  let baseQuery;
  let countQuery;

  if (filters.searchText && filters.searchText.trim()) {
    // Only join tables that are actually searched
    baseQuery = db
      .select()
      .from(paperModel)
      .leftJoin(subjectModel, eq(paperModel.subjectId, subjectModel.id))
      .leftJoin(
        affiliationModel,
        eq(paperModel.affiliationId, affiliationModel.id),
      )
      .leftJoin(
        regulationTypeModel,
        eq(paperModel.regulationTypeId, regulationTypeModel.id),
      )
      .leftJoin(
        academicYearModel,
        eq(paperModel.academicYearId, academicYearModel.id),
      )
      .leftJoin(
        subjectTypeModel,
        eq(paperModel.subjectTypeId, subjectTypeModel.id),
      )
      .leftJoin(
        programCourseModel,
        eq(paperModel.programCourseId, programCourseModel.id),
      )
      .leftJoin(classModel, eq(paperModel.classId, classModel.id));

    countQuery = db
      .select({ total: countDistinct(paperModel.id) })
      .from(paperModel)
      .leftJoin(subjectModel, eq(paperModel.subjectId, subjectModel.id))
      .leftJoin(
        affiliationModel,
        eq(paperModel.affiliationId, affiliationModel.id),
      )
      .leftJoin(
        regulationTypeModel,
        eq(paperModel.regulationTypeId, regulationTypeModel.id),
      )
      .leftJoin(
        academicYearModel,
        eq(paperModel.academicYearId, academicYearModel.id),
      )
      .leftJoin(
        subjectTypeModel,
        eq(paperModel.subjectTypeId, subjectTypeModel.id),
      )
      .leftJoin(
        programCourseModel,
        eq(paperModel.programCourseId, programCourseModel.id),
      )
      .leftJoin(classModel, eq(paperModel.classId, classModel.id))
      .where(finalWhereClause as any);
  } else {
    // Ultra-fast query - NO JOINS when no search
    baseQuery = db.select().from(paperModel);

    countQuery = db
      .select({ total: countDistinct(paperModel.id) })
      .from(paperModel)
      .where(finalWhereClause as any);
  }

  // Execute count and data queries in parallel for better performance
  const [countResult, rows] = await Promise.all([
    countQuery,
    baseQuery
      .where(finalWhereClause as any)
      .orderBy(desc(paperModel.id))
      .limit(Math.max(1, pageSize))
      .offset((Math.max(1, page) - 1) * Math.max(1, pageSize)),
  ]);

  const [{ total }] = countResult;

  // Transform data using modelToDto to get proper components
  const content = (
    await Promise.all(
      rows.map(async (row) => {
        // Handle both joined and non-joined query results
        const paper = (row as any).papers || row;
        return await modelToDto(paper as Paper);
      }),
    )
  ).filter(Boolean) as PaperDto[];

  const totalElements = Number(total || 0);
  const totalPages = Math.max(
    1,
    Math.ceil(totalElements / Math.max(1, pageSize)),
  );

  return {
    content,
    page: Math.max(1, page),
    pageSize: Math.max(1, pageSize),
    totalPages,
    totalElements,
  };
}

export async function updatePaper(id: number, data: PaperDto) {
  const [updatedPaper] = await db
    .update(paperModel)
    .set({
      name: data.name,
      code: data.code,
      isOptional: data.isOptional,
      subjectId: data.subjectId,
      subjectTypeId: data.subjectTypeId,
      affiliationId: data.affiliationId,
      regulationTypeId: data.regulationTypeId,
      academicYearId: data.academicYearId,
      programCourseId: data.programCourseId,
      classId: data.classId,
      isActive: data.isActive,
      sequence: data.sequence,
      updatedAt: new Date(),
    })
    .where(eq(paperModel.id, id))
    .returning();

  return await modelToDto(updatedPaper);
}

export async function updatePaperWithComponents(
  id: number,
  data: Omit<PaperDto, "id" | "createdAt" | "updatedAt">,
) {
  console.log("Updating paper with components:", { id, data });
  console.log("Received data fields:", data);

  // Find the class ID based on semester name
  console.log("Looking for class with name:", data.classId);
  const [classRecord] = await db
    .select()
    .from(classModel)
    .where(eq(classModel.id, data.classId!));

  if (!classRecord) {
    throw new Error(`Class not found for class id: ${data.classId}`);
  }
  console.log("Found class record:", classRecord);

  // Update the paper with all the mapping data directly
  const [updatedPaper] = await db
    .update(paperModel)
    .set({
      name: data.name,
      code: data.code,
      isOptional: data.isOptional,
      subjectId: data.subjectId,
      affiliationId: data.affiliationId,
      regulationTypeId: data.regulationTypeId,
      academicYearId: data.academicYearId,
      subjectTypeId: data.subjectTypeId,
      programCourseId: data.programCourseId,
      classId: classRecord.id,
      isActive: data.isActive,
    })
    .where(eq(paperModel.id, id))
    .returning();

  console.log("Updated paper:", updatedPaper);

  // Delete existing paper components
  await db
    .delete(paperComponentModel)
    .where(eq(paperComponentModel.paperId, id));

  console.log("Deleted existing paper components");

  // Create new paper components
  const validComponents = data.components.filter(
    (component: any) => component?.fullMarks! > 0 || component?.credit! > 0,
  );

  console.log("Valid components to create:", validComponents);

  for (const componentData of validComponents) {
    await db.insert(paperComponentModel).values({
      paperId: id,
      examComponentId: componentData.examComponent.id!,
      fullMarks: componentData.fullMarks,
      credit: componentData.credit,
    });
  }

  console.log("Created new paper components");

  const result = {
    paper: updatedPaper,
    components: validComponents,
  };

  console.log("Final result:", result);
  return await modelToDto(updatedPaper);
}

export async function deletePaper(id: number) {
  const [deleted] = await db
    .delete(paperModel)
    .where(eq(paperModel.id, id))
    .returning();

  return await modelToDto(deleted);
}

export async function deletePaperSafe(id: number) {
  const [found] = await db
    .select()
    .from(paperModel)
    .where(eq(paperModel.id, id));
  if (!found) return null;

  const [{ mksMapCount }] = await db
    .select({ mksMapCount: countDistinct(marksheetPaperMappingModel.id) })
    .from(marksheetPaperMappingModel)
    .leftJoin(
      batchStudentPaperModel,
      eq(
        batchStudentPaperModel.id,
        marksheetPaperMappingModel.batchStudentPaperId,
      ),
    )
    .where(eq(batchStudentPaperModel.paperId, id));

  const [{ bspCount }] = await db
    .select({ bspCount: countDistinct(batchStudentPaperModel.id) })
    .from(batchStudentPaperModel)
    .where(eq(batchStudentPaperModel.paperId, id));

  const [{ topicCount }] = await db
    .select({ topicCount: countDistinct(topicModel.id) })
    .from(topicModel)
    .where(eq(topicModel.paperId, id));

  const [{ componentCount }] = await db
    .select({ componentCount: countDistinct(paperComponentModel.id) })
    .from(paperComponentModel)
    .where(eq(paperComponentModel.paperId, id));

  if (mksMapCount > 0 || bspCount > 0 || topicCount > 0 || componentCount > 0) {
    return {
      success: false,
      message: "Cannot delete paper. It is associated with other records.",
      records: [
        { count: mksMapCount, type: "Mks-paper-mapping" },
        { count: bspCount, type: "Batch-student-paper" },
        { count: componentCount, type: "Paper-component" },
        { count: topicCount, type: "Topic" },
      ],
    };
  }

  const [deleted] = await db
    .delete(paperModel)
    .where(eq(paperModel.id, id))
    .returning();
  if (deleted) {
    return {
      success: true,
      message: "Paper deleted successfully.",
      records: [],
    };
  }
  return { success: false, message: "Failed to delete paper.", records: [] };
}

export async function modelToDto(paper: Paper): Promise<PaperDto | null> {
  const components = await findPaperComponentsByPaperId(paper.id!);
  const topics = await getTopicsByPaperId(paper.id!);

  const subject = await getSubjectById(paper.subjectId as number);
  const affiliation = await findAffiliationById(paper.affiliationId as number);
  const regulationType = await findRegulationTypeById(
    paper.regulationTypeId as number,
  );
  const academicYear = await findAcademicYearById(
    paper.academicYearId as number,
  );
  const subjectType = await getSubjectTypeById(String(paper.subjectTypeId));
  const programCourse = await findProgramCourseById(
    paper.programCourseId as number,
  );
  const classRecord = await findClassById(paper.classId as number);

  if (
    !subject ||
    !affiliation ||
    !regulationType ||
    !academicYear ||
    !subjectType ||
    !programCourse ||
    !classRecord
  ) {
    return null;
  }

  return {
    ...paper,
    topics,
    components,
    subjectId: subject.id!,
    subjectTypeId: Number(subjectType.id!),
    affiliationId: affiliation.id!,
    regulationTypeId: regulationType.id!,
    academicYearId: academicYear.id!,
    programCourseId: programCourse.id!,
    classId: classRecord.id!,
  } as unknown as PaperDto;
}

export async function modelToDetailedDto(
  paper: Paper,
): Promise<PaperDetailedDto | null> {
  const components = await findPaperComponentsByPaperId(paper.id!);
  const topics = await getTopicsByPaperId(paper.id!);

  const subject = await getSubjectById(paper.subjectId as number);
  const affiliation = await findAffiliationById(paper.affiliationId as number);
  const regulationType = await findRegulationTypeById(
    paper.regulationTypeId as number,
  );
  const academicYear = await findAcademicYearById(
    paper.academicYearId as number,
  );
  const subjectType = await getSubjectTypeById(String(paper.subjectTypeId));
  const programCourse = await findProgramCourseById(
    paper.programCourseId as number,
  );
  const classRecord = await findClassById(paper.classId as number);

  if (
    !subject ||
    !affiliation ||
    !regulationType ||
    !academicYear ||
    !subjectType ||
    !programCourse ||
    !classRecord
  ) {
    return null;
  }

  return {
    ...paper,
    topics,
    components,
    subject,
    affiliation,
    regulationType,
    academicYear,
    subjectType,
    programCourse,
    class: classRecord,
  } as unknown as PaperDetailedDto;
}

// export const bulkUploadCourses = async (
//   filePath: string,
//   io?: any,
//   uploadSessionId?: string
// ): Promise<BulkUploadResult> => {
//   const result: BulkUploadResult = {
//     success: [],
//     errors: [],
//     summary: { total: 0, successful: 0, failed: 0 }
//   };
//   try {
//     const workbook = XLSX.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];
//     const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//     result.summary.total = data.length - 1;

//     for (let i = 1; i < data.length; i++) {
//       const row = data[i] as any[];
//       const rowNumber = i + 1;
//       try {
//         const paperData: Paper = {
//           name: row[0]?.toString()?.trim(),
//           code: row[7]?.toString()?.trim(),
//         };
//         if (!paperData.name) {
//           result.errors.push({ row: rowNumber, data: row, error: "Name is required" });
//           result.summary.failed++;
//           continue;
//         }
//         // Insert the paper
//         const [newPaper] = await db.insert(paperModel).values(paperData).returning();
//         result.success.push(newPaper);
//         result.summary.successful++;
//       } catch (error: unknown) {
//         console.error(`Error processing row ${rowNumber}:`, error);
//         result.errors.push({ row: rowNumber, data: row, error: error instanceof Error ? error.message : "Unknown error" });
//         result.summary.failed++;
//       }
//       if (io && uploadSessionId) {
//         io.to(uploadSessionId).emit("bulk-upload-progress", {
//           processed: i,
//           total: data.length - 1,
//           percent: Math.round((i / (data.length - 1)) * 100)
//         });
//       }
//     }
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//     if (io && uploadSessionId) {
//       if (result.errors.length > 0) {
//         io.to(uploadSessionId).emit("bulk-upload-failed", { errorCount: result.errors.length });
//       } else {
//         io.to(uploadSessionId).emit("bulk-upload-done", { successCount: result.success.length });
//       }
//     }
//     return result;
//   } catch (error: unknown) {
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//     throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
//   }
// };
