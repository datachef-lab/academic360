import "dotenv/config";
import pg, { PoolClient } from "pg";
import { createPool, type Pool as MySqlPool } from "mysql2/promise"; // For MySQL (old DB)
import { drizzle } from "drizzle-orm/node-postgres";

import { createLogger } from "@/config/logger.js";
import { loadLibrary } from "@/features/library/old-irp-data";

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
    log.info("Connected to the database successfully 🎉 ");
    client.release(); // Release the connection back to the pool

    // createDefaultExamComponents();
    // initializeClasses();
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
    // loadDefaultDocuments();
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
