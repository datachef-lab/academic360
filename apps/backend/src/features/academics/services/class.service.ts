import { db } from "@/db/index.js";
import { classModel } from "@repo/db/schemas/models/academics";
import { and, eq } from "drizzle-orm";
// import { classTypeEnum } from "@/features/user/models/helper";

import type { Class } from "@repo/db/schemas/models/academics";

const defaultClasses: Class[] = [
  { name: "SEMESTER I", type: "SEMESTER" },
  { name: "SEMESTER II", type: "SEMESTER" },
  { name: "SEMESTER III", type: "SEMESTER" },
  { name: "SEMESTER IV", type: "SEMESTER" },
  { name: "SEMESTER V", type: "SEMESTER" },
  { name: "SEMESTER VI", type: "SEMESTER" },
  { name: "SEMESTER VII", type: "SEMESTER" },
  { name: "SEMESTER VIII", type: "SEMESTER" },
];

export async function initializeClasses() {
  for (const cls of defaultClasses) {
    const existingClass = await db
      .select()
      .from(classModel)
      .where(eq(classModel.name, cls.name));
    if (existingClass.length === 0) {
      await db.insert(classModel).values(cls).returning();
    }
  }
}

export async function processClassBySemesterNumber(semester: number) {
  console.log("semester in class: ", semester);
  let className: string | undefined;
  switch (semester) {
    case 1:
      className = "SEMESTER I";
      break;
    case 2:
      className = "SEMESTER II";
      break;
    case 3:
      className = "SEMESTER III";
      break;
    case 4:
      className = "SEMESTER IV";
      break;
    case 5:
      className = "SEMESTER V";
      break;
    case 6:
      className = "SEMESTER VI";
      break;

    case 7:
      className = "SEMESTER VII";
      break;
    case 8:
      className = "SEMESTER VIII";
      break;
    default:
      className = undefined;
  }

  if (!className) throw Error("No Class found");

  const [existingClass] = await db
    .select()
    .from(classModel)
    .where(
      and(eq(classModel.name, className), eq(classModel.type, "SEMESTER")),
    );

  if (existingClass) return existingClass;

  return (
    await db
      .insert(classModel)
      .values({ name: className, type: "SEMESTER" })
      .returning()
  )[0];
}

export async function findSemesterNumberbyClassId(id: number) {
  let foundClass = await findClassById(id);

  if (foundClass.type !== "SEMESTER") throw Error("Invalid Semester!");

  switch (foundClass.name) {
    case "SEMESTER I":
      return 1;
    case "SEMESTER II":
      return 2;
    case "SEMESTER III":
      return 3;
    case "SEMESTER IV":
      return 4;
    case "SEMESTER V":
      return 5;
    case "SEMESTER VI":
      return 6;
    case "SEMESTER VII":
      return 7;
    case "SEMESTER VIII":
      return 8;
  }
}

export async function findClassById(id: number) {
  return (await db.select().from(classModel).where(eq(classModel.id, id)))[0];
}

// --- CRUD Service Functions ---

// Create a new class
export async function createClass(
  data: Omit<Class, "id" | "createdAt" | "updatedAt">,
) {
  const [newClass] = await db.insert(classModel).values(data).returning();
  return newClass;
}

// Get all classes
export async function getAllClasses() {
  return await db.select().from(classModel);
}

// Update a class by ID
export async function updateClass(
  id: number,
  data: Partial<Omit<Class, "id" | "createdAt" | "updatedAt">>,
) {
  const [updatedClass] = await db
    .update(classModel)
    .set(data)
    .where(eq(classModel.id, id))
    .returning();
  return updatedClass || null;
}

// Delete a class by ID
export async function deleteClass(id: number) {
  const result = await db
    .delete(classModel)
    .where(eq(classModel.id, id))
    .returning();
  return result.length > 0;
}
