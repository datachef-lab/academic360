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
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import XLSX from "xlsx";
import ExcelJS from "exceljs";

export async function findPromotionByStudentIdAndClassId(
  studentId: number,
  classId: number,
) {
  const [{ promotions: promotion }] = await db
    .select()
    .from(promotionModel)
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .where(and(eq(studentModel.id, studentId), eq(classModel.id, classId)));

  return promotion;
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

  const formattedSemester = tmpResult
    .semester!.toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
  return updatedPromotion;
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

export async function exportPromotionStudentsReport(params: {
  sessionId?: number;
  classId?: number;
}) {
  const { sessionId, classId } = params;

  const { rows } = await db.execute(sql`
  SELECT 
    u.name AS name,
    std.uid AS uid,
    pc.name AS program_course,
    -- Academic year
    ay.year AS academic_year,
     -- Derived student status (based on users + students table)
    CASE
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
  LEFT JOIN promotions pr ON pr.student_id_fk = std.id
  JOIN users u ON u.id = std.user_id_fk
  LEFT JOIN program_courses pc ON pc.id = pr.program_course_id_fk
  LEFT JOIN classes cls ON cls.id = pr.class_id_fk
  LEFT JOIN sections sec ON sec.id = pr.section_id_fk
  LEFT JOIN shifts sh ON sh.id = pr.shift_id_fk
  LEFT JOIN sessions s ON s.id = pr.session_id_fk
  LEFT JOIN academic_years ay ON ay.id = s.academic_id_fk
  LEFT JOIN personal_details pd ON pd.user_id_fk = std.user_id_fk

  WHERE 1=1
  ${sessionId ? sql` AND pr.session_id_fk = ${sessionId}` : sql``}
  ${classId ? sql` AND pr.class_id_fk = ${classId}` : sql``}
  ORDER BY pr.exam_form_submission_time_stamp
`);

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

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }, // Grey background
    };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add borders to all cells
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } },
          };
        });
      }
    });

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: 1 }];
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
