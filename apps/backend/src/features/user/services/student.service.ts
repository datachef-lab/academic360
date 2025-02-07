import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { Student, studentModel } from "../models/student.model.js";

export async function getStudentById(id: number): Promise<Student | undefined> {
    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.id, id));
    return foundStudent;
}

export async function getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.userId, userId));
    return foundStudent;
}