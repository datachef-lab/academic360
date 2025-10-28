import { readExcelFile } from "../utils/readExcel.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { studentModel } from "@repo/db/schemas/models/user";
import { cuPhysicalRegModel } from "@repo/db/schemas/models/admissions/cu-physical-reg-model.js";
import { classModel } from "@repo/db/schemas/models/academics";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

export interface CuRegistrationExcelData {
  srNo: number;
  code: string;
  student: string;
  class: string;
  course: string;
  section: string;
  shift: string;
  instituteEmail: string;
  submissionDate: string;
  time: string;
  venue: string;
}

export interface StudentTimeVenueInfo {
  time: string;
  venue: string;
  submissionDate: string;
  found: boolean;
}

export class CuRegistrationExcelService {
  private static excelFilePath: string | null = null;
  private static cachedData: CuRegistrationExcelData[] | null = null;
  private static lastModified: Date | null = null;

  /**
   * Set the path to the Excel file containing student time and venue information
   */
  public static setExcelFilePath(filePath: string): void {
    this.excelFilePath = filePath;
    console.info(`[CU-REG EXCEL] Excel file path set to: ${filePath}`);
  }

  /**
   * Resolve public path robustly across dev and built (dist) environments
   */
  private static async resolvePublicPath(fileName: string): Promise<string> {
    const candidates: string[] = [];

    // 1) Explicit env override
    if (process.env.CU_REG_PUBLIC_DIR) {
      candidates.push(path.join(process.env.CU_REG_PUBLIC_DIR, fileName));
    }

    // 2) Monorepo root public
    candidates.push(path.join(process.cwd(), "public", fileName));

    // 3) apps/backend/public under repo root
    candidates.push(
      path.join(process.cwd(), "apps", "backend", "public", fileName),
    );

    // 4) Relative to compiled file location: dist/apps/backend/src/services -> ../../public
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      candidates.push(path.join(__dirname, "..", "..", "public", fileName));
      // also one level further up if structure differs
      candidates.push(
        path.join(__dirname, "..", "..", "..", "public", fileName),
      );
    } catch {}

    for (const p of candidates) {
      try {
        await fs.access(p, fs.constants.R_OK);
        return p;
      } catch {}
    }

