import "dotenv/config";
import { app } from "@/app.js";
import { getDbConnection } from "@repo/db/connection";
import { db } from "./db";
import { userModel } from "@repo/db/schemas";

const PORT = process.env.NOTIFICATION_SYSTEM_PORT || process.env.PORT || 8080;

// List required envs (port handled separately to allow NOTIFICATION_SYSTEM_PORT or PORT)
const REQUIRED_ENVS = [
  "NODE_ENV",
  "NOTIFICATION_SYSTEM_PORT",
  "DATABASE_URL",
  "ZEPTO_URL",
  "ZEPTO_FROM",
  "ZEPTO_TOKEN",
  "DEVELOPER_EMAIL",
  "INTERAKT_API_KEY",
  "INTERAKT_BASE_URL",
  "DEVELOPER_PHONE",
];

function checkRequiredEnvs() {
  const missing = REQUIRED_ENVS.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === "",
  );
  const hasPort = Boolean(process.env.NOTIFICATION_SYSTEM_PORT);
  if (!hasPort) missing.unshift("NOTIFICATION_SYSTEM_PORT|PORT");
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
  if (db) {
    const result = await db.select().from(userModel).limit(1);
    console.log("result", result);
    console.log("Database connected", result);
    console.log("Database connected");
  } else {
    console.error("Database not connected");
    process.exit(1);
  }
  try {
    const { notificationsRouter } = await import("@/api/notifications.js");
    app.use("/api/notifications", notificationsRouter);
    app.get("/health", (_req, res) => res.json({ ok: true }));
    // Start workers before HTTP
    const { startEmailWorker } = await import("@/workers/email.worker.js");
    const { startWhatsAppWorker } = await import(
      "@/workers/whatsapp.worker.js"
    );
    // Throttle worker start to avoid rapid loops
    setTimeout(() => startEmailWorker(), 1000);
    setTimeout(() => startWhatsAppWorker(), 1500);
    // Install 404 handler after routers
    const { default: path } = await import("path");
    app.all("*", async (req, res) => {
      res.status(404);
      if (req.accepts("json")) return res.json({ message: "404 Not Found" });
      try {
        const { fileURLToPath } = await import("url");
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        return res.sendFile(path.join(__dirname, "..", "views", "404.html"));
      } catch {
        return res.type("txt").send("404 Not Found");
      }
    });

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
