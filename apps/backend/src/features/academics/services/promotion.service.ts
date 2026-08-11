import { db } from "@/db";
import { enqueueNotification } from "@/services/notificationClient";
import {
  academicYearModel,
  classModel,
  notificationMasterModel,
  promotionModel,
  sessionModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import crypto from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import XLSX from "xlsx";
import ExcelJS from "exceljs";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling";

export async function findPromotionByStudentIdAndClassId(
  studentId: number,
  classId: number,
  opts?: { activeOnly?: boolean },
) {
  // activeOnly: only the ongoing promotion — endDate still NULL (a completed
  // promotion gets its endDate stamped, e.g. Sem I ended 2026-05-03 while the
  // running Sem II row has endDate NULL) and not deprecated. Used by the CU
  // Semester II exam-form flow; latest by startDate wins if several.
  const rows = await db
    .select()
    .from(promotionModel)
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .where(
      and(
        eq(studentModel.id, studentId),
        eq(classModel.id, classId),
        ...(opts?.activeOnly
          ? [
              isNull(promotionModel.endDate),
              eq(promotionModel.isDeprecated, false),
            ]
          : []),
      ),
    )
    .orderBy(desc(promotionModel.startDate), desc(promotionModel.createdAt))
    .limit(1);

  return rows[0]?.promotions;
}

export async function markExamFormSubmission(
  promotionId: number,
  userId: number,
  adminStaffUserId: number | undefined,
) {
  const [updatedPromotion] = await db
    .update(promotionModel)
    .set({
      isExamFormSubmitted: true,
      examFormSubmissionTimeStamp: new Date(),
    })
    .where(and(eq(promotionModel.id, promotionId)))
    .returning();

  const [tmpResult] = await db
    .select({
      academicYearName: academicYearModel.year,
      semester: classModel.name,
      name: userModel.name,
    })
    .from(promotionModel)
    .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, sessionModel.academicYearId),
    )
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))

    .where(eq(promotionModel.id, promotionId));

  console.log("Notify the user..");

  // "SEMESTER II" -> "Semester II". Title-casing every word would render the
  // roman numeral as "Ii", so numerals are uppercased whole. The lookahead
  // pattern is a strict roman check, so ordinary words that happen to be built
  // from roman letters (e.g. "civil", "mix") are still title-cased normally.
  const formattedSemester = tmpResult
    .semester!.toLowerCase()
    .replace(/\b[a-z]+\b/g, (word) =>
      /^(?=[ivxlcdm]+$)m*(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/.test(
        word,
      )
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    );

  try {
    await notifyExamForm(
      userId,
      adminStaffUserId,
      tmpResult.academicYearName!,
      tmpResult.academicYearName!.substring(0, 4),
      formattedSemester,
      tmpResult.name!,
      process.env.VITE_APP_STUDENT_CONSOLE_URL!,
    );
  } catch (error) {
    console.error("Error notifying exam form submission:", error);
  }

  await broadcastExamFormTrackerUpdate(promotionId);

  return updatedPromotion;
}

/**
 * Push the realtime-tracker "Exam Form Uploaded" count to online viewers after
 * a submission. Broadcasts the unfiltered room plus the room for the
 * promotion's academic year (the tracker's default filter set is year-scoped).
 * Lazy import + try/catch: a broadcast failure must never fail the submission.
 */
async function broadcastExamFormTrackerUpdate(
  promotionId: number,
): Promise<void> {
  try {
    const { scheduleRealtimeTrackerBroadcast } =
      await import("@/features/realtime-tracker/realtime-tracker.socket.js");
    const [row] = await db
      .select({ academicYearId: sessionModel.academicYearId })
      .from(promotionModel)
      .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
      .where(eq(promotionModel.id, promotionId))
      .limit(1);
    scheduleRealtimeTrackerBroadcast(
      "exam_form_declaration",
      "exam_form_submitted",
      {},
    );
    if (row?.academicYearId) {
      scheduleRealtimeTrackerBroadcast(
        "exam_form_declaration",
        "exam_form_submitted",
        { academicYearIds: [row.academicYearId] },
      );
    }
  } catch (e) {
    console.error(
      "[promotion] exam-form tracker broadcast failed:",
      (e as Error)?.message,
    );
  }
}

