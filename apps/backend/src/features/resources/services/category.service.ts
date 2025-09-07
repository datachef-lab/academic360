import { db } from "@/db/index.js";
import {
  Category,
  categoryModel,
} from "@/features/resources/models/category.model.js";
import { eq } from "drizzle-orm";

const categories: Omit<Category, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "General",
    code: "GEN",
    documentRequired: null,
    sequence: 5,
    disabled: false,
  },
  {
    name: "SC",
    code: "SC",
    documentRequired: null,
    sequence: 1,
    disabled: false,
  },
  {
    name: "ST",
    code: "ST",
    documentRequired: null,
    sequence: 2,
    disabled: false,
  },
  {
    name: "OBC-A",
    code: "OBC-A",
    documentRequired: null,
    sequence: 3,
    disabled: false,
  },
  {
    name: "OBC-B",
    code: "OBC-B",
    documentRequired: null,
    sequence: 4,
    disabled: false,
  },
];

export async function loadCategory() {
  for (let i = 0; i < categories.length; i++) {
    const existing = await db
      .select()
      .from(categoryModel)
      .where(eq(categoryModel.code, categories[i].code));

    if (!existing.length) {
      await db.insert(categoryModel).values(categories[i]);
    }
  }
}

export async function addCategory(
  category: Category,
): Promise<Category | null> {
  const [foundCategory] = await db
    .insert(categoryModel)
    .values(category)
    .returning();
  return foundCategory;
}

export async function findCategoryById(id: number): Promise<Category | null> {
  const [foundCategory] = await db
    .select()
    .from(categoryModel)
    .where(eq(categoryModel.id, id));
  return foundCategory;
}

export async function findAllCategories(): Promise<Category[]> {
  return await db.select().from(categoryModel).orderBy(categoryModel.sequence);
}

export async function createCategory(
  data: Omit<Category, "id" | "createdAt" | "updatedAt">,
): Promise<Category> {
  const [newCategory] = await db
    .insert(categoryModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newCategory;
}

export async function updateCategory(
  id: number,
  data: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>,
): Promise<Category | null> {
  const [updatedCategory] = await db
    .update(categoryModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(categoryModel.id, id))
    .returning();

  return updatedCategory || null;
}

export async function deleteCategory(id: number): Promise<Category | null> {
  const [deletedCategory] = await db
    .delete(categoryModel)
    .where(eq(categoryModel.id, id))
    .returning();

  return deletedCategory || null;
}

export async function findCategoryByName(
  name: string,
): Promise<Category | null> {
  const [foundCategory] = await db
    .select()
    .from(categoryModel)
    .where(eq(categoryModel.name, name));
  return foundCategory;
}

export async function findCategoryByCode(
  code: string,
): Promise<Category | null> {
  const [foundCategory] = await db
    .select()
    .from(categoryModel)
    .where(eq(categoryModel.code, code));
  return foundCategory;
}
