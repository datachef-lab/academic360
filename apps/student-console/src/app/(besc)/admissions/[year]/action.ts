"use server";

import { db, dbPostgres } from "@/db";
import { AdmissionCourse, admissionCourses, courses } from "@/db/schema";
import { findAllCourse } from "@/lib/services/course.service";
import { and, eq } from "drizzle-orm";

export async function getCourses() {
    return await dbPostgres.select().from(courses);
}

export async function getAdmissionCourses(admissionId: number): Promise<AdmissionCourse[]> {
    return await dbPostgres
        .select()
        .from(admissionCourses)
        .where(
            and(
                eq(admissionCourses.admissionId, admissionId),
                eq(admissionCourses.disabled, false),
                eq(admissionCourses.isClosed, false),
            )
        )
}