import { db } from "@/db/index.js";
import { postOfficeModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

type PostOfficeInsert = typeof postOfficeModel.$inferInsert;
type PostOfficeWritable = Omit<
  PostOfficeInsert,
  "id" | "createdAt" | "updatedAt"
>;

export async function findAllPostOffices() {
  return await db.select().from(postOfficeModel).orderBy(postOfficeModel.name);
}

export async function findPostOfficeById(id: number) {
  const [row] = await db
    .select()
    .from(postOfficeModel)
    .where(eq(postOfficeModel.id, id));
  return row ?? null;
}

export async function createPostOffice(data: PostOfficeWritable) {
  const [row] = await db.insert(postOfficeModel).values(data).returning();
  return row;
}

export async function updatePostOffice(
  id: number,
  data: Partial<PostOfficeWritable>,
) {
  const [row] = await db
    .update(postOfficeModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(postOfficeModel.id, id))
    .returning();
  return row ?? null;
}

export async function deletePostOffice(id: number) {
  const [row] = await db
    .delete(postOfficeModel)
    .where(eq(postOfficeModel.id, id))
    .returning();
  return row ?? null;
}
