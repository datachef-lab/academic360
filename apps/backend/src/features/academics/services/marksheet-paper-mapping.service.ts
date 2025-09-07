import { db } from "@/db/index.js";
import { marksheetPaperMappingModel } from "@repo/db/schemas/models/academics";
import { marksheetModel } from "@repo/db/schemas/models/academics";
import { batchStudentPaperModel } from "@repo/db/schemas/models/course-design";
import { eq, and, desc, count } from "drizzle-orm";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";

export interface MarksheetPaperMappingFilters {
  page?: number;
  pageSize?: number;
  marksheetId?: number;
  batchStudentPaperId?: number;
}

export interface MarksheetPaperMappingWithRelations {
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
  marksheet: {
    id: number;
    studentId: number;
    classId: number;
    year: number;
    sgpa: string | null;
    cgpa: string | null;
    classification: string | null;
    remarks: string | null;
    source: string | null;
    file: string | null;
    createdByUserId: number;
    updatedByUserId: number;
    createdAt: Date;
    updatedAt: Date;
  };
  batchStudentPaper: {
    id: number;
    batchStudentMappingId: number;
    paperId: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Create a new marksheet-paper mapping
export const createMarksheetPaperMapping = async (data: {
  marksheetId: number;
  batchStudentPaperId: number;
  yearOfAppearanceId: number;
  yearOfPassingId?: number;
  totalCreditObtained?: number;
  totalMarksObtained?: number;
  tgp?: number;
  ngp?: number;
  letterGrade?: string;
  status?: string;
}): Promise<MarksheetPaperMappingWithRelations> => {
  const [mapping] = await db
    .insert(marksheetPaperMappingModel)
    .values(data)
    .returning();

  // Fetch the created mapping with relations
  const [result] = await db
    .select({
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
      marksheet: {
        id: marksheetModel.id,
        studentId: marksheetModel.studentId,
        classId: marksheetModel.classId,
        year: marksheetModel.year,
        sgpa: marksheetModel.sgpa,
        cgpa: marksheetModel.cgpa,
        classification: marksheetModel.classification,
        remarks: marksheetModel.remarks,
        source: marksheetModel.source,
        file: marksheetModel.file,
        createdByUserId: marksheetModel.createdByUserId,
        updatedByUserId: marksheetModel.updatedByUserId,
        createdAt: marksheetModel.createdAt,
        updatedAt: marksheetModel.updatedAt,
      },
      batchStudentPaper: {
        id: batchStudentPaperModel.id,
        batchStudentMappingId: batchStudentPaperModel.batchStudentMappingId,
        paperId: batchStudentPaperModel.paperId,
        createdAt: batchStudentPaperModel.createdAt,
        updatedAt: batchStudentPaperModel.updatedAt,
      },
    })
    .from(marksheetPaperMappingModel)
    .innerJoin(
      marksheetModel,
      eq(marksheetPaperMappingModel.marksheetId, marksheetModel.id),
    )
    .innerJoin(
      batchStudentPaperModel,
      eq(
        marksheetPaperMappingModel.batchStudentPaperId,
        batchStudentPaperModel.id,
      ),
    )
    .where(eq(marksheetPaperMappingModel.id, mapping.id));

  return result;
};

// Get all marksheet-paper mappings with pagination and filters
export const getAllMarksheetPaperMappings = async (
  filters: MarksheetPaperMappingFilters = {},
): Promise<PaginatedResponse<MarksheetPaperMappingWithRelations>> => {
  const { page = 1, pageSize = 10, marksheetId, batchStudentPaperId } = filters;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const whereConditions = [];
  if (marksheetId) {
    whereConditions.push(
      eq(marksheetPaperMappingModel.marksheetId, marksheetId),
    );
  }
  if (batchStudentPaperId) {
    whereConditions.push(
      eq(marksheetPaperMappingModel.batchStudentPaperId, batchStudentPaperId),
    );
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const [{ totalElements }] = await db
    .select({ totalElements: count() })
    .from(marksheetPaperMappingModel)
    .where(whereClause);

  // Get paginated results
  const results = await db
    .select({
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
      marksheet: {
        id: marksheetModel.id,
        studentId: marksheetModel.studentId,
        classId: marksheetModel.classId,
        year: marksheetModel.year,
        sgpa: marksheetModel.sgpa,
        cgpa: marksheetModel.cgpa,
        classification: marksheetModel.classification,
        remarks: marksheetModel.remarks,
        source: marksheetModel.source,
        file: marksheetModel.file,
        createdByUserId: marksheetModel.createdByUserId,
        updatedByUserId: marksheetModel.updatedByUserId,
        createdAt: marksheetModel.createdAt,
        updatedAt: marksheetModel.updatedAt,
      },
      batchStudentPaper: {
        id: batchStudentPaperModel.id,
        batchStudentMappingId: batchStudentPaperModel.batchStudentMappingId,
        paperId: batchStudentPaperModel.paperId,
        createdAt: batchStudentPaperModel.createdAt,
        updatedAt: batchStudentPaperModel.updatedAt,
      },
    })
    .from(marksheetPaperMappingModel)
    .innerJoin(
      marksheetModel,
      eq(marksheetPaperMappingModel.marksheetId, marksheetModel.id),
    )
    .innerJoin(
      batchStudentPaperModel,
      eq(
        marksheetPaperMappingModel.batchStudentPaperId,
        batchStudentPaperModel.id,
      ),
    )
    .where(whereClause)
    .orderBy(desc(marksheetPaperMappingModel.createdAt))
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

// Get marksheet-paper mapping by ID
export const getMarksheetPaperMappingById = async (
  id: number,
): Promise<MarksheetPaperMappingWithRelations | null> => {
  const [result] = await db
    .select({
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
      marksheet: {
        id: marksheetModel.id,
        studentId: marksheetModel.studentId,
        classId: marksheetModel.classId,
        year: marksheetModel.year,
        sgpa: marksheetModel.sgpa,
        cgpa: marksheetModel.cgpa,
        classification: marksheetModel.classification,
        remarks: marksheetModel.remarks,
        source: marksheetModel.source,
        file: marksheetModel.file,
        createdByUserId: marksheetModel.createdByUserId,
        updatedByUserId: marksheetModel.updatedByUserId,
        createdAt: marksheetModel.createdAt,
        updatedAt: marksheetModel.updatedAt,
      },
      batchStudentPaper: {
        id: batchStudentPaperModel.id,
        batchStudentMappingId: batchStudentPaperModel.batchStudentMappingId,
        paperId: batchStudentPaperModel.paperId,
        createdAt: batchStudentPaperModel.createdAt,
        updatedAt: batchStudentPaperModel.updatedAt,
      },
    })
    .from(marksheetPaperMappingModel)
    .innerJoin(
      marksheetModel,
      eq(marksheetPaperMappingModel.marksheetId, marksheetModel.id),
    )
    .innerJoin(
      batchStudentPaperModel,
      eq(
        marksheetPaperMappingModel.batchStudentPaperId,
        batchStudentPaperModel.id,
      ),
    )
    .where(eq(marksheetPaperMappingModel.id, id));

  return result || null;
};

// Update marksheet-paper mapping
export const updateMarksheetPaperMapping = async (
  id: number,
  data: Partial<{
    marksheetId: number;
    batchStudentPaperId: number;
    yearOfAppearanceId: number;
    yearOfPassingId: number;
    totalCreditObtained: number;
    totalMarksObtained: number;
    tgp: number;
    ngp: number;
    letterGrade: string;
    status: string;
  }>,
): Promise<MarksheetPaperMappingWithRelations | null> => {
  const [updated] = await db
    .update(marksheetPaperMappingModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(marksheetPaperMappingModel.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  // Fetch the updated mapping with relations
  return await getMarksheetPaperMappingById(id);
};

// Delete marksheet-paper mapping
export const deleteMarksheetPaperMapping = async (
  id: number,
): Promise<boolean> => {
  const [deleted] = await db
    .delete(marksheetPaperMappingModel)
    .where(eq(marksheetPaperMappingModel.id, id))
    .returning();

  return !!deleted;
};

// Get marksheet-paper mappings by marksheet ID
export const getMarksheetPaperMappingsByMarksheetId = async (
  marksheetId: number,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 10 },
): Promise<PaginatedResponse<MarksheetPaperMappingWithRelations>> => {
  return getAllMarksheetPaperMappings({
    ...pagination,
    marksheetId,
  });
};
