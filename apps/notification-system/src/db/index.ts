import { getDbConnection } from "@repo/db/connection";

export const db = getDbConnection(process.env.DATABASE_URL!);
