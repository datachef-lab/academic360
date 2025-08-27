"use server";

import { Course } from "@/db/schema";
import { findAdmissionById } from "@/lib/services/admission.service";
import { findAllDbCourses } from "@/lib/services/course.service";
import { AdmissionDto } from "@/types/admissions";

export async function getCourses(): Promise<{courses: Course[], totalCount: number}> {
    return await findAllDbCourses(1, 1000);
}

export async function getAdmission(id: number): Promise<AdmissionDto | null> {
    return await findAdmissionById(id);
}

