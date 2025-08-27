'use server';

import { findStudentByUid } from "@/lib/services/student.service";
import { findBatchesByStudentUid } from "@/lib/services/batch.service";
import { BatchCustom } from "@/types/academics/batch";
import { Student } from "@/types/academics/student";

/**
 * Fetches a student's data by their UID
 */
export async function getStudentByUid(uid: string): Promise<Student | null> {
    try {
        console.log("Server action: Getting student for UID", uid);
        const student = await findStudentByUid(uid);
        return student;
    } catch (error) {
        console.error("Error in getStudentByUid server action:", error);
        return null;
    }
}

/**
 * Fetches a student's batches by their UID
 */
export async function getStudentBatches(uid: string): Promise<BatchCustom[]> {
    try {
        console.log("Server action: Getting batches for UID", uid);
        const batches = await findBatchesByStudentUid(uid);
        return batches || [];
    } catch (error) {
        console.error("Error in getStudentBatches server action:", error);
        return [];
    }
}

/**
 * Fetches both student data and batches in one call
 */
export async function getStudentData(uid: string): Promise<{ student: Student | null, batches: BatchCustom[] }> {
    try {
        const [student, batches] = await Promise.all([
            getStudentByUid(uid),
            getStudentBatches(uid)
        ]);

        return { student, batches };
    } catch (error) {
        console.error("Error in getStudentData server action:", error);
        return { student: null, batches: [] };
    }
} 