import { readExcelFile } from "../utils/readExcel.js";
import path from "path";
import fs from "fs/promises";

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
   * Get the default Excel file path from the public directory
   */
  public static getDefaultExcelFilePath(): string {
    const publicDir = path.join(process.cwd(), "public");
    const excelFileName =
      "CU Registration Physical submission allotment 2025.xlsx"; // Based on actual file name
    return path.join(publicDir, excelFileName);
  }

  /**
   * Load Excel data from file
   */
  private static async loadExcelData(): Promise<CuRegistrationExcelData[]> {
    const filePath = this.excelFilePath || this.getDefaultExcelFilePath();

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

      // Transform raw data to our interface
      const transformedData: CuRegistrationExcelData[] = rawData.map(
        (row: any, index: number) => {
          // Handle different possible column names/structures
          // Try all possible column name variations
          const rawSubmissionDate =
            row["Submission dat"] ||
            row["SubmissionDate"] ||
            row["submissionDate"] ||
            row["Submission Date"] ||
            row["submission date"] ||
            row["Date"] ||
            row["date"] ||
            row["Submission"] ||
            row["submission"] ||
            "";
          const rawTime = row["Time"] || row["time"] || "";

          // Debug: Log all available columns for first few records
          if (index < 3) {
            console.info(
              `[CU-REG EXCEL] Available columns in row ${index + 1}:`,
              Object.keys(row),
            );
            console.info(`[CU-REG EXCEL] Raw row data:`, row);
          }

          // Debug logging for first few records
          if (index < 3) {
            console.info(`[CU-REG EXCEL] Record ${index + 1} raw values:`, {
              rawSubmissionDate,
              rawTime,
              submissionDateType: typeof rawSubmissionDate,
              timeType: typeof rawTime,
            });
          }

          // Format submission date properly
          let formattedSubmissionDate = "";
          if (rawSubmissionDate) {
            try {
              // If it's a number (Excel date serial), convert it
              if (typeof rawSubmissionDate === "number") {
                // Check if it's just a year (like 2025)
                if (rawSubmissionDate >= 2000 && rawSubmissionDate <= 2100) {
                  console.warn(
                    `[CU-REG EXCEL] Date appears to be just year: ${rawSubmissionDate}, using fallback`,
                  );
                  formattedSubmissionDate = `03/11/${rawSubmissionDate}`; // Default to Nov 3rd
                } else {
                  // Excel date serial number - convert to date
                  const date = new Date(
                    (rawSubmissionDate - 25569) * 86400 * 1000,
                  );
                  formattedSubmissionDate = date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                }
              } else if (typeof rawSubmissionDate === "string") {
                // If it's already a string, try to parse and format it
                const parsedDate = new Date(rawSubmissionDate);
                if (!isNaN(parsedDate.getTime())) {
                  formattedSubmissionDate = parsedDate.toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    },
                  );
                } else {
                  formattedSubmissionDate = rawSubmissionDate; // Use as-is if can't parse
                }
              } else {
                formattedSubmissionDate = String(rawSubmissionDate);
              }
            } catch (error) {
              console.warn(
                `[CU-REG EXCEL] Error formatting submission date: ${error}`,
              );
              formattedSubmissionDate = String(rawSubmissionDate);
            }
          }

          // If submission date is still empty, use default
          if (!formattedSubmissionDate) {
            console.warn(
              `[CU-REG EXCEL] No submission date found, using default: 03/11/2025`,
            );
            formattedSubmissionDate = "03/11/2025";
          }

          // Format time properly
          let formattedTime = "";
          if (rawTime) {
            try {
              // If it's a number (Excel time decimal), convert it
              if (typeof rawTime === "number") {
                // Excel time is stored as decimal fraction of a day
                const totalSeconds = Math.round(rawTime * 24 * 60 * 60);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);

                // Format as 12-hour time
                const period = hours >= 12 ? "PM" : "AM";
                const displayHours =
                  hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                formattedTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
              } else if (typeof rawTime === "string") {
                // If it's already a string, try to parse and format it
                const timeMatch = rawTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (timeMatch) {
                  formattedTime = rawTime; // Already formatted
                } else {
                  // Try to parse as time
                  const parsedTime = new Date(`2000-01-01 ${rawTime}`);
                  if (!isNaN(parsedTime.getTime())) {
                    formattedTime = parsedTime.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                  } else {
                    formattedTime = rawTime; // Use as-is if can't parse
                  }
                }
              } else {
                formattedTime = String(rawTime);
              }
            } catch (error) {
              console.warn(`[CU-REG EXCEL] Error formatting time: ${error}`);
              formattedTime = String(rawTime);
            }
          }

          // If time is still empty, use default
          if (!formattedTime) {
            console.warn(
              `[CU-REG EXCEL] No time found, using default: 10:30 AM`,
            );
            formattedTime = "10:30 AM";
          }

          // Debug logging for first few records after formatting
          if (index < 3) {
            console.info(
              `[CU-REG EXCEL] Record ${index + 1} formatted values:`,
              {
                formattedSubmissionDate,
                formattedTime,
              },
            );
          }

          return {
            srNo: row["Sr. No"] || row["Sr No"] || row["SrNo"] || index + 1,
            code: row["Code"] || row["code"] || "",
            student: row["Student"] || row["student"] || "",
            class: row["Class"] || row["class"] || "",
            course: row["Course"] || row["course"] || "",
            section: row["Section"] || row["section"] || "",
            shift: row["Shift"] || row["shift"] || "",
            instituteEmail:
              row["Institute Email"] ||
              row["InstituteEmail"] ||
              row["instituteEmail"] ||
              "",
            submissionDate: formattedSubmissionDate,
            time: formattedTime,
            venue: row["Venue"] || row["venue"] || "",
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

      // Find student by code (UID)
      const studentRecord = excelData.find(
        (record) =>
          record.code === studentUid || record.code === studentUid.toString(),
      );

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

      // If submission date is empty, try to provide a fallback
      let finalSubmissionDate = studentRecord.submissionDate || "";
      if (!finalSubmissionDate) {
        // Try to extract year from filename or provide current year
        const currentYear = new Date().getFullYear();
        finalSubmissionDate = `2025`; // Default to 2025 as mentioned in filename
        console.warn(
          `[CU-REG EXCEL] No submission date found, using fallback: ${finalSubmissionDate}`,
        );
      }

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
}
