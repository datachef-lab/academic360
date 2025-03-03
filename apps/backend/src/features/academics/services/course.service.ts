import { db } from "@/db/index.js";
import { CourseType } from "@/types/academics/course.js";
import { Course, courseModel } from "../models/course.model.js";
import { eq } from "drizzle-orm";
import { StreamType } from "@/types/academics/stream.js";
import { findStreamById } from "./stream.service.js";


export async function findCourseById(id: number): Promise<CourseType | null> {
    const [foundCourse] = await db
        .select()
        .from(courseModel)
        .where(eq(courseModel.id, id));

    const formattedCourse = await courseFormatResponse(foundCourse);

    return formattedCourse;
}

export async function courseFormatResponse(course: Course | null): Promise<CourseType | null> {
    if (!course) {
        return null;
    }

    const { streamId, ...props } = course;

    let stream: StreamType | null = null;
    if (streamId) {
        stream = await findStreamById(streamId);
    }

    return {
        ...props,
        stream,
    }
}
