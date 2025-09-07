import { db } from "@/db/index.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse";
import { batchStudentMappingModel } from "@repo/db/schemas/models/academics";
import { batchModel } from "@repo/db/schemas/models/academics";
import { studentModel } from "@repo/db/schemas/models/user";
import { userModel } from "@repo/db/schemas/models/user";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";


export interface BatchStudentMappingFilters {
    page?: number;
    pageSize?: number;
    batchId?: number;
    studentId?: number;
}

export interface BatchStudentMappingWithRelations {
    id: number;
    batchId: number;
    studentId: number;
    createdAt: Date;
    updatedAt: Date;
    batch: {
        id: number;
        programCourseId: number;
        classId: number;
        sectionId: number | null;
        shiftId: number | null;
        sessionId: number | null;
        createdAt: Date;
        updatedAt: Date;
    };
    student: {
        id: number;
        name: string;
        email: string;
        // Add other student fields as needed
    };
}

// Create a new batch-student mapping
export const createBatchStudentMapping = async (data: {
    batchId: number;
    studentId: number;
}): Promise<BatchStudentMappingWithRelations> => {
    const [mapping] = await db
        .insert(batchStudentMappingModel)
        .values(data)
        .returning();

    // Fetch the created mapping with relations
    const [result] = await db
        .select({
            id: batchStudentMappingModel.id,
            batchId: batchStudentMappingModel.batchId,
            studentId: batchStudentMappingModel.studentId,
            createdAt: batchStudentMappingModel.createdAt,
            updatedAt: batchStudentMappingModel.updatedAt,
            batch: {
                id: batchModel.id,
                programCourseId: batchModel.programCourseId,
                classId: batchModel.classId,
                sectionId: batchModel.sectionId,
                shiftId: batchModel.shiftId,
                sessionId: batchModel.sessionId,
                createdAt: batchModel.createdAt,
                updatedAt: batchModel.updatedAt,
            },
            student: {
                id: studentModel.id,
                name: userModel.name,
                email: userModel.email,
            },
        })
        .from(batchStudentMappingModel)
        .innerJoin(batchModel, eq(batchStudentMappingModel.batchId, batchModel.id))
        .innerJoin(
            studentModel,
            eq(batchStudentMappingModel.studentId, studentModel.id),
        )
        .innerJoin(userModel, eq(studentModel.userId, userModel.id))
        .where(eq(batchStudentMappingModel.id, mapping.id));

    return result;
};

// Get all batch-student mappings with pagination and filters
export const getAllBatchStudentMappings = async (
    filters: BatchStudentMappingFilters = {},
): Promise<PaginatedResponse<BatchStudentMappingWithRelations>> => {
    const { page = 1, pageSize = 10, batchId, studentId } = filters;
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions = [];
    if (batchId) {
        whereConditions.push(eq(batchStudentMappingModel.batchId, batchId));
    }
    if (studentId) {
        whereConditions.push(eq(batchStudentMappingModel.studentId, studentId));
    }

    const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ totalElements }] = await db
        .select({ totalElements: count() })
        .from(batchStudentMappingModel)
        .where(whereClause);

    // Get paginated results
    const results = await db
        .select({
            id: batchStudentMappingModel.id,
            batchId: batchStudentMappingModel.batchId,
            studentId: batchStudentMappingModel.studentId,
            createdAt: batchStudentMappingModel.createdAt,
            updatedAt: batchStudentMappingModel.updatedAt,
            batch: {
                id: batchModel.id,
                programCourseId: batchModel.programCourseId,
                classId: batchModel.classId,
                sectionId: batchModel.sectionId,
                shiftId: batchModel.shiftId,
                sessionId: batchModel.sessionId,
                createdAt: batchModel.createdAt,
                updatedAt: batchModel.updatedAt,
            },
            student: {
                id: studentModel.id,
                name: userModel.name,
                email: userModel.email,
            },
        })
        .from(batchStudentMappingModel)
        .innerJoin(batchModel, eq(batchStudentMappingModel.batchId, batchModel.id))
        .innerJoin(
            studentModel,
            eq(batchStudentMappingModel.studentId, studentModel.id),
        )
        .innerJoin(userModel, eq(studentModel.userId, userModel.id))
        .where(whereClause)
        .orderBy(desc(batchStudentMappingModel.createdAt))
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

// Get batch-student mapping by ID
export const getBatchStudentMappingById = async (
    id: number,
): Promise<BatchStudentMappingWithRelations | null> => {
    const [result] = await db
        .select({
            id: batchStudentMappingModel.id,
            batchId: batchStudentMappingModel.batchId,
            studentId: batchStudentMappingModel.studentId,
            createdAt: batchStudentMappingModel.createdAt,
            updatedAt: batchStudentMappingModel.updatedAt,
            batch: {
                id: batchModel.id,
                programCourseId: batchModel.programCourseId,
                classId: batchModel.classId,
                sectionId: batchModel.sectionId,
                shiftId: batchModel.shiftId,
                sessionId: batchModel.sessionId,
                createdAt: batchModel.createdAt,
                updatedAt: batchModel.updatedAt,
            },
            student: {
                id: studentModel.id,
                name: userModel.name,
                email: userModel.email,
            },
        })
        .from(batchStudentMappingModel)
        .innerJoin(batchModel, eq(batchStudentMappingModel.batchId, batchModel.id))
        .innerJoin(
            studentModel,
            eq(batchStudentMappingModel.studentId, studentModel.id),
        )
        .innerJoin(userModel, eq(studentModel.userId, userModel.id))
        .where(eq(batchStudentMappingModel.id, id));

    return result || null;
};

// Update batch-student mapping
export const updateBatchStudentMapping = async (
    id: number,
    data: Partial<{
        batchId: number;
        studentId: number;
    }>,
): Promise<BatchStudentMappingWithRelations | null> => {
    const [updated] = await db
        .update(batchStudentMappingModel)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(batchStudentMappingModel.id, id))
        .returning();

    if (!updated) {
        return null;
    }

    // Fetch the updated mapping with relations
    return await getBatchStudentMappingById(id);
};

// Delete batch-student mapping
export const deleteBatchStudentMapping = async (
    id: number,
): Promise<boolean> => {
    const [deleted] = await db
        .delete(batchStudentMappingModel)
        .where(eq(batchStudentMappingModel.id, id))
        .returning();

    return !!deleted;
};

// Get batch-student mappings by batch ID
export const getBatchStudentMappingsByBatchId = async (
    batchId: number,
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 10 },
): Promise<PaginatedResponse<BatchStudentMappingWithRelations>> => {
    return getAllBatchStudentMappings({
        ...pagination,
        batchId,
    });
};

// Get batch-student mappings by student ID
export const getBatchStudentMappingsByStudentId = async (
    studentId: number,
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 10 },
): Promise<PaginatedResponse<BatchStudentMappingWithRelations>> => {
    return getAllBatchStudentMappings({
        ...pagination,
        studentId,
    });
};
