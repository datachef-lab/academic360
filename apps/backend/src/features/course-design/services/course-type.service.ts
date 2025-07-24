import { db } from "@/db/index.js";
import { courseTypeModel, createCourseTypeModel, CourseType } from "@/features/course-design/models/course-type.model.js";
import { eq } from "drizzle-orm";

export async function createCourseType(data: Omit<CourseType, 'id' | 'createdAt' | 'updatedAt'>) {
    const validated = createCourseTypeModel.parse(data);
    const [created] = await db.insert(courseTypeModel).values(validated).returning();
    return created;
}

export async function getCourseTypeById(id: number) {
    const [courseType] = await db.select().from(courseTypeModel).where(eq(courseTypeModel.id, id));
    return courseType;
}

export async function getAllCourseTypes() {
    return db.select().from(courseTypeModel);
}

export async function updateCourseType(id: number, data: Partial<CourseType>) {
    const { createdAt, updatedAt, ...rest } = data;
    const validated = createCourseTypeModel.partial().parse(rest);
    const [updated] = await db.update(courseTypeModel).set(validated).where(eq(courseTypeModel.id, id)).returning();
    return updated;
}

export async function deleteCourseType(id: number) {
    const [deleted] = await db.delete(courseTypeModel).where(eq(courseTypeModel.id, id)).returning();
    return deleted;
} 
