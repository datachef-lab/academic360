import { db } from "@/db/index.js";
import { AnyColumn, count, desc, SQLWrapper } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { PaginatedResponse } from "./PaginatedResponse.js";

export async function findAll<T>(model: PgTable, page: number = 1, pageSize: number = 10, orderByColumn: string = "id"): Promise<PaginatedResponse<T>> {
    const offset = (page - 1) * pageSize;

    const dataArr = await db.select().from(model).limit(pageSize).offset(offset).orderBy(desc(model[orderByColumn as keyof typeof model] as SQLWrapper | AnyColumn));

    if (dataArr.length === 0) {
        return {
            content: [],
            page: page,
            pageSize,
            totalElemets: 0,
            totalPages: 0
        };
    }

    const [{ count: countRows }] = await db.select({ count: count() }).from(model);

    return {
        content: dataArr as T[],
        page: page,
        pageSize,
        totalElemets: Number(countRows),
        totalPages: Math.ceil(Number(countRows) / pageSize)
    };
}