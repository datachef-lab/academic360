// import dotenv from "dotenv";
// import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
// import { createPool, type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";
// import { drizzle as drizzlePostgres, PostgresJsDatabase } from "drizzle-orm/postgres-js";
// import * as schema from "./schema"; // Import your schema

// // Load environment variables
// dotenv.config({ path: ".env.local" });
// const dbPostgres: PostgresJsDatabase<typeof schema> = drizzlePostgres(process.env.DATABASE_URL!, { schema });

// // Connection configuration for MySQL (assuming it's still used elsewhere)
// const dbConfig = {
//   host: process.env.DB_HOST!,
//   port: parseInt(process.env.DB_PORT!, 10),
//   user: process.env.DB_USER!,
//   password: process.env.DB_PASSWORD!,
//   database: process.env.DB_NAME!,
//   waitForConnections: true,
//   connectionLimit: 15,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 10000,
// };

// // Create a global pool that can be reused for MySQL
// let pool: Pool;
// let db: MySql2Database<Record<string, never>>;

// // Initialize MySQL pool right away
// try {
//   pool = createPool(dbConfig);
//   db = drizzle(pool);
//   console.log("MySQL Database pool created");
// } catch (error) {
//   console.error("Failed to create MySQL database pool:", error);
//   // Do not throw here if MySQL is optional/not critical for all operations
// }

// // Simple query function for MySQL
// export async function query<T extends RowDataPacket[]>(sql: string, values?: unknown[]): Promise<T> {
//   let connection: PoolConnection | null = null;

//   try {
//     if (!pool) throw new Error("MySQL pool not initialized");
//     // Get connection from the pool
//     connection = await pool.getConnection();

//     // Execute the query
//     const [results] = await connection.query<T>(sql, values);

//     // Return just the results (not the fields info)
//     return results;
//   } catch (error) {
//     console.error("MySQL Query execution error:", error);
//     throw error;
//   } finally {
//     // Always release the connection back to the pool
//     if (connection) connection.release();
//   }
// }

// // Graceful shutdown handler
// // async function shutdownHandler() {
// //     if (pool) {
// //         console.log('🛑 Closing database pool...');
// //         await pool.end();
// //         console.log('✅ Database pool closed');
// //     }
// // }

// // Register shutdown handlers - but no longer directly in this file
// // The process listeners will be set up in a separate file that's only
// // loaded in a Node.js environment (not in Edge functions/middleware)

// export { pool, db, dbPostgres };

// src/db/index.ts
import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

declare global {
  var mysqlPool: Pool | undefined;
  var mysqlDb: MySql2Database<typeof schema> | undefined;
}

if (!global.mysqlPool) {
  global.mysqlPool = createPool({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    waitForConnections: true,
    connectionLimit: 5, // 👈 keep this low
    queueLimit: 0,
  });

  global.mysqlDb = drizzle(global.mysqlPool);
  console.log("✅ MySQL pool initialized");
}

export const pool = global.mysqlPool!;
export const db = global.mysqlDb!;

export const dbPostgres: PostgresJsDatabase<typeof schema> = drizzlePostgres(process.env.DATABASE_URL!, { schema });

export async function query<T extends RowDataPacket[]>(sql: string, values?: unknown[]): Promise<T> {
  let connection: PoolConnection | null = null;

  try {
    if (!pool) throw new Error("MySQL pool not initialized");
    // Get connection from the pool
    connection = await pool.getConnection();

    // Execute the query
    const [results] = await connection.query<T>(sql, values);

    // Return just the results (not the fields info)
    return results;
  } catch (error) {
    console.error("MySQL Query execution error:", error);
    throw error;
  } finally {
    // Always release the connection back to the pool
    if (connection) connection.release();
  }
}
