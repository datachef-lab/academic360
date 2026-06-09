import "dotenv/config";
import pg, { PoolClient } from "pg";
import { createPool, type Pool as MySqlPool } from "mysql2/promise"; // For MySQL (old DB)
import { drizzle } from "drizzle-orm/node-postgres";

import { createLogger } from "@/config/logger.js";

const log = createLogger("db");
// Create a connection pool
export const pool = new pg.Pool({
  options: "-c timezone=Asia/Kolkata",
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool, { casing: "snake_case" });

pool.on("connect", async (client) => {
  await client.query(`SET TIME ZONE 'Asia/Kolkata'`);
  log.debug("Timezone set to Asia/Kolkata");
});

// Test the connection 🔌
export const connectToDatabase = async () => {
  try {
    const client: PoolClient = await pool.connect(); // Test the connection ✔
    // console.log(process.env.DATABASE_URL);
    log.info("Connected to the database successfully 🎉");
    client.release(); // Release the connection back to the pool
  } catch (error) {
    log.debug(process.env.DATABASE_URL ?? "DATABASE_URL not set");
    log.error("Failed to connect to the database ⚠", { error });
    process.exit(1); // Exit the application if the database connection fails
  }
};

createLogger("mysql");
export const mysqlConnection: MySqlPool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Keep the MySQL pool warm to avoid idle disconnects (MySQL server wait_timeout)
const MYSQL_KEEPALIVE_MS = Number(process.env.OLD_DB_KEEPALIVE_MS || 10000);
setInterval(() => {
  mysqlConnection.query("SELECT 1").catch((err) => {
    log.warn("keepalive ping failed", { message: err?.message || err });
  });
}, MYSQL_KEEPALIVE_MS).unref?.();

// Test MySQL Connection
export const connectToMySQL = async () => {
  try {
    const [rows] = await mysqlConnection.query(
      "SELECT COUNT(*) AS totalRows FROM community",
    ); // Simple query to test the connection
    // console.log(rows);

    log.info("Connected to MySQL successfully 🎉");
  } catch (error) {
    log.error("Connection failed ⚠", { error });
    // process.exit(1); // Exit the application if the database connection fails
  }
};
