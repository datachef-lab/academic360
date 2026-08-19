import "dotenv/config";
import fs from "fs";
import pg, { PoolClient } from "pg";
import { createPool, type Pool as MySqlPool } from "mysql2/promise"; // For MySQL (old DB)
import { drizzle } from "drizzle-orm/node-postgres";

import { createLogger } from "@/config/logger.js";
import { loadLibrary } from "@/features/library/old-irp-data";
import { initializeAcademicActivities } from "@/features/academics/default-academic-activity";
import { seedServiceTypeRouting } from "@/features/service-requests/services/service-type-routing.seed";
import { runBootMigrations } from "./boot-migrations.js";

const log = createLogger("db");
// Create a connection pool. `max` is env-tunable because the concurrent
// legacy-student import runs several workers, each briefly holding up to two
// connections (an advisory-lock tx + autocommit statements).
export const pool = new pg.Pool({
  options: "-c timezone=Asia/Kolkata",
  connectionString: process.env.DATABASE_URL,
  // Sized for IMPORT_CONCURRENCY=35 import workers (each briefly holds up to
  // 2 connections during advisory-lock sections) plus normal request traffic.
  // `max` is a cap, not a pre-allocation; idle connections are reaped.
  max: Math.max(1, Number(process.env.PG_POOL_MAX) || 70),
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
    log.info("Connected to the database successfully 🎉 ");
    client.release(); // Release the connection back to the pool

    // createDefaultExamComponents();
    // initializeClasses();
    initializeAcademicActivities();
    seedServiceTypeRouting().catch((e) => {
      log.warn("Service type routing seed failed", { error: e });
    });
    // loadDefaultSettings();
    // loadDegree();
    // loadShifts()
    // loadCategory();
    // loadReligions();
    // loadLanguages();
    // loadBloodGroups();
    // loadOccupations();
    // loadQualifications();
    // loadNationalities();
    // await loadAffiliation();
    // loadCourseLevel();
    // loadAllAddress();
    // loadAllPostOffice();
    // loadAllPoliceStation();
    // loadCourseType();
    // loadRegulationType();
    // loadDefaultOtpNotificationMasters();
    // loadDefaultDocuments(); -> now runs via boot-migrations.ts (marker-guarded)
    // Clear existing duplicates and load fresh metas (only in development)

    // loadDefaultSubjectSelectionMetas();

    // loadDefaultUserTypes();
    // loadDefaultUserStatusMasters();
    // loadDefaultAppModules();
    // loadDefaultCertificateMasters().catch((e) => {
    //   log.warn("Default certificate master load failed", { error: e });
    // });
    // loadDefaultPromotionData().catch((e) => {
    //   log.warn("Default promotion data load failed", { error: e });
    // });
    // loadStudentFees();
    // loadLibrary();
    // initializeAcademicActivities();
    // defaultSetDateOfJoining();
    // loadLibraryUsers();
    // loadAllStaff();
    // sendAdmRegFormToNotSendStudents();
    // loadDefaultOtpNotificationMaster();
    // loadOldSubjects();
    // loadOldCourses();
    // loadOldSubjectTypes();

    // mapUserStatuses();
    // console.log(
    //   "[backend] - CU Registration App Path:",
    //   process.env.CU_REGISTRATION_APP_PATH,
    // );

    // Load CU physical registration schedule from Excel into DB (safe to re-run)
    try {
      //   const result = await CuRegistrationExcelService.syncAllToDatabase();
      //   console.log("[backend] - CU Physical Reg Excel sync:", result);
    } catch (e) {
      log.warn("CU Physical Reg Excel sync failed", { error: e });
    }

    // One-shot data heals + Excel imports. Each entry is state-based
    // (idempotent) so it can run on every boot without side effects. See
    // db/boot-migrations.ts. Fire-and-forget: don't hold up the server.
    runBootMigrations().catch((err) =>
      log.warn("Boot migrations orchestrator threw", { error: err }),
    );

    // Library legacy data is loaded ONCE via the marker-gated
    // `library-legacy-load` boot migration (see db/boot-migrations.ts).
    //
    // The recurring 10-minute delta-sync scheduler is intentionally NOT
    // started: it does a blanket full-column overwrite of every legacy-sourced
    // row on every tick, which would revert any edits admin/staff make in the
    // new system (renamed book, changed copy status, edited patron, etc.) and
    // pins a full CPU core (a tick over the full IRP dataset runs for hours).
    // Requirement (Harsh, 2026-08-15): load old data once, then no background
    // sync. Re-enable this only if a change-aware, non-clobbering sync is built.
    //   import("@/features/library/services/library-legacy-sync.service.js")
    //     .then(({ startLibrarySyncScheduler }) => startLibrarySyncScheduler());
  } catch (error) {
    log.debug(process.env.DATABASE_URL ?? "DATABASE_URL not set");
    log.error("Failed to connect to the database ⚠", { error });
    process.exit(1); // Exit the application if the database connection fails
  }
};

