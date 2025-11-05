import "dotenv/config";
import pg, { PoolClient } from "pg";
import { createConnection } from "mysql2/promise"; // For MySQL
import { drizzle } from "drizzle-orm/node-postgres";
import { createDefaultExamComponents } from "@/features/course-design/services/exam-component.service.js";
import { initializeClasses } from "@/features/academics/services/class.service.js";
import { loadDefaultSettings } from "@/features/apps/service/settings.service.js";
import { loadDegree } from "@/features/resources/services/degree.service.js";
import { loadCategory } from "@/features/resources/services/category.service.js";
import { loadReligions } from "@/features/resources/services/religion.service.js";
import { loadLanguages } from "@/features/resources/services/languageMedium.service.js";
import { loadBloodGroups } from "@/features/resources/services/bloodGroup.service.js";
import { loadOccupations } from "@/features/resources/services/occupation.service.js";
import { loadQualifications } from "@/features/resources/services/qualification.service.js";
import { loadNationalities } from "@/features/resources/services/nationality.service.js";
import { loadShifts } from "@/features/academics/services/shift.service.js";
import { loadAffiliation } from "@/features/course-design/services/affiliation.service";
import { loadCourseLevel } from "@/features/course-design/services/course-level.service";
import { loadCourseType } from "@/features/course-design/services/course-type.service";
import { loadRegulationType } from "@/features/course-design/services/regulation-type.service";
// import { loadOldSubjects } from "@/features/course-design/services/subject.service";
import { loadOldCourses } from "@/features/course-design/services/course.service";
import { loadOldSubjectTypes } from "@/features/course-design/services/subject-type.service";
import { loadDefaultSubjectSelectionMetas } from "@/features/subject-selection/services/subject-selection-meta.service";
import { loadDefaultDocuments } from "@/features/academics/services/document.service";
import {
  loadAllCity,
  loadAllCountry,
  loadAllPoliceStation,
  loadAllPostOffice,
  loadAllState,
} from "@/features/user/services/old-student.service";
import { loadDefaultOtpNotificationMasters } from "@/features/auth/services/otp.service";
// import { loadDefaultOtpNotificationMaster } from "@/features/auth/services/otp.service";
import { CuRegistrationExcelService } from "@/services/cu-registration-excel.service.js";
import { sendAdmRegFormToNotSendStudents } from "@/features/admissions/services/cu-registration-correction-request.service";

// Create a connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool, { casing: "snake_case" });

pool.on("connect", async (client) => {
  await client.query(`SET TIME ZONE 'Asia/Kolkata'`);
  console.log("[backend] - Set time zone to Asia/Kolkata");
});

// Test the connection 🔌
export const connectToDatabase = async () => {
  try {
    const client: PoolClient = await pool.connect(); // Test the connection ✔
    console.log(process.env.DATABASE_URL);
    console.log("[backend] - Connected to the database successfully. 🎉");
    client.release(); // Release the connection back to the pool

    createDefaultExamComponents();
    initializeClasses();
    loadDefaultSettings();
    // loadDegree();
    // loadShifts()
    // loadCategory();
    // loadReligions();
    // loadLanguages();
    // loadBloodGroups();
    // loadOccupations();
    // loadQualifications();
    // loadNationalities();
    loadAffiliation();
    loadCourseLevel();
    // loadAllAddress();
    // loadAllPostOffice();
    // loadAllPoliceStation();
    loadCourseType();
    loadRegulationType();
    loadDefaultOtpNotificationMasters();
    loadDefaultDocuments();
    // Clear existing duplicates and load fresh metas (only in development)

    loadDefaultSubjectSelectionMetas();
    // sendAdmRegFormToNotSendStudents();
    // loadDefaultOtpNotificationMaster();
    // loadOldSubjects();
    // loadOldCourses();
    // loadOldSubjectTypes();
    console.log(
      "[backend] - CU Registration App Path:",
      process.env.CU_REGISTRATION_APP_PATH,
    );

    // Load CU physical registration schedule from Excel into DB (safe to re-run)
    try {
      //   const result = await CuRegistrationExcelService.syncAllToDatabase();
      //   console.log("[backend] - CU Physical Reg Excel sync:", result);
    } catch (e) {
      console.warn("[backend] - CU Physical Reg Excel sync failed", e);
    }
  } catch (error) {
    console.log(process.env.DATABASE_URL);
    console.error("[backend] - Failed to connect to the database: ⚠", error);
    process.exit(1); // Exit the application if the database connection fails
  }
};

// export const loadAllAddress = () => {
//     loadAllCountry()
//         .then(() => {
//             console.log("All countries loaded successfully.");
//             loadAllState()
//                 .then(() => {
//                     console.log("All states loaded successfully.");
//                     loadAllCity()
//                         .then(() => {
//                             console.log("All cities loaded successfully.");
//                             loadAllDistrict()
//                                 .then(() => {
//                                     console.log("All districts loaded successfully.");
//                                     loadAllPostOffice()
//                                         .then(() => {
//                                             console.log("All post offices loaded successfully.");
//                                             loadAllPoliceStation()
//                                                 .then(() => {
//                                                     console.log("All police stations loaded successfully.");
//                                                 });
//                                         });
//                                 });
//                         });
//                 });
//         });
// };

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
