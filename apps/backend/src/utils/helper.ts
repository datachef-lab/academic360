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
            totalElements: 0,
            totalPages: 0
        };
    }

    const [{ count: countRows }] = await db.select({ count: count() }).from(model);

    return {
        content: dataArr as T[],
        page: page,
        pageSize,
        totalElements: Number(countRows),
        totalPages: Math.ceil(Number(countRows) / pageSize)
    };
}

interface FindAllByFormattedProps<T, K> {
    model: PgTable;
    fn: (ele: T) => Promise<K | null>;
    page?: number;
    pageSize?: number;
    orderByColumn?: string;
}

export async function findAllByFormatted<T, K>({
    model,
    fn,
    page = 1,
    pageSize = 10,
    orderByColumn = "id"
}: FindAllByFormattedProps<T, K>): Promise<PaginatedResponse<K>> {
    const arrResponse = await findAll<T>(model, page, pageSize, orderByColumn);

    // Await Promise.all to resolve async operations
    const content = await Promise.all(arrResponse.content.map(async (ele) => {
        return await fn(ele);
    })) as K[];

    return {
        content,
        page: arrResponse.page,
        pageSize: arrResponse.pageSize,
        totalElements: arrResponse.totalElements,
        totalPages: arrResponse.totalPages
    };
}