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

  await notifyExamForm(
    userId,
    adminStaffUserId,
    tmpResult.academicYearName!,
    tmpResult.academicYearName!.substring(0, 4), // TODO
    formattedSemester,
    tmpResult.name!,
    process.env.VITE_APP_STUDENT_CONSOLE_URL!,
  );
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

export async function exportPromotionStudentsReport(params: {
  sessionId?: number;
  classId?: number;
}) {
  const { sessionId, classId } = params;

  const { rows } = await db.execute(sql`
    SELECT 
      std.uid AS student_uid,
      u.name AS student_name,
      std.registration_number AS registration_number,
      std.roll_number AS roll_number,
      pc.name AS program_course_name,
      cls.name AS class_name,
      sec.name AS section_name,
      sh.name AS shift_name,
      pr.is_exam_form_submitted AS is_exam_form_submitted,
      -- New fields
      ay.year AS academic_year,
      cls.name AS semester, -- using class name as semester for now
      ussm.tag AS student_status,
      pd.email AS personal_email,
      COALESCE(pd.whatsapp_number, u.whatsapp_number) AS whatsapp_number,
      pr.exam_form_submission_time_stamp AS date_of_upload
    FROM promotions pr
    JOIN students std ON pr.student_id_fk = std.id
    JOIN users u ON u.id = std.user_id_fk
    LEFT JOIN program_courses pc ON pc.id = pr.program_course_id_fk
    LEFT JOIN classes cls ON cls.id = pr.class_id_fk
    LEFT JOIN sections sec ON sec.id = pr.section_id_fk
    LEFT JOIN shifts sh ON sh.id = pr.shift_id_fk
    -- Academic year
    LEFT JOIN sessions s ON s.id = pr.session_id_fk
    LEFT JOIN academic_years ay ON ay.id = s.academic_id_fk
    -- Personal details for email and WhatsApp
    LEFT JOIN personal_details pd ON pd.user_id_fk = std.user_id_fk
    -- Latest active student status for this promotion (avoid duplicates)
    LEFT JOIN LATERAL (
      SELECT usm1.*
      FROM user_status_mapping usm1
      WHERE usm1.student_id_fk = std.id
        AND usm1.promotion_id_fk = pr.id
        AND usm1.is_active = true
      ORDER BY usm1.id DESC
      LIMIT 1
    ) usm ON TRUE
    LEFT JOIN user_statuses_master ussm ON ussm.id = usm.user_status_master_id_fk
    WHERE 1=1
    ${sessionId ? sql` AND pr.session_id_fk = ${sessionId}` : sql``}
    ${classId ? sql` AND pr.class_id_fk = ${classId}` : sql``}
  `);

  // Build Excel from rows
  const worksheet = XLSX.utils.json_to_sheet(rows || []);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Promotions");

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `promotion_students_${timestamp}.xlsx`;

  return {
    buffer: excelBuffer,
    fileName,
    totalRecords: rows?.length ?? 0,
  };
}
