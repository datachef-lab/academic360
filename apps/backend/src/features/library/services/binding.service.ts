import { db } from "@/db/index.js";
import { Binding, bindingModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type BindingListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type BindingListResult = {
  rows: Binding[];
  total: number;
  page: number;
  limit: number;
};

export async function findBindingById(id: number): Promise<Binding | null> {
  const [binding] = await db
    .select()
    .from(bindingModel)
    .where(eq(bindingModel.id, id));

  return binding ?? null;
}

export async function findBindingByName(
  name: string,
  excludeId?: number,
): Promise<Binding | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(bindingModel.name, name.trim()),
          ne(bindingModel.id, excludeId),
        )
      : ilike(bindingModel.name, name.trim());

  const [binding] = await db.select().from(bindingModel).where(whereClause);
  return binding ?? null;
}

export async function findBindingsPaginated(
  filters: BindingListFilters,
): Promise<BindingListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(bindingModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(bindingModel)
    .where(whereClause)
    .orderBy(desc(bindingModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(bindingModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createBinding(
  data: Omit<Binding, "id">,
): Promise<Binding> {
  const [created] = await db.insert(bindingModel).values(data).returning();
  return created;
}

export async function updateBinding(
  id: number,
  data: Partial<Omit<Binding, "id">>,
): Promise<Binding | null> {
  const [updated] = await db
    .update(bindingModel)
    .set(data)
    .where(eq(bindingModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteBinding(id: number): Promise<Binding | null> {
  const [deleted] = await db
    .delete(bindingModel)
    .where(eq(bindingModel.id, id))
    .returning();

  return deleted ?? null;
}
