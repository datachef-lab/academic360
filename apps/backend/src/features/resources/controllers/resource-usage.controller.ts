import { NextFunction, Response, Request } from "express";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";

const rowsOf = (res: unknown): Record<string, unknown>[] => {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "rows" in res) {
    return (res as { rows: Record<string, unknown>[] }).rows;
  }
  return [];
};

/**
 * Count how many times each row of `:table` is referenced across the whole DB.
 * Walks every inbound foreign key (information_schema) pointing at the table's
 * `id`, sums grouped counts, and returns { [id]: totalReferences }.
 */
export const getResourceUsage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const table = String(req.params.table || "");
    if (!/^[a-z_]+$/.test(table)) {
      res.status(400).json(new ApiError(400, "Invalid table name"));
      return;
    }
    // Whitelist: the table must actually exist.
    const exists = rowsOf(
      await db.execute(
        sql`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${table} LIMIT 1`,
      ),
    );
    if (exists.length === 0) {
      res.status(404).json(new ApiError(404, "Table not found"));
      return;
    }

    // All FK columns in other tables that reference <table>.id
    const fks = rowsOf(
      await db.execute(sql`
        SELECT tc.table_name AS child_table, kcu.column_name AS child_col
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = ${table}
          AND ccu.column_name = 'id'
      `),
    );

    const counts: Record<number, number> = {};
    for (const fk of fks) {
      const childTable = String(fk.child_table);
      const childCol = String(fk.child_col);
      // Identifiers come from information_schema (trusted); quote them.
      const grouped = rowsOf(
        await db.execute(
          sql.raw(
            `SELECT "${childCol}" AS rid, count(*)::int AS n FROM "${childTable}" WHERE "${childCol}" IS NOT NULL GROUP BY "${childCol}"`,
          ),
        ),
      );
      for (const g of grouped) {
        const rid = Number(g.rid);
        const n = Number(g.n) || 0;
        counts[rid] = (counts[rid] ?? 0) + n;
      }
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", { counts }, "Usage counts computed."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
