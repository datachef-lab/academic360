import { db } from "@/db/index.js";
import { sessionModel } from "@repo/db/schemas/models/academics";
import { and, desc, eq } from "drizzle-orm";

export async function findAll() {
  return await db
    .select()
    .from(sessionModel)
    .orderBy(desc(sessionModel.createdAt));
}

export async function findById(id: number) {
  const [session] = await db
    .select()
    .from(sessionModel)
    .where(eq(sessionModel.id, id));

  return session || null;
}

export async function create(
  sessionData: Omit<
    typeof sessionModel.$inferInsert,
    "id" | "createdAt" | "updatedAt"
  >,
) {
  const [existingSession] = await db
    .select()
    .from(sessionModel)
    .where(
      and(
        eq(sessionModel.name, sessionData.name.trim()),
        eq(sessionModel.academicYearId, sessionData.academicYearId!),
      ),
    );

  if (existingSession) return null;

  const [newSession] = await db
    .insert(sessionModel)
    .values(sessionData)
    .returning();

  return newSession;
}