// Marks360 (external marks read-copy on the academic360 Postgres RDS) — optional;
// pool is created on first use so the backend boots fine when MARKS360_DB_* env
// vars are absent. The marks360 data lives in a separate `marks360` database on
// the same RDS instance and is populated by a manual sync from the Marks360 app.
//
// TLS mode is driven by env so the same code works for both deployment shapes:
//   - RDS (prod): set MARKS360_DB_CA_PATH to the AWS RDS CA bundle (global-bundle.pem)
//     → the server certificate is verified (rejectUnauthorized: true). Recommended.
//   - Same-host Postgres (e.g. staging on the same EC2): set MARKS360_DB_SSL=disable
//     → no TLS (loopback, nothing to MITM).
//   - Default (no CA, no flag): encrypt without verifying — backward compatible,
//     logs a warning. Fine for a trusted/local network; NOT for RDS over the wire.
type Marks360Ssl = false | { rejectUnauthorized: boolean; ca?: string };
const buildMarks360Ssl = (): Marks360Ssl => {
  const caPath = process.env.MARKS360_DB_CA_PATH;
  const mode = (process.env.MARKS360_DB_SSL || "").toLowerCase();

  if (mode === "disable" || mode === "off" || mode === "false") {
    return false;
  }
  if (caPath) {
    // Verify the server cert against the provided CA bundle (RDS global-bundle.pem).
    return { rejectUnauthorized: true, ca: fs.readFileSync(caPath, "utf8") };
  }
  if (mode === "verify") {
    // Asked to verify but gave no CA — fail closed rather than run insecurely.
    throw new Error(
      "MARKS360_DB_SSL=verify requires MARKS360_DB_CA_PATH to point at the RDS CA bundle",
    );
  }
  // Backward-compatible default: encrypt, do NOT verify the cert.
  log.warn(
    "marks360 DB: TLS certificate verification is DISABLED. For RDS set MARKS360_DB_CA_PATH; for a same-host DB set MARKS360_DB_SSL=disable.",
  );
  return { rejectUnauthorized: false };
};

let marks360Pool: pg.Pool | null = null;
export const getMarks360Connection = (): pg.Pool | null => {
  if (!process.env.MARKS360_DB_HOST || !process.env.MARKS360_DB_NAME) {
    return null;
  }
  if (!marks360Pool) {
    marks360Pool = new pg.Pool({
      host: process.env.MARKS360_DB_HOST,
      port: parseInt(process.env.MARKS360_DB_PORT || "5432", 10),
      user: process.env.MARKS360_DB_USER,
      password: process.env.MARKS360_DB_PASSWORD,
      database: process.env.MARKS360_DB_NAME,
      max: 5,
      ssl: buildMarks360Ssl(),
    });
  }
  return marks360Pool;
};

createLogger("mysql");
export const mysqlConnection: MySqlPool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  waitForConnections: true,
  // Sized so IMPORT_CONCURRENCY=35 workers (~1 query in flight each) never
  // queue behind each other, with headroom for other legacy readers.
  connectionLimit: Math.max(1, Number(process.env.OLD_DB_POOL_LIMIT) || 45),
  queueLimit: 0,
  // Remote legacy host can take 8s+ to handshake; default of 10s is too tight.
  connectTimeout: 60_000,
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
