import "dotenv/config";
import pg, { PoolClient } from "pg";
import { createConnection } from "mysql2/promise"; // For MySQL
import { drizzle } from "drizzle-orm/node-postgres";

// Create a connection pool
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool, { casing: "snake_case" });

// Test the connection 🔌
export const connectToDatabase = async () => {
    try {
        const client: PoolClient = await pool.connect(); // Test the connection ✔
        console.log(process.env.DATABASE_URL);
        console.log("[backend] - Connected to the database successfully. 🎉");
        client.release(); // Release the connection back to the pool
    } catch (error) {
        console.log(process.env.DATABASE_URL);
        console.error("[backend] - Failed to connect to the database: ⚠", error);
        process.exit(1); // Exit the application if the database connection fails
    }
};

// MySQL (old DB)
// console.log(
//     process.env.OLD_DB_HOST!,
//     parseInt(process.env.OLD_DB_PORT!, 10),
//     process.env.OLD_DB_USER!,
//     process.env.OLD_DB_PASSWORD!,
//     process.env.OLD_DB_NAME!
// )
export const mysqlConnection = await createConnection({
    host: process.env.OLD_DB_HOST!,
    port: parseInt(process.env.OLD_DB_PORT!, 10),
    user: process.env.OLD_DB_USER!,
    password: process.env.OLD_DB_PASSWORD!,
    database: process.env.OLD_DB_NAME!,
});

// Test MySQL Connection
export const connectToMySQL = async () => {
    try {
        const [rows] = await mysqlConnection.query(
            "SELECT COUNT(*) AS totalRows FROM community",
        ); // Simple query to test the connection
        console.log(rows);
        console.log("[MySQL] - Connected successfully. 🎉");
    } catch (error) {
        console.error("[MySQL] - Connection failed: ⚠", error);
        // process.exit(1); // Exit the application if the database connection fails
    }
};