export async function notifyExamForm(
  userId: number,
  adminStaffUserId: number | undefined,
  academicYearName: string,
  academicYear: string,
  semester: string,
  name: string,
  studentConsoleUrl: string,
) {
  console.log("notifyExamForm()..");
  // TODO
  const [emailMaster] = await db
    .select()
    .from(notificationMasterModel)
    .where(and(eq(notificationMasterModel.template, "exam-form-submission")));

  if (!emailMaster) {
    console.log("Return");
    return;
  }

  const otherUsersEmails: string[] = []; // TODO
  const subject = `${process.env.NODE_ENV === "development" ? "[DEV] " : process.env.NODE_ENV === "staging" ? "[STAGE] " : ""}Exam Form Submission Confirmation`;
  const notificationData = {
    userId,
    adminStaffUserId: adminStaffUserId ? adminStaffUserId : null,
    variant: "EMAIL" as const,
    type: "EXAM" as const,
    message: `Exam Form Submission Confirmation`,
    notificationMasterId: emailMaster.id,
    otherUsersEmails:
      otherUsersEmails.length > 0 ? otherUsersEmails : undefined,
    otherUsersWhatsAppNumbers: undefined, // Email variant doesn't need WhatsApp numbers
    notificationEvent: {
      templateData: {
        academicYearName,
        academicYear,
        semester,
        name,
        studentConsoleUrl,
        subject,
      },
    },
  };

  enqueueNotification(notificationData);
}

// const getInitialStatus = () => {
//     if (userData?.isSuspended) return "SUSPENDED";
//     if (data?.hasCancelledAdmission) return "CANCELLED_ADMISSION";
//     if (data?.takenTransferCertificate) return "TC";
//     if (data?.alumni && data?.active) return "GRADUATED_WITH_SUPP";
//     if (data?.alumni && !data?.active) return "COMPLETED_LEFT";
//     if (!data?.active && (data?.leavingDate || data?.leavingReason)) return "DROPPED_OUT";
//     if (data?.active) return "REGULAR";
//     return "DROPPED_OUT";
//   };

/**
 * Stable HMAC guard for the exam-form tunnel links: not guessable from a UID
 * alone, verifiable without any DB lookup, and never expires (unlike S3
 * presigned URLs). Secret = ACCESS_TOKEN_SECRET (always configured).
 */
export function examFormDownloadSig(uid: string): string {
  return crypto
    .createHmac("sha256", process.env.ACCESS_TOKEN_SECRET || "a360-exam-form")
    .update(`exam-form:${uid}`)
    .digest("hex");
}

/**
 * Public base URL for links that must reach this Express app from outside
 * (same precedence as the fee-receipt email links).
 */
function getApiPublicOrigin(): string {
  for (const key of [
    "API_PUBLIC_ORIGIN",
    "BACKEND_PUBLIC_URL",
    "BACKEND_URL",
  ]) {
    const v = process.env[key];
    if (v && String(v).trim()) return String(v).trim().replace(/\/$/, "");
  }
  const port = process.env.PORT || "8080";
  return `http://localhost:${port}`;
}

export function buildExamFormDownloadUrl(uid: string): string {
  return `${getApiPublicOrigin()}/api/promotions/exam-form/${encodeURIComponent(uid)}/download?sig=${examFormDownloadSig(uid)}`;
}

function sqlIntIn(column: string, ids?: number[]) {
  const clean = ids?.filter((n) => Number.isInteger(n) && n > 0) ?? [];
  if (!clean.length) return sql``;
  return sql.raw(` AND ${column} IN (${clean.join(",")})`);
}

