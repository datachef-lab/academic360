import "dotenv/config";
import { app } from "@/app.js";
import { getDbConnection } from "@repo/db/connection";
import { database } from "./db";

const PORT = process.env.PORT || 8080;

// List all required environment variables here
const REQUIRED_ENVS = [
  "PORT",
  "NODE_ENV",
  "DATABASE_URL",
  "RABBITMQ_URL",
  "RABBITMQ_PREFETCH",
  "RABBITMQ_RETRY_MAX",
  "RABBITMQ_RETRY_DELAY_MS",
  "ZEPTO_URL",
  "ZEPTO_FROM",
  "ZEPTO_TOKEN",
  "DEVELOPER_EMAIL",
  "INTERAKT_API_KEY",
  "INTERAKT_BASE_URL",
  "DEVELOPER_PHONE",
  // Add any other required envs here
];

function checkRequiredEnvs() {
  const missing = REQUIRED_ENVS.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === "",
  );
  if (missing.length > 0) {
    console.error(
      `\n[notification-system] - Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

(async () => {
  console.log("\nInitializing notification-system...\n");
  checkRequiredEnvs();
  if (database) {
    console.log("Database connected");
  } else {
    console.error("Database not connected");
    process.exit(1);
  }
  try {
    const { notificationsRouter } = await import("@/api/notifications.js");
    app.use("/api/notifications", notificationsRouter);
    // Start workers before HTTP
    const { startEmailWorker } = await import("@/workers/email.worker.js");
    const { startWhatsAppWorker } = await import(
      "@/workers/whatsapp.worker.js"
    );
    startEmailWorker();
    startWhatsAppWorker();
    app.listen(PORT, async () => {
      console.log(
        `[notification-system] - notification-system is running on http://localhost:${PORT} 🚀\n`,
      );
      console.log(`PROFILE: ${process.env.NODE_ENV!}\n`);
      console.log("Press Ctrl+C to stop the application.\n");
    });
  } catch (error) {
    console.error(
      "[notification-system] - Failed to start the application: ⚠️\n",
      error,
    );
  }
})();
