import { db } from "@/db/index.js";
import { feesHeadModel, FeesHead } from "../models/fees-head.model.js";
import { and, asc, count, eq, ilike } from "drizzle-orm";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";

type FeesHeadFilters = {
  search?: string;
};

export const getFeesHeads = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: FeesHeadFilters,
): Promise<PaginatedResponse<FeesHead>> => {
  const safePage = Math.max(1, page || 1);
  const safePageSize = Math.min(Math.max(1, pageSize || 10), 100);
  const offset = (safePage - 1) * safePageSize;

  const whereClause = [];
  const search = filters?.search?.trim();
  if (search) {
    whereClause.push(ilike(feesHeadModel.name, `%${search}%`));
  }

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(feesHeadModel)
    .where(whereClause.length ? (and as any)(...whereClause) : undefined);

  const rows = await db
    .select()
    .from(feesHeadModel)
    .where(whereClause.length ? (and as any)(...whereClause) : undefined)
    .orderBy(asc(feesHeadModel.sequence))
    .limit(safePageSize)
    .offset(offset);

  const totalElements = Number(total);
  const totalPages =
    totalElements === 0 ? 0 : Math.ceil(totalElements / safePageSize);

  return {
    content: rows,
    page: safePage,
    pageSize: safePageSize,
    totalElements,
    totalPages,
  };
};

export const getFeesHeadById = async (id: number) => {
  const [feesHead] = await db
    .select()
    .from(feesHeadModel)
    .where(eq(feesHeadModel.id, id));
  return feesHead;
};

export const createFeesHead = async (feesHead: FeesHead) => {
  const [newFeesHead] = await db
    .insert(feesHeadModel)
    .values(feesHead)
    .returning();
  return newFeesHead;
};

export const updateFeesHead = async (
  id: number,
  feesHead: Partial<FeesHead>,
) => {
  const [updatedFeesHead] = await db
    .update(feesHeadModel)
    .set(feesHead)
    .where(eq(feesHeadModel.id, id))
    .returning();
  return updatedFeesHead;
};

export const deleteFeesHead = async (id: number) => {
  const [deletedFeesHead] = await db
    .delete(feesHeadModel)
    .where(eq(feesHeadModel.id, id))
    .returning();
  return deletedFeesHead;
};