export async function exportPromotionStudentsReport(params: {
  sessionId?: number;
  classId?: number;
  academicYearId?: number;
  programCourseIds?: number[];
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  classIds?: number[];
}) {
  const {
    sessionId,
    classId,
    academicYearId,
    programCourseIds,
    affiliationIds,
    regulationTypeIds,
    classIds,
  } = params;

  const { rows } = await db.execute(sql`
  SELECT 
    u.name AS name,
    std.uid AS uid,
    pc.name AS program_course,
    -- Academic year
    ay.year AS academic_year,
     -- Derived student status (based on users + students table)
    CASE
      WHEN std.is_no_show = true THEN 'NO_SHOW'
      WHEN u.is_suspended = true THEN 'SUSPENDED'
      WHEN std.has_cancelled_admission = true THEN 'CANCELLED_ADMISSION'
      WHEN std.taken_transfer_certificate = true THEN 'TC'
      WHEN std.alumni = true AND std.active = true THEN 'GRADUATED_WITH_SUPP'
      WHEN std.alumni = true AND std.active = false THEN 'COMPLETED_LEFT'
      WHEN std.active = false
           AND (std.leaving_date IS NOT NULL OR std.leaving_reason IS NOT NULL)
           THEN 'DROPPED_OUT'
      WHEN u.is_active = true THEN 'REGULAR'
      ELSE 'DROPPED_OUT'
    END AS status,
    cls.name AS semester,
pr.is_exam_form_submitted AS "is_exam_form_submitted?",
    TO_CHAR(
  pr.exam_form_submission_time_stamp,
  'DD/MM/YYYY, HH12:MI:SS AM'
) AS date_of_upload,

   
    sec.name AS section,
    sh.name AS shift,
    


    pd.email AS personal_email,
    COALESCE(pd.whatsapp_number, u.whatsapp_number) AS whatsapp_number,
    

 std.registration_number AS registration_number,
    std.roll_number AS roll_number

  FROM students std
  -- deprecated promotion rows are stale duplicates; keep the join LEFT so a
  -- student without promotions still appears (condition lives in the ON clause)
  LEFT JOIN promotions pr ON pr.student_id_fk = std.id
    AND COALESCE(pr.is_deprecated, false) = false
  JOIN users u ON u.id = std.user_id_fk
  LEFT JOIN program_courses pc ON pc.id = pr.program_course_id_fk
  LEFT JOIN affiliations aff ON aff.id = pc.affiliation_id_fk
  LEFT JOIN regulation_types reg ON reg.id = pc.regulation_type_id_fk
  LEFT JOIN classes cls ON cls.id = pr.class_id_fk
  LEFT JOIN sections sec ON sec.id = pr.section_id_fk
  LEFT JOIN shifts sh ON sh.id = pr.shift_id_fk
  LEFT JOIN sessions s ON s.id = pr.session_id_fk
  LEFT JOIN academic_years ay ON ay.id = s.academic_id_fk
  LEFT JOIN personal_details pd ON pd.user_id_fk = std.user_id_fk

  WHERE 1=1
  ${sessionId ? sql` AND pr.session_id_fk = ${sessionId}` : sql``}
  ${classId && !classIds?.length ? sql` AND pr.class_id_fk = ${classId}` : sql``}
  ${academicYearId ? sql` AND ay.id = ${academicYearId}` : sql``}
  ${sqlIntIn("pc.id", programCourseIds)}
  ${sqlIntIn("pc.affiliation_id_fk", affiliationIds)}
  ${sqlIntIn("pc.regulation_type_id_fk", regulationTypeIds)}
  ${sqlIntIn("pr.class_id_fk", classIds)}
  ORDER BY pr.exam_form_submission_time_stamp
`);

  // Attach a stable link to each submitted form PDF, served through the
  // backend tunnel endpoint (GET /api/promotions/exam-form/:uid/download),
  // guarded by a per-UID HMAC signature — unlike S3 presigned URLs these
  // links in the exported sheet never expire, and the bucket stays private.
  const formUrls: (string | null)[] = [];
  for (const row of rows) {
    const submitted =
      (row as Record<string, unknown>)["is_exam_form_submitted?"] === true;
    const uid = (row as Record<string, unknown>)["uid"];
    let url: string | null = null;
    if (submitted && typeof uid === "string" && uid) {
      url = buildExamFormDownloadUrl(uid);
    }
    formUrls.push(url);
    // Short placeholder so column-width calculation isn't blown up by the
    // long URL; the real hyperlink is set on the cell after styling.
    (row as Record<string, unknown>)["submitted_form"] = url ? "Open Form" : "";
  }

  // Build Excel from rows
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("exam-form-submissions");

  if (rows.length > 0) {
    // Transform rows: convert booleans to Yes/No and nulls to empty strings
    const transformedRows = rows.map((row) => transformRowForExcel(row));

    // Define columns from first row keys with sentence case headers
    const headers = Object.keys(transformedRows[0]);

    // Calculate column widths based on header and transformed data
    sheet.columns = headers.map((header) => {
      const sentenceCaseHeader = toSentenceCase(header);
      // Get all transformed data for this column to find maximum length
      const allColumnData = transformedRows.map((row) => row[header]);
      const width = calculateColumnWidth(sentenceCaseHeader, allColumnData);

      return {
        header: sentenceCaseHeader,
        key: header,
        width,
      };
    });

    // Add transformed rows
    transformedRows.forEach((row) => {
      sheet.addRow(row);
    });

    // Recalculate column widths after adding all rows to ensure accuracy
    headers.forEach((header, colIndex) => {
      const sentenceCaseHeader = toSentenceCase(header);
      const allColumnData = transformedRows.map((row) => row[header]);
      const calculatedWidth = calculateColumnWidth(
        sentenceCaseHeader,
        allColumnData,
      );
      const column = sheet.getColumn(colIndex + 1);
      if (column) {
        column.width = calculatedWidth;
      }
    });

    applyStandardExcelReportTableStyling(sheet);

    // Turn the "submitted form" placeholders into real hyperlinks (after
    // styling so the link font survives). Data rows start at row 2.
    const linkCol = headers.indexOf("submitted_form") + 1;
    if (linkCol > 0) {
      formUrls.forEach((url, i) => {
        if (!url) return;
        const cell = sheet.getRow(i + 2).getCell(linkCol);
        cell.value = { text: "Open Form", hyperlink: url };
        cell.font = { color: { argb: "FF1D4ED8" }, underline: true };
      });
    }
  } else {
    sheet.columns = [{ header: "message", key: "message", width: 20 }];
    sheet.addRow({ message: "No data available" });
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    buffer: Buffer.isBuffer(excelBuffer)
      ? excelBuffer
      : Buffer.from(excelBuffer),
    fileName: `exam_form_submissions_${timestamp}.xlsx`,
    totalRecords: rows.length,
  };
}

