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