    // Fallback to cwd/public
    return path.join(process.cwd(), "public", fileName);
  }

  /**
   * Get the default Excel file path from the public directory
   */
  public static getDefaultExcelFilePath(): string {
    // Synchronous fallback; async resolver is used in load
    return path.join(
      process.cwd(),
      "public",
      "CU Registration Physical submission allotment 2025.xlsx",
    );
  }

  /**
   * Load Excel data from file
   */
  private static async loadExcelData(): Promise<CuRegistrationExcelData[]> {
    const filePath =
      this.excelFilePath ||
      (await this.resolvePublicPath(
        "CU Registration Physical submission allotment 2025.xlsx",
      ));

    try {
      // Check if file exists
      await fs.access(filePath, fs.constants.R_OK);

      // Check if file was modified since last load
      const stats = await fs.stat(filePath);
      if (
        this.cachedData &&
        this.lastModified &&
        stats.mtime <= this.lastModified
      ) {
        console.info("[CU-REG EXCEL] Using cached Excel data");
        return this.cachedData;
      }

      console.info(`[CU-REG EXCEL] Loading Excel data from: ${filePath}`);

      // Read Excel file
      const rawData = await readExcelFile<any>(filePath);

      // Transform raw data to our interface (preserve exact strings from Excel)
      const transformedData: CuRegistrationExcelData[] = rawData.map(
        (row: any, index: number) => {
          // Build a case-insensitive, trimmed key map for this row
          const toKey = (s: string) =>
            String(s || "")
              .trim()
              .toLowerCase()
              .replace(/\s+/g, " ");
          const rowKeyMap = new Map<string, string>();
          for (const k of Object.keys(row)) {
            rowKeyMap.set(toKey(k), k);
          }
          const pick = (...cands: string[]) => {
            for (const c of cands) {
              const key = rowKeyMap.get(toKey(c));
              if (key && key in row) return row[key];
            }
            return "";
          };

          const rawSubmissionDate = pick(
            "Submission date",
            "Submission Date",
            "submission date",
            "SubmissionDate",
            "submissionDate",
            "Date",
            "Submission",
          );
          const rawTime = pick("Time");
          const rawVenue = pick("Venue");
          const rawCode = pick("Code");
          const rawStudent = pick("Student");
          const rawClass = pick("Class");
          const rawCourse = pick("Course");
          const rawSection = pick("Section");
          const rawShift = pick("Shift");
          const rawEmail = pick(
            "Institute Email",
            "InstituteEmail",
            "instituteEmail",
          );

          const codeRaw = String(rawCode ?? "").trim();
          const paddedCode = /^\d+$/.test(codeRaw)
            ? codeRaw.padStart(10, "0")
            : codeRaw;

          // Sr No variants
          const rawSr = pick("Sr. No", "Sr No", "SrNo", "Sr#", "Sr");
          const srNo =
            Number(String(rawSr || "").replace(/[^0-9]/g, "")) || index + 1;

          return {
            srNo,
            code: paddedCode,
            student: String(rawStudent ?? "").trim(),
            class: String(rawClass ?? "").trim(),
            course: String(rawCourse ?? "").trim(),
            section: String(rawSection ?? "").trim(),
            shift: String(rawShift ?? "").trim(),
            instituteEmail: String(rawEmail ?? "").trim(),
            submissionDate: String(rawSubmissionDate ?? "").trim(),
            time: String(rawTime ?? "").trim(),
            venue: String(rawVenue ?? "").trim(),
          };
        },
      );

      // Cache the data
      this.cachedData = transformedData;
      this.lastModified = stats.mtime;

      console.info(
        `[CU-REG EXCEL] Loaded ${transformedData.length} records from Excel file`,
      );

      // Debug: Log first record to see column structure
      if (transformedData.length > 0) {
        console.info(`[CU-REG EXCEL] First record sample:`, transformedData[0]);
        console.info(
          `[CU-REG EXCEL] Available columns in Excel:`,
          Object.keys(transformedData[0]),
        );

        // Check for specific student UID mentioned in the issue
        const specificStudent = transformedData.find(
          (record) => record.code === "0804250001",
        );
        if (specificStudent) {
          console.info(
            `[CU-REG EXCEL] Found specific student 0804250001:`,
            specificStudent,
          );
        } else {
          console.warn(
            `[CU-REG EXCEL] Student UID 0804250001 not found in Excel data`,
          );
          console.info(
            `[CU-REG EXCEL] Available student codes (first 10):`,
            transformedData.slice(0, 10).map((r) => r.code),
          );
        }
      }

      return transformedData;
    } catch (error) {
      console.error(`[CU-REG EXCEL] Error loading Excel file: ${error}`);
      throw new Error(
        `Failed to load Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Find student time and venue information by UID (code)
   */
  public static async getStudentTimeVenueInfo(
    studentUid: string,
  ): Promise<StudentTimeVenueInfo> {
    try {
      console.info(
        `[CU-REG EXCEL] Looking up time/venue for student UID: ${studentUid}`,
      );

      const excelData = await this.loadExcelData();

      const normalizedUid = (() => {
        const s = String(studentUid || "").trim();
        return /^\d+$/.test(s) ? s.padStart(10, "0") : s;
      })();

      // Find exact match by normalized code (multiple rows possible; prefer first with both time and venue)
      const matches = excelData.filter((r) => r.code === normalizedUid);
      let studentRecord = matches.find((r) => r.time && r.venue) || matches[0];

      if (!studentRecord) {
        console.warn(
          `[CU-REG EXCEL] No record found for student UID: ${studentUid}`,
        );
        return {
          time: "",
          venue: "",
          submissionDate: "",
          found: false,
        };
      }

      console.info(`[CU-REG EXCEL] Found student record:`, {
        studentUid,
        time: studentRecord.time,
        venue: studentRecord.venue,
        submissionDate: studentRecord.submissionDate,
        studentName: studentRecord.student,
      });

      // Debug: Log all available columns for this record
      console.info(
        `[CU-REG EXCEL] Available columns for debugging:`,
        Object.keys(studentRecord),
      );
      console.info(
        `[CU-REG EXCEL] Raw submission date value:`,
        studentRecord.submissionDate,
      );

      // Preserve submission date exactly as in Excel (no fallback)
      const finalSubmissionDate = studentRecord.submissionDate || "";

      return {
        time: studentRecord.time || "",
        venue: studentRecord.venue || "",
        submissionDate: finalSubmissionDate,
        found: true,
      };
    } catch (error) {
      console.error(
        `[CU-REG EXCEL] Error getting student time/venue info: ${error}`,
      );
      return {
        time: "",
        venue: "",
        submissionDate: "",
        found: false,
      };
    }
  }

  /**
   * Generate QR code content with submission date, time and venue information
   */
  public static generateQRCodeContent(
    time: string,
    venue: string,
    submissionDate: string,
    studentUid: string,
  ): string {
    // Generate human-readable text instead of JSON
    const qrContent = `Physical Registration Details: -

Student UID:\t${studentUid}
Reporting Date:\t${submissionDate}
Reporting Time:\t${time}
Reporting Venue:\t${venue}


Please maintain the above mentioned slot allotted to you for physical submission of your Admission & Registration Datasheet & documents.`;

    return qrContent;
  }

  /**
   * Get all Excel data (for debugging/admin purposes)
   */
  public static async getAllExcelData(): Promise<CuRegistrationExcelData[]> {
    return await this.loadExcelData();
  }

  /**
   * Clear cached data (useful for testing or when file is updated)
   */
  public static clearCache(): void {
    this.cachedData = null;
    this.lastModified = null;
    console.info("[CU-REG EXCEL] Cache cleared");
  }

  /**
   * Check if Excel file exists and is accessible
   */
  public static async isExcelFileAccessible(): Promise<boolean> {
    try {
      const filePath = this.excelFilePath || this.getDefaultExcelFilePath();
      await fs.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sync all Excel schedule rows into DB table cu_physical_reg by matching student.uid to Excel code.
   * - Normalizes UID/code (trim + zero-pad to 10 digits if numeric)
   * - Upserts per student (update if exists, otherwise insert)
   */
  public static async syncAllToDatabase(): Promise<{
    processed: number;
    matched: number;
    inserted: number;
    updated: number;
    unmatched: number;
  }> {
    const rows = await this.getAllExcelData();

    // Load classes and build a case-insensitive lookup map
    const classes = await db
      .select({ id: classModel.id, name: classModel.name })
      .from(classModel);
    const normalizeKey = (s: any) =>
      String(s ?? "")
        .trim()
        .toLowerCase();
    const classNameToId = new Map<string, number>();
    for (const c of classes) {
      classNameToId.set(normalizeKey(c.name), c.id);
    }

    const normalizeUid = (v: any): string => {
      let s = String(v ?? "").trim();
      if (/^\d+$/.test(s)) s = s.padStart(10, "0");
      return s;
    };

    const parseDdMmYyyy = (input: string): Date | null => {
      if (!input) return null;
      const d = String(input).trim();

      // 1) dd/mm/yyyy or d/m/yyyy
      let m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) {
        const day = Number(m[1]);
        const month = Number(m[2]) - 1;
        const year = Number(m[3]);
        return new Date(Date.UTC(year, month, day));
      }

      // 2) dd-mm-yyyy or d-m-yyyy
      m = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (m) {
        const day = Number(m[1]);
        const month = Number(m[2]) - 1;
        const year = Number(m[3]);
        return new Date(Date.UTC(year, month, day));
      }

      // 3) Excel serial number (as string or number)
      if (/^\d+(\.\d+)?$/.test(d)) {
        const serial = parseFloat(d);
        if (!isNaN(serial)) {
          const ms = (serial - 25569) * 86400 * 1000;
          const date = new Date(ms);
          if (!isNaN(date.getTime()))
            return new Date(
              Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
              ),
            );
        }
      }

      // 4) Fallback: Date constructor (handles ISO etc.)
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const formatExcelTimeTo12h = (input: any): string => {
      const s = String(input ?? "").trim();
      if (!s) return "";
      // Numeric fraction of day (e.g., 0.4375)
      if (/^\d+(\.\d+)?$/.test(s)) {
        const fraction = parseFloat(s);
        if (!isNaN(fraction)) {
          const totalMinutes = Math.round(fraction * 24 * 60);
          const hours24 = Math.floor(totalMinutes / 60) % 24;
          const minutes = totalMinutes % 60;
          const period = hours24 >= 12 ? "PM" : "AM";
          const hours12 = hours24 % 12 || 12;
          return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
        }
      }
      // Already a time string; return as-is
      return s;
    };

    let processed = 0;
    let matched = 0;
    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      processed++;
      const code = normalizeUid(row.code);
      if (!code) continue;

      // Find student by exact uid
      const [student] = await db
        .select({ id: studentModel.id, uid: studentModel.uid })
        .from(studentModel)
        .where(eq(studentModel.uid, code))
        .limit(1);

      if (!student) {
        continue; // unmatched
      }
      matched++;

      // Resolve classId from Excel class string (case-insensitive, trimmed)
      const classNameKey = normalizeKey(row.class);
      const classId = classNameToId.get(classNameKey);
      if (!classId) {
        // If class not resolvable, skip this row to avoid wrong associations
        console.warn(
          `[CU-REG EXCEL] Skipping UID ${code} due to unknown class '${row.class}'`,
        );
        continue;
      }

      const submissionDate = parseDdMmYyyy(row.submissionDate);
      const submissionDateStr = submissionDate
        ? submissionDate.toISOString().slice(0, 10)
        : null; // allow null in DB
      const time = formatExcelTimeTo12h(row.time);
      const venue = String(row.venue || "").trim();

      // Check if record exists for this student
      const [existing] = await db
        .select({ id: cuPhysicalRegModel.id })
        .from(cuPhysicalRegModel)
        .where(
          // composite match (studentId, classId)
          // @ts-ignore drizzle types allow and()
          (await import("drizzle-orm")).and(
            eq(cuPhysicalRegModel.studentId, student.id),
            eq(cuPhysicalRegModel.classId, classId),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(cuPhysicalRegModel)
          .set({
            time,
            venue,
            submissionDate: submissionDateStr as any,
            updatedAt: new Date(),
          })
          .where(eq(cuPhysicalRegModel.id, existing.id));
        updated++;
      } else {
        await db.insert(cuPhysicalRegModel).values({
          studentId: student.id,
          classId,
          time,
          venue,
          submissionDate: submissionDateStr as any,
        });
        inserted++;
      }
    }

    const result = {
      processed,
      matched,
      inserted,
      updated,
      unmatched: processed - matched,
    };
    console.info("[CU-REG EXCEL] Sync complete:", result);
    return result;
  }
}
