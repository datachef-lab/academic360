import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { Student, studentModel } from "../models/student.model.ts";

export async function getStudentById(id: number): Promise<Student | undefined> {
    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.id, id));
    return foundStudent;
}

export async function getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.userId, userId));
    return foundStudent;
}