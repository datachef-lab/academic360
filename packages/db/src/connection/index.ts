import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const getDbConnection = (databaseUrl: string) => {
    // Create connection pool for better performance
    const pool = new Pool({
        connectionString: databaseUrl,
        max: 20, // Maximum number of clients in the pool
        min: 5,  // Minimum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
    });

    return drizzle(pool);
};