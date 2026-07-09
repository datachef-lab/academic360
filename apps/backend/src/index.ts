// import "dotenv/config";
// import { app, httpServer } from "@/app.js";
// import { connectToDatabase, connectToMySQL } from "@/db/index.js";
// import { startLoadDataScheduler } from "./features/user/services/refactor-old-migration.service";

// const PORT = process.env.PORT || 8080;

// // List all required environment variables here
// const REQUIRED_ENVS = [
//   "PORT",
//   "NODE_ENV",
//   "STUDY_MATERIAL_BASE_PATH",
//   "DATABASE_URL",
//   "OLD_DB_HOST",
//   "OLD_DB_PORT",
//   "OLD_DB_USER",
//   "OLD_DB_PASSWORD",
//   "OLD_DB_NAME",
//   "CORS_ORIGIN",
//   "ACCESS_TOKEN_SECRET",
//   "ACCESS_TOKEN_EXPIRY",
//   "REFRESH_TOKEN_SECRET",
//   "REFRESH_TOKEN_EXPIRY",
//   "ZEPTO_URL",
//   "ZEPTO_FROM",
//   "ZEPTO_TOKEN",
//   "DEVELOPER_EMAIL",
//   "INTERAKT_API_KEY",
//   "INTERAKT_BASE_URL",
//   "DEVELOPER_PHONE",
//   "GOOGLE_CLIENT_ID",
//   "GOOGLE_CLIENT_SECRET",
//   // Add any other required envs here
// ];

// function checkRequiredEnvs() {
//   const missing = REQUIRED_ENVS.filter(
//     (key) => !process.env[key] || process.env[key]?.trim() === "",
//   );
//   if (missing.length > 0) {
//     console.error(
//       `\n[backend] - Missing required environment variables: - ${missing.join(", ")}`,
//     );
//     process.exit(1);
//   }
// }

// (async () => {
//   console.log("\nInitializing academic360...\n");
//   // checkRequiredEnvs(); // WILL BE NEED TO UNCOMMENT
//   try {
//     await connectToDatabase();
//     const shouldConnectMySQL =
//       process.env.NODE_ENV === "production" ||
//       process.env.NODE_ENV === "development" ||
//       process.env.NODE_ENV === "staging";
//     if (shouldConnectMySQL) {
//       await connectToMySQL();
//     }
//     httpServer.listen(PORT, async () => {
//       console.log(
//         `[backend] - academic360 is running on http://localhost:${PORT} 🚀 \n`,
//       );
//       console.log(`PROFILE: ${process.env.NODE_ENV!}\n`);
//       console.log("Press Ctrl+C to stop the application.\n");
//       //   await brainstormOldMigration();
//       if (
//         process.env.NODE_ENV === "production" ||
//         process.env.NODE_ENV === "development" ||
//         process.env.NODE_ENV === "staging"
//       ) {
//         // await startLoadDataScheduler();
//       }
//     });
//   } catch (error) {
//     console.error("[backend] - Failed to start the application: ⚠️\n", error);
//   }
// })();

import "dotenv/config";
import { connectRedis, disconnectRedis } from "@/config/redis.js";
import { connectToDatabase, connectToMySQL } from "@/db/index.js";
import { createLogger } from "@/config/logger.js"; // not createLogger
import { startPaytmDowntimeScheduler } from "@/features/payments/schedulers/paytm-downtime.scheduler.js";
import { startLibraryReminderScheduler } from "@/features/library/schedulers/library-reminders.scheduler.js";
import { startJournalIssuePredictorScheduler } from "@/features/library/schedulers/journal-issue-predictor.scheduler.js";
const log = createLogger("db");

const PORT = process.env.PORT || 8080;
const REQUIRED_ENVS = [
  "PORT",
  "NODE_ENV",

  // Paths
  // "STUDY_MATERIAL_BASE_PATH",
  "EXAM_FORM_UPLOAD_PATH",
  "LIBRARY_EXCEL_DATA_PATH",
  "LOG_DIRECTORY",
  "SETTINGS_PATH",

  // Database
  "DATABASE_URL",
  "OLD_DB_HOST",
  "OLD_DB_PORT",
  "OLD_DB_USER",
  "OLD_DB_PASSWORD",
  "OLD_DB_NAME",

  // CORS / Backend
  "CORS_ORIGIN",
  "BACKEND_URL",

  // Auth
  "ACCESS_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRY",
  "REFRESH_TOKEN_SECRET",
  "REFRESH_TOKEN_EXPIRY",

  // Developer
  "DEVELOPER_EMAIL",
  "DEVELOPER_PHONE",

  // Google Auth
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",

  // Interakt
  "INTERAKT_API_KEY",
  "INTERAKT_BASE_URL",

  // Zepto
  // "ZEPTO_URL",
  // "ZEPTO_FROM",
  // "ZEPTO_TOKEN",

  // AWS
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET",
  "AWS_ROOT_FOLDER",

  // Paytm
];

// Optional environment variables (production only)
const PRODUCTION_ONLY_ENVS = [
  "ZEPTO_URL",
  "ZEPTO_FROM",
  "ZEPTO_TOKEN",
  "STUDY_MATERIAL_BASE_PATH",
  "DOCUMENT_BASE_PATH",
  "PAYTM_SETTLEMENT_CLIENT_SECRET",
  "PAYTM_SETTLEMENT_CLIENT_ID",
  "PAYTM_SETTLEMENT_JWT_EMAIL",
];

function checkRequiredEnvs() {
  const isProduction = process.env.NODE_ENV === "production";
  const envsToCheck = isProduction
    ? [...REQUIRED_ENVS, ...PRODUCTION_ONLY_ENVS]
    : REQUIRED_ENVS;

  const missing = envsToCheck.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === "",
  );
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

(async () => {
  log.info("Initializing academic360...");
  checkRequiredEnvs(); // WILL BE NEED TO UNCOMMENT

  try {
    await connectRedis();
    const { httpServer } = await import("@/app.js");

    await connectToDatabase();

    const shouldConnectMySQL = [
      "production",
      "development",
      "staging",
    ].includes(process.env.NODE_ENV || "");

    if (shouldConnectMySQL) {
      await connectToMySQL();
    }

    const shutdown = async (signal: string) => {
      log.info(`Received ${signal}, shutting down...`);
      await disconnectRedis();
      process.exit(0);
    };
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));

    httpServer.listen(PORT, async () => {
      log.info(`academic360  running on http://localhost:${PORT} 🚀`);
      log.info(`Profile: ${process.env.NODE_ENV}`);
      log.debug("Press Ctrl+C to stop the application.");
      startPaytmDowntimeScheduler();
      startLibraryReminderScheduler();
      startJournalIssuePredictorScheduler();
      // Legacy ID card backfill — background + idempotent (skips already-migrated
      // entries and already-uploaded images), so it self-heals on every restart.
      void import("@/features/idcard/services/legacy-idcard-sync.service.js")
        .then(({ syncLegacyIdCards }) => syncLegacyIdCards())
        .catch((e) =>
          log.error("idcard-sync failed to start", {
            message: e instanceof Error ? e.message : String(e),
          }),
        );
    });
  } catch (error) {
    log.error("Failed to start the application ⚠️", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error(error);
    process.exit(1);
  }
})();