// Helper function to transform data values for Excel export
function transformValueForExcel(value: any): any {
  // Convert null or undefined to empty string
  if (value === null || value === undefined) {
    return "";
  }

  // Convert boolean to Yes/No
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Return value as-is for other types
  return value;
}

function transformRowForExcel(row: Record<string, any>): Record<string, any> {
  const transformedRow: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    transformedRow[key] = transformValueForExcel(value);
  }
  return transformedRow;
}

function toSentenceCase(str: string): string {
  let result = str
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Remove "Student" prefix from registration and roll number headers
  result = result.replace(
    /^Student Registration Number$/,
    "Registration Number",
  );
  result = result.replace(/^Student Roll Number$/, "Roll Number");

  return result;
}
function calculateColumnWidth(header: string, allData?: any[]): number {
  const headerLength = header.length;
  let maxDataLength = headerLength;

  // Check all data if provided to find maximum length
  if (allData && allData.length > 0) {
    const allLengths = allData.map((val) => {
      if (val === null || val === undefined) return 0;
      const str = String(val);
      // For very long strings, consider wrapping - but still use full length for width
      return str.length;
    });
    maxDataLength = Math.max(headerLength, ...allLengths);
  }

  // Add generous padding (5 characters) and ensure minimum width of 12
  // Remove max cap to allow columns to expand as needed
  const calculatedWidth = Math.max(maxDataLength + 5, 12);

  // Cap at 100 to prevent extremely wide columns, but allow more flexibility
  return Math.min(calculatedWidth, 100);
}
