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
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Connection timeout settings
    connectTimeout: 60000, // 60 seconds
    // Set timezone
    timezone: "Z",
  });

  // Handle pool errors
  global.mysqlPool.on("connection", (connection) => {
    connection.on("error", (err) => {
      console.error("MySQL connection error:", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
        console.log("MySQL connection lost, will be reconnected by pool");
      }
    });
  });

  global.mysqlDb = drizzle(global.mysqlPool);
  console.log("✅ MySQL pool initialized");
}

export const pool = global.mysqlPool!;
export const db = global.mysqlDb!;

export const dbPostgres: PostgresJsDatabase<typeof schema> = drizzlePostgres(process.env.DATABASE_URL!, { schema });

export async function query<T extends RowDataPacket[]>(
  sql: string,
  values?: unknown[],
  retries: number = 2,
): Promise<T> {
  let connection: PoolConnection | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (!pool) throw new Error("MySQL pool not initialized");

      // Get connection from the pool
      connection = await pool.getConnection();

      // Check if connection is still alive
      await connection.ping();

      // Execute the query
      const [results] = await connection.query<T>(sql, values);

      // Return just the results (not the fields info)
      return results;
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection error that we should retry
      const isConnectionError =
        error?.code === "ECONNRESET" ||
        error?.code === "PROTOCOL_CONNECTION_LOST" ||
        error?.code === "ETIMEDOUT" ||
        error?.errno === -54; // ECONNRESET errno

      if (isConnectionError && attempt < retries) {
        console.warn(`MySQL connection error (attempt ${attempt + 1}/${retries + 1}):`, error?.code || error?.message);
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      // If not a connection error or out of retries, log and throw
      console.error("MySQL Query execution error:", {
        code: error?.code,
        errno: error?.errno,
        message: error?.message,
        sql: sql.substring(0, 100), // Log first 100 chars of SQL
        attempt: attempt + 1,
      });
      throw error;
    } finally {
      // Always release the connection back to the pool
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error("Error releasing MySQL connection:", releaseError);
        }
        connection = null;
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Query failed after retries");
}
