import { db } from "@/db/index.js";
import { marksheetPaperComponentMappingModel } from "@repo/db/schemas/models/academics";
import { marksheetPaperMappingModel } from "@repo/db/schemas/models/academics";
import { paperComponentModel } from "@repo/db/schemas/models/course-design";
import { eq, and, desc, count } from "drizzle-orm";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";

export interface MarksheetPaperComponentMappingFilters {
  page?: number;
  pageSize?: number;
  marksheetPaperMappingId?: number;
  paperComponentId?: number;
}

export interface MarksheetPaperComponentMappingWithRelations {
  id: number;
  marksheetPaperMappingId: number;
  paperComponentId: number;
  marksObtained: number | null;
  creditObtained: number | null;
  createdAt: Date;
  updatedAt: Date;
  marksheetPaperMapping: {
    id: number;
    marksheetId: number;
    batchStudentPaperId: number;
    yearOfAppearanceId: number;
    yearOfPassingId: number | null;
    totalCreditObtained: number | null;
    totalMarksObtained: number | null;
    tgp: number | null;
    ngp: number | null;
    letterGrade: string | null;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  paperComponent: {
    id: number;
    paperId: number;
    examComponentId: number;
    fullMarks: number;
    credit: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Create a new marksheet-paper-component mapping
export const createMarksheetPaperComponentMapping = async (data: {
  marksheetPaperMappingId: number;
  paperComponentId: number;
  marksObtained?: number;
  creditObtained?: number;
}): Promise<MarksheetPaperComponentMappingWithRelations> => {
  const [mapping] = await db
    .insert(marksheetPaperComponentMappingModel)
    .values(data)
    .returning();

  // Fetch the created mapping with relations
  const [result] = await db
    .select({
      id: marksheetPaperComponentMappingModel.id,
      marksheetPaperMappingId:
        marksheetPaperComponentMappingModel.marksheetPaperMappingId,
      paperComponentId: marksheetPaperComponentMappingModel.paperComponentId,
      marksObtained: marksheetPaperComponentMappingModel.marksObtained,
      creditObtained: marksheetPaperComponentMappingModel.creditObtained,
      createdAt: marksheetPaperComponentMappingModel.createdAt,
      updatedAt: marksheetPaperComponentMappingModel.updatedAt,
      marksheetPaperMapping: {
        id: marksheetPaperMappingModel.id,
        marksheetId: marksheetPaperMappingModel.marksheetId,
        batchStudentPaperId: marksheetPaperMappingModel.batchStudentPaperId,
        yearOfAppearanceId: marksheetPaperMappingModel.yearOfAppearanceId,
        yearOfPassingId: marksheetPaperMappingModel.yearOfPassingId,
        totalCreditObtained: marksheetPaperMappingModel.totalCreditObtained,
        totalMarksObtained: marksheetPaperMappingModel.totalMarksObtained,
        tgp: marksheetPaperMappingModel.tgp,
        ngp: marksheetPaperMappingModel.ngp,
        letterGrade: marksheetPaperMappingModel.letterGrade,
        status: marksheetPaperMappingModel.status,
        createdAt: marksheetPaperMappingModel.createdAt,
        updatedAt: marksheetPaperMappingModel.updatedAt,
      },
      paperComponent: {
        id: paperComponentModel.id,
        paperId: paperComponentModel.paperId,
        examComponentId: paperComponentModel.examComponentId,
        fullMarks: paperComponentModel.fullMarks,
        credit: paperComponentModel.credit,
        createdAt: paperComponentModel.createdAt,
        updatedAt: paperComponentModel.updatedAt,
      },
    })
    .from(marksheetPaperComponentMappingModel)
    .innerJoin(
      marksheetPaperMappingModel,
      eq(
        marksheetPaperComponentMappingModel.marksheetPaperMappingId,
        marksheetPaperMappingModel.id,
      ),
    )
    .innerJoin(
      paperComponentModel,
      eq(
        marksheetPaperComponentMappingModel.paperComponentId,
        paperComponentModel.id,
      ),
    )
    .where(eq(marksheetPaperComponentMappingModel.id, mapping.id));

  return result;
};

// Get all marksheet-paper-component mappings with pagination and filters
export const getAllMarksheetPaperComponentMappings = async (
  filters: MarksheetPaperComponentMappingFilters = {},
): Promise<PaginatedResponse<MarksheetPaperComponentMappingWithRelations>> => {
  const {
    page = 1,
    pageSize = 10,
    marksheetPaperMappingId,
    paperComponentId,
  } = filters;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const whereConditions = [];
  if (marksheetPaperMappingId) {
    whereConditions.push(
      eq(
        marksheetPaperComponentMappingModel.marksheetPaperMappingId,
        marksheetPaperMappingId,
      ),
    );
  }
  if (paperComponentId) {
    whereConditions.push(
      eq(
        marksheetPaperComponentMappingModel.paperComponentId,
        paperComponentId,
      ),
    );
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const [{ totalElements }] = await db
    .select({ totalElements: count() })
    .from(marksheetPaperComponentMappingModel)
    .where(whereClause);

  // Get paginated results
  const results = await db
    .select({
      id: marksheetPaperComponentMappingModel.id,
      marksheetPaperMappingId:
        marksheetPaperComponentMappingModel.marksheetPaperMappingId,
      paperComponentId: marksheetPaperComponentMappingModel.paperComponentId,
      marksObtained: marksheetPaperComponentMappingModel.marksObtained,
      creditObtained: marksheetPaperComponentMappingModel.creditObtained,
      createdAt: marksheetPaperComponentMappingModel.createdAt,
      updatedAt: marksheetPaperComponentMappingModel.updatedAt,
      marksheetPaperMapping: {
        id: marksheetPaperMappingModel.id,
        marksheetId: marksheetPaperMappingModel.marksheetId,
        batchStudentPaperId: marksheetPaperMappingModel.batchStudentPaperId,
        yearOfAppearanceId: marksheetPaperMappingModel.yearOfAppearanceId,
        yearOfPassingId: marksheetPaperMappingModel.yearOfPassingId,
        totalCreditObtained: marksheetPaperMappingModel.totalCreditObtained,
        totalMarksObtained: marksheetPaperMappingModel.totalMarksObtained,
        tgp: marksheetPaperMappingModel.tgp,
        ngp: marksheetPaperMappingModel.ngp,
        letterGrade: marksheetPaperMappingModel.letterGrade,
        status: marksheetPaperMappingModel.status,
        createdAt: marksheetPaperMappingModel.createdAt,
        updatedAt: marksheetPaperMappingModel.updatedAt,
      },
      paperComponent: {
        id: paperComponentModel.id,
        paperId: paperComponentModel.paperId,
        examComponentId: paperComponentModel.examComponentId,
        fullMarks: paperComponentModel.fullMarks,
        credit: paperComponentModel.credit,
        createdAt: paperComponentModel.createdAt,
        updatedAt: paperComponentModel.updatedAt,
      },
    })
    .from(marksheetPaperComponentMappingModel)
    .innerJoin(
      marksheetPaperMappingModel,
      eq(
        marksheetPaperComponentMappingModel.marksheetPaperMappingId,
        marksheetPaperMappingModel.id,
      ),
    )
    .innerJoin(
      paperComponentModel,
      eq(
        marksheetPaperComponentMappingModel.paperComponentId,
        paperComponentModel.id,
      ),
    )
    .where(whereClause)
    .orderBy(desc(marksheetPaperComponentMappingModel.createdAt))
    .limit(pageSize)
    .offset(offset);
  return {
    content: results,
    page,
    pageSize,
    totalPages: Math.ceil(totalElements / pageSize),
    totalElements,
  };
};

// Get marksheet-paper-component mapping by ID
export const getMarksheetPaperComponentMappingById = async (
  id: number,
): Promise<MarksheetPaperComponentMappingWithRelations | null> => {
  const [result] = await db
    .select({
      id: marksheetPaperComponentMappingModel.id,
      marksheetPaperMappingId:
        marksheetPaperComponentMappingModel.marksheetPaperMappingId,
      paperComponentId: marksheetPaperComponentMappingModel.paperComponentId,
      marksObtained: marksheetPaperComponentMappingModel.marksObtained,
      creditObtained: marksheetPaperComponentMappingModel.creditObtained,
      createdAt: marksheetPaperComponentMappingModel.createdAt,
      updatedAt: marksheetPaperComponentMappingModel.updatedAt,
      marksheetPaperMapping: {
        id: marksheetPaperMappingModel.id,
        marksheetId: marksheetPaperMappingModel.marksheetId,
        batchStudentPaperId: marksheetPaperMappingModel.batchStudentPaperId,
        yearOfAppearanceId: marksheetPaperMappingModel.yearOfAppearanceId,
        yearOfPassingId: marksheetPaperMappingModel.yearOfPassingId,
        totalCreditObtained: marksheetPaperMappingModel.totalCreditObtained,
        totalMarksObtained: marksheetPaperMappingModel.totalMarksObtained,
        tgp: marksheetPaperMappingModel.tgp,
        ngp: marksheetPaperMappingModel.ngp,
        letterGrade: marksheetPaperMappingModel.letterGrade,
        status: marksheetPaperMappingModel.status,
        createdAt: marksheetPaperMappingModel.createdAt,
        updatedAt: marksheetPaperMappingModel.updatedAt,
      },
      paperComponent: {
        id: paperComponentModel.id,
        paperId: paperComponentModel.paperId,
        examComponentId: paperComponentModel.examComponentId,
        fullMarks: paperComponentModel.fullMarks,
        credit: paperComponentModel.credit,
        createdAt: paperComponentModel.createdAt,
        updatedAt: paperComponentModel.updatedAt,
      },
    })
    .from(marksheetPaperComponentMappingModel)
    .innerJoin(
      marksheetPaperMappingModel,
      eq(
        marksheetPaperComponentMappingModel.marksheetPaperMappingId,
        marksheetPaperMappingModel.id,
      ),
    )
    .innerJoin(
      paperComponentModel,
      eq(
        marksheetPaperComponentMappingModel.paperComponentId,
        paperComponentModel.id,
      ),
    )
    .where(eq(marksheetPaperComponentMappingModel.id, id));

  return result || null;
};

// Update marksheet-paper-component mapping
export const updateMarksheetPaperComponentMapping = async (
  id: number,
  data: Partial<{
    marksheetPaperMappingId: number;
    paperComponentId: number;
    marksObtained: number;
    creditObtained: number;
  }>,
): Promise<MarksheetPaperComponentMappingWithRelations | null> => {
  const [updated] = await db
    .update(marksheetPaperComponentMappingModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(marksheetPaperComponentMappingModel.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  // Fetch the updated mapping with relations
  return await getMarksheetPaperComponentMappingById(id);
};

// Delete marksheet-paper-component mapping
export const deleteMarksheetPaperComponentMapping = async (
  id: number,
): Promise<boolean> => {
  const [deleted] = await db
    .delete(marksheetPaperComponentMappingModel)
    .where(eq(marksheetPaperComponentMappingModel.id, id))
    .returning();

  return !!deleted;
};

// Get marksheet-paper-component mappings by marksheet-paper-mapping ID
export const getMarksheetPaperComponentMappingsByMarksheetPaperMappingId =
  async (
    marksheetPaperMappingId: number,
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 10 },
  ): Promise<
    PaginatedResponse<MarksheetPaperComponentMappingWithRelations>
  > => {
    return getAllMarksheetPaperComponentMappings({
      ...pagination,
      marksheetPaperMappingId,
    });
  };
