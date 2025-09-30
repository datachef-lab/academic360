import "dotenv/config";
import { app, httpServer } from "@/app.js";
import { connectToDatabase, connectToMySQL } from "@/db/index.js";
import { startLoadDataScheduler } from "./features/user/services/refactor-old-migration.service";

const PORT = process.env.PORT || 8080;

// List all required environment variables here
const REQUIRED_ENVS = [
  "PORT",
  "NODE_ENV",
  "STUDY_MATERIAL_BASE_PATH",
  "DATABASE_URL",
  "OLD_DB_HOST",
  "OLD_DB_PORT",
  "OLD_DB_USER",
  "OLD_DB_PASSWORD",
  "OLD_DB_NAME",
  "CORS_ORIGIN",
  "ACCESS_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRY",
  "REFRESH_TOKEN_SECRET",
  "REFRESH_TOKEN_EXPIRY",
  "ZEPTO_URL",
  "ZEPTO_FROM",
  "ZEPTO_TOKEN",
  "DEVELOPER_EMAIL",
  "INTERAKT_API_KEY",
  "INTERAKT_BASE_URL",
  "DEVELOPER_PHONE",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  // Add any other required envs here
];

function checkRequiredEnvs() {
  const missing = REQUIRED_ENVS.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === "",
  );
  if (missing.length > 0) {
    console.error(
      `\n[backend] - Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

(async () => {
  console.log("\nInitializing academic360...\n");
  // checkRequiredEnvs(); // WILL BE NEED TO UNCOMMENT
  try {
    await connectToDatabase();
    console.log("NODE_ENV: updated v6", process.env.NODE_ENV);
    if (
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "development"
    ) {
      await connectToMySQL();
    }
    httpServer.listen(PORT, async () => {
      console.log(
        `[backend] - academic360 is running on http://localhost:${PORT} 🚀\n`,
      );
      console.log(`PROFILE: ${process.env.NODE_ENV!}\n`);
      console.log("Press Ctrl+C to stop the application.\n");
      //   await brainstormOldMigration();
      if (
        process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "development"
      ) {
        await startLoadDataScheduler();
      }
    });
  } catch (error) {
    console.error("[backend] - Failed to start the application: ⚠️\n", error);
  }
})();
