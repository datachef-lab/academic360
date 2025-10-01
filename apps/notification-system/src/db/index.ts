import { getDbConnection } from "@repo/db/connection";

export const database = getDbConnection(process.env.DATABASE_URL!);
