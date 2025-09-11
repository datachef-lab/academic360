import { db } from "@/db/index.js";
import {
  Degree,
  degreeModel,
} from "@/features/resources/models/degree.model.js";
import { eq } from "drizzle-orm";

const degrees: Degree[] = [
  { name: "Class X", level: "SECONDARY", sequence: 1 },
  { name: "Class XII", level: "HIGHER_SECONDARY", sequence: 2 },
  { name: "Graduation", level: "UNDER_GRADUATE", sequence: 3 },
  { name: "Post Graduation", level: "POST_GRADUATE", sequence: 4 },
  { name: "Ph.D / D.Phil", level: "DOCTORATE", sequence: 5 },
  { name: "M.Phil", level: "POST_GRADUATE", sequence: 6 },
  { name: "Graduation With Spl Honours", level: "UNDER_GRADUATE", sequence: 7 },
  {
    name: "B. Com Honours with Accounts & Finance",
    level: "UNDER_GRADUATE",
    sequence: 8,
  },
  {
    name: "B. Com Honours with Marketing",
    level: "UNDER_GRADUATE",
    sequence: 9,
  },
  {
    name: "B. Com Honours with Taxation",
    level: "UNDER_GRADUATE",
    sequence: 10,
  },
  {
    name: "B. Com Honours with E-Business",
    level: "UNDER_GRADUATE",
    sequence: 11,
  },
  { name: "B.A. English Honours", level: "UNDER_GRADUATE", sequence: 12 },
];

export async function loadDegree() {
  for (let i = 0; i < degrees.length; i++) {
    const [existingDegree] = await db
      .select()
      .from(degreeModel)
      .where(eq(degreeModel.name, degrees[i].name));
    if (!existingDegree) {
      await db.insert(degreeModel).values(degrees[i]);
    }
  }
}

export async function addDegree(name: string): Promise<Degree | null> {
  const [foundDegree] = await db
    .insert(degreeModel)
    .values({
      name,
    })
    .returning();

  return foundDegree;
}

export async function findDegreeById(id: number): Promise<Degree | null> {
  const [foundDegree] = await db
    .select()
    .from(degreeModel)
    .where(eq(degreeModel.id, id));

  return foundDegree;
}

export async function findAllDegrees(): Promise<Degree[]> {
  return await db.select().from(degreeModel).orderBy(degreeModel.sequence);
}

export async function createDegree(
  data: Omit<Degree, "id" | "createdAt" | "updatedAt">,
): Promise<Degree> {
  const [newDegree] = await db
    .insert(degreeModel)
    .values({
      name: data.name,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newDegree;
}

export async function updateDegree(
  id: number,
  data: Partial<Omit<Degree, "id" | "createdAt" | "updatedAt">>,
): Promise<Degree | null> {
  const [updatedDegree] = await db
    .update(degreeModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(degreeModel.id, id))
    .returning();

  return updatedDegree || null;
}

export async function deleteDegree(id: number): Promise<Degree | null> {
  const [deletedDegree] = await db
    .delete(degreeModel)
    .where(eq(degreeModel.id, id))
    .returning();

  return deletedDegree || null;
}

export async function findDegreeByName(name: string): Promise<Degree | null> {
  const [foundDegree] = await db
    .select()
    .from(degreeModel)
    .where(eq(degreeModel.name, name));

  return foundDegree;
}
