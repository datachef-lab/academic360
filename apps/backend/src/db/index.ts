import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg, { Pool, PoolClient } from "pg";

// Create a connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool);

// Test the connection 🔌
export const connectToDatabase = async () => {
  try {
    const client: PoolClient = await pool.connect(); // Test the connection ✔️
    console.log("[backend] - Connected to the database successfully. 🎉");
    client.release(); // Release the connection back to the pool
  } catch (error) {
    console.error("[backend] - Failed to connect to the database: ⚠️", error);
    process.exit(1); // Exit the application if the database connection fails
  }
};
