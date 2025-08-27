import { pool } from '@/db';

/**
 * Sets up database shutdown handlers
 * This file should only be imported in a Node.js environment (server components),
 * not in Edge functions or middleware
 */
export function setupDatabaseShutdownHandlers() {
    // Graceful shutdown handler
    async function shutdownHandler() {
        if (pool) {
            console.log('🛑 Closing database pool...');
            await pool.end();
            console.log('✅ Database pool closed');
        }
    }

    // Register shutdown handlers
    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    process.on('beforeExit', shutdownHandler);

    console.log('Database shutdown handlers registered');
}

// Export a dummy function for type checking
export function isDatabaseSetupComplete(): boolean {
    return true;
} 