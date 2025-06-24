import { db } from "@/db";
import { studentFeesMappingModel, StudentFeesMapping } from "../models/student-fees-mapping.model";

import { eq } from "drizzle-orm";

export const getStudentFeesMappings = async () => {
    try {
        const studentFeesMappings = await db.select().from(studentFeesMappingModel);
        return studentFeesMappings;
    } catch (error) {
        return null;
    }
};

export const getStudentFeesMappingById = async (id: number) => {
    try {
        const studentFeesMapping = await db.select().from(studentFeesMappingModel).where(eq(studentFeesMappingModel.id, id));
        return studentFeesMapping[0];
    } catch (error) {
        return null;
    }
};

export const createStudentFeesMapping = async (studentFeesMapping: StudentFeesMapping) => {
    try {
        const newStudentFeesMapping = await db.insert(studentFeesMappingModel).values(studentFeesMapping).returning();
        return newStudentFeesMapping[0];
    } catch (error) {
        return null;
    }
};

export const updateStudentFeesMapping = async (id: number, studentFeesMapping: StudentFeesMapping) => {
    try {
        const updatedStudentFeesMapping = await db.update(studentFeesMappingModel).set(studentFeesMapping).where(eq(studentFeesMappingModel.id, id)).returning();
        return updatedStudentFeesMapping[0];
    } catch (error) {
        return null;
    }
};

export const deleteStudentFeesMapping = async (id: number) => {
    try {
        const deletedStudentFeesMapping = await db.delete(studentFeesMappingModel).where(eq(studentFeesMappingModel.id, id)).returning();
        return deletedStudentFeesMapping[0];
    } catch (error) {
        return null;
    }
};
