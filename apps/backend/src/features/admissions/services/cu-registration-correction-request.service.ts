import { db, pool } from "@/db/index.js";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { studentModel } from "@repo/db/schemas/models/user";
import { userModel } from "@repo/db/schemas/models/user";
import {
  personalDetailsModel,
  addressModel,
  personModel,
  familyModel,
} from "@repo/db/schemas/models/user";
import {
  documentModel,
  sessionModel,
  academicYearModel,
} from "@repo/db/schemas/models/academics";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model";
import {
  eq,
  and,
  desc,
  count,
  ilike,
  or,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";
import { CuRegistrationCorrectionRequestInsertTypeT } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { cuRegistrationDocumentUploadInsertTypeT } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import {
  CuRegistrationCorrectionRequestDto,
  CuRegistrationDocumentUploadDto,
} from "@repo/db/dtos/admissions/index.js";
import { CuRegistrationNumberService } from "@/services/cu-registration-number.service.js";
import { CuRegistrationPdfIntegrationService } from "@/services/cu-registration-pdf-integration.service.js";
import { notificationMasterModel } from "@repo/db/schemas/models/notifications";
import { enqueueNotification } from "@/services/notificationClient.js";
import { socketService } from "@/services/socketService.js";
import { getMisTableData } from "@/features/subject-selection/services/student-subject-selection.service.js";
import { AdmRegFormService } from "./adm-reg-form.service.js";
import {
  nationalityModel,
  religionModel,
  categoryModel,
  languageMediumModel,
} from "@repo/db/schemas/models/resources";
import {
  countryModel,
  stateModel,
  cityModel,
  districtModel,
} from "@repo/db/schemas/models/resources";
import {
  programCourseModel,
  regulationTypeModel,
  specializationModel,
} from "@repo/db/schemas/models/course-design";
import { admissionAcademicInfoModel } from "@repo/db/schemas/models/admissions";
import ExcelJS from "exceljs";
import { getCuRegPdfPathDynamic } from "./cu-registration-document-path.service.js";
import { getSignedUrlForFile } from "@/services/s3.service.js";
import axios from "axios";
import { UserDto } from "@repo/db/index.js";

// Environment detection helpers
const shouldRedirectToDeveloper = () => {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === "development";
};

const shouldSendToStaffOnly = () => {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === "staging";
};

const getDeveloperContact = () => {
  const devEmail = process.env.DEVELOPER_EMAIL;
  const devPhone = process.env.DEVELOPER_PHONE;

  if (!devEmail || !devPhone) {
    console.warn(
      "⚠️ Developer contact info not configured in environment variables",
    );
  }

  return { devEmail, devPhone };
};

// Helper function to check if user is staff with staging notification enabled
const isStaffWithStagingNotification = async (
  email: string,
): Promise<boolean> => {
  try {
    const [user] = await db
      .select({
        userType: userModel.type,
        sendStagingNotifications: userModel.sendStagingNotifications,
        isActive: userModel.isActive,
        isSuspended: userModel.isSuspended,
      })
      .from(userModel)
      .where(eq(userModel.email, email));

    if (!user) {
      console.log(`👤 User not found for email: ${email}`);
      return false;
    }

    const isStaff = user.userType === "STAFF" || user.userType === "ADMIN";
    const hasStagingFlag = user.sendStagingNotifications === true;
    const isActive = user.isActive === true;
    const isNotSuspended = user.isSuspended === false;

    console.log(
      `👤 User ${email}: staff=${isStaff}, stagingNotification=${hasStagingFlag}, active=${isActive}, notSuspended=${isNotSuspended}`,
    );

    return isStaff && hasStagingFlag && isActive && isNotSuspended;
  } catch (error) {
    console.error("❌ Error checking staff status:", error);
    return false;
  }
};

/**
 * Fetch academic year ID for a student from promotion table
 * @param studentId - Student ID
 * @returns Academic year ID or null if not found
 */
async function getAcademicYearIdByStudentId(
  studentId: number,
): Promise<number | null> {
  try {
    const [promotionData] = await db
      .select({
        academicYearId: academicYearModel.id,
      })
      .from(promotionModel)
      .innerJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .innerJoin(
        academicYearModel,
        eq(sessionModel.academicYearId, academicYearModel.id),
      )
      .where(eq(promotionModel.studentId, studentId))
      .orderBy(desc(promotionModel.createdAt)) // Get the most recent promotion
      .limit(1);

    if (promotionData?.academicYearId) {
      console.info(
        `[CU-REG CORRECTION] Found academic year ID for student ${studentId}:`,
        promotionData.academicYearId,
      );
      return promotionData.academicYearId;
    }

    console.warn(
      `[CU-REG CORRECTION] No academic year found for student ${studentId}`,
    );
    return null;
  } catch (error) {
    console.error(
      `[CU-REG CORRECTION] Error fetching academic year for student ${studentId}:`,
      error,
    );
    return null;
  }
}

// CREATE
export async function createCuRegistrationCorrectionRequest(
  requestData: CuRegistrationCorrectionRequestInsertTypeT,
): Promise<CuRegistrationCorrectionRequestDto | null> {
  console.info(
    "[CU-REG CORRECTION][CREATE] Incoming payload",
    JSON.stringify({
      studentId: requestData.studentId,
      cuRegistrationApplicationNumber:
        requestData.cuRegistrationApplicationNumber,
    }),
  );

  // Don't generate application number initially - it will be generated only when all declarations are completed
  const requestDataWithoutNumber = {
    ...requestData,
  };

  // Fetch academic year ID for the student
  const academicYearId = await getAcademicYearIdByStudentId(
    requestData.studentId,
  );
  if (academicYearId) {
    requestDataWithoutNumber.academicYearId = academicYearId;
    console.info(
      `[CU-REG CORRECTION][CREATE] Set academic year ID: ${academicYearId} for student: ${requestData.studentId}`,
    );
  } else {
    console.warn(
      `[CU-REG CORRECTION][CREATE] No academic year ID found for student: ${requestData.studentId}`,
    );
  }

  const [newRequest] = await db
    .insert(cuRegistrationCorrectionRequestModel)
    .values(requestDataWithoutNumber)
    .returning();

  console.info(
    "[CU-REG CORRECTION][CREATE] Created without application number",
    JSON.stringify({
      id: newRequest.id,
      studentId: newRequest.studentId,
      application: newRequest.cuRegistrationApplicationNumber,
    }),
  );
  return await modelToDto(newRequest);
}

// Get next available CU Registration Application Number
export async function getNextCuRegistrationApplicationNumber(): Promise<string> {
  return await CuRegistrationNumberService.generateNextApplicationNumber();
}

// Validate CU Registration Application Number
export async function validateCuRegistrationApplicationNumber(
  applicationNumber: string,
): Promise<{
  isValid: boolean;
  isAvailable: boolean;
  message?: string;
}> {
  const isValid = CuRegistrationNumberService.isValidFormat(applicationNumber);

  if (!isValid) {
    return {
      isValid: false,
      isAvailable: false,
      message: "Invalid format. Must be in format 017XXXX (4 digits after 017)",
    };
  }

  const isAvailable =
    await CuRegistrationNumberService.isApplicationNumberAvailable(
      applicationNumber,
    );

  return {
    isValid: true,
    isAvailable,
    message: isAvailable ? "Number is available" : "Number is already in use",
  };
}

// Get CU Registration Application Number statistics
export async function getCuRegistrationApplicationNumberStats(): Promise<{
  totalIssued: number;
  nextAvailable: string;
  lastIssued: string | null;
  range: { min: string; max: string };
}> {
  return await CuRegistrationNumberService.getApplicationNumberStats();
}

// READ - Get by ID
export async function findCuRegistrationCorrectionRequestById(
  id: number,
): Promise<CuRegistrationCorrectionRequestDto | null> {
  const [request] = await db
    .select()
    .from(cuRegistrationCorrectionRequestModel)
    .where(eq(cuRegistrationCorrectionRequestModel.id, id));

  if (!request) return null;

  return await modelToDto(request);
}

// READ - Get all with pagination and filters
export async function findAllCuRegistrationCorrectionRequests(
  page: number = 1,
  limit: number = 10,
  status?: string,
  studentId?: number,
  search?: string,
): Promise<{
  requests: CuRegistrationCorrectionRequestDto[];
  total: number;
  totalPages: number;
}> {
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (status) {
    whereConditions.push(
      eq(cuRegistrationCorrectionRequestModel.status, status as any),
    );
  }

  if (studentId) {
    whereConditions.push(
      eq(cuRegistrationCorrectionRequestModel.studentId, studentId),
    );
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(userModel.name, `%${search}%`),
        ilike(userModel.email, `%${search}%`),
        ilike(studentModel.rollNumber, `%${search}%`),
        ilike(studentModel.uid, `%${search}%`),
      ),
    );
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(cuRegistrationCorrectionRequestModel)
    .leftJoin(
      studentModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .leftJoin(userModel, eq(studentModel.userId, userModel.id))
    .where(whereClause);

  // Get paginated results
  const requests = await db
    .select()
    .from(cuRegistrationCorrectionRequestModel)
    .leftJoin(
      studentModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .leftJoin(userModel, eq(studentModel.userId, userModel.id))
    .where(whereClause)
    .orderBy(desc(cuRegistrationCorrectionRequestModel.createdAt))
    .limit(limit)
    .offset(offset);

  const requestDtos = await Promise.all(
    requests.map((request) =>
      modelToDto(request.cu_registration_correction_requests),
    ),
  );

  const totalPages = Math.ceil(total / limit);

  return {
    requests: requestDtos,
    total,
    totalPages,
  };
}

// READ - Get by student ID
export async function findCuRegistrationCorrectionRequestsByStudentId(
  studentId: number,
): Promise<CuRegistrationCorrectionRequestDto[]> {
  const requests = await db
    .select()
    .from(cuRegistrationCorrectionRequestModel)
    .where(eq(cuRegistrationCorrectionRequestModel.studentId, studentId))
    .orderBy(desc(cuRegistrationCorrectionRequestModel.createdAt));

  const requestDtos = await Promise.all(
    requests.map((request) => modelToDto(request)),
  );

  return requestDtos;
}

// READ - Get by student UID
export async function findCuRegistrationCorrectionRequestsByStudentUid(
  studentUid: string,
): Promise<CuRegistrationCorrectionRequestDto[]> {
  // First get student by UID
  console.log(
    "🔍 [CU-REG CORRECTION] Finding correction requests by student search:",
    studentUid,
  );
  const [student] = await db
    .select({ id: studentModel.id })
    .from(studentModel)
    .where(
      or(
        ilike(studentModel.uid, studentUid),
        ilike(studentModel.rfidNumber, studentUid),
      ),
    )
    .limit(1);

  if (!student) {
    return [];
  }

  const requests = await db
    .select()
    .from(cuRegistrationCorrectionRequestModel)
    .where(eq(cuRegistrationCorrectionRequestModel.studentId, student.id))
    .orderBy(desc(cuRegistrationCorrectionRequestModel.createdAt));

  const requestDtos = await Promise.all(
    requests.map((request) => modelToDto(request)),
  );

  return requestDtos;
}

// UPDATE - Mark physical registration as done
export async function markPhysicalRegistrationDone(
  id: number,
  markedByUserId?: number,
): Promise<CuRegistrationCorrectionRequestDto | null> {
  const [updated] = await db
    .update(cuRegistrationCorrectionRequestModel)
    .set({
      physicalRegistrationDone: true,
      status: "PHYSICAL_REGISTRATION_DONE",
      physicalRegistrationDoneBy: markedByUserId ?? null,
      physicalRegistrationDoneAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(cuRegistrationCorrectionRequestModel.id, id))
    .returning();

  const [promotion] = await db
    .select({
      sessionId: promotionModel.sessionId,
      classId: promotionModel.classId,
    })
    .from(promotionModel)
    .where(eq(promotionModel.studentId, updated.studentId))
    .orderBy(desc(promotionModel.createdAt))
    .limit(1);

  const misData = await getMisTableData(
    promotion?.sessionId,
    promotion?.classId,
  );
  socketService.sendMisTableUpdate(
    { sessionId: promotion?.sessionId, classId: promotion?.classId },
    misData.data,
    {
      trigger: "cu_reg_request_update",
      affectedStudents: 1,
    },
  );
  socketService.sendMisTableUpdateToAll(misData.data, {
    trigger: "cu_reg_request_update",
    affectedStudents: 1,
  });

  if (!updated) {
    return null;
  }

  // Send email notification for Part 2 confirmation
  try {
    console.log(
      "📧 [CU-REG-PART2-NOTIF] Sending Part 2 confirmation email notification",
    );

    // Get student and user details
    const [studentData] = await db
      .select({
        userId: studentModel.userId,
        userName: userModel.name,
        userEmail: userModel.email,
      })
      .from(studentModel)
      .innerJoin(userModel, eq(studentModel.userId, userModel.id))
      .where(eq(studentModel.id, updated.studentId));

    if (!studentData || !studentData.userId) {
      console.warn(
        "📧 [CU-REG-PART2-NOTIF] Student or user data not found, skipping notification",
      );
    } else {
      // Get the notification master for CU Registration Part 2 confirmation
      const [emailMaster] = await db
        .select()
        .from(notificationMasterModel)
        .where(
          and(
            eq(
              notificationMasterModel.name,
              "CU Registration Part 2 Confirmation",
            ),
            eq(notificationMasterModel.template, "cu-reg-part2-confirmation"),
            eq(notificationMasterModel.variant, "EMAIL"),
          ),
        );

      if (!emailMaster) {
        console.warn(
          "📧 [CU-REG-PART2-NOTIF] Notification master 'CU Registration Part 2 Confirmation' not found",
        );
      } else {
        console.log(
          "📧 [CU-REG-PART2-NOTIF] Found notification master:",
          emailMaster.id,
        );

        // Check environment-specific logic
        const redirectToDev = shouldRedirectToDeveloper();
        const sendToStaffOnly = shouldSendToStaffOnly();
        const { devEmail } = getDeveloperContact();

        // Determine notification recipients based on environment
        let otherUsersEmails: string[] = [];
        let shouldSendToStudent = false;

        if (redirectToDev && devEmail) {
          // Development: send ONLY to developer, NOT to student
          otherUsersEmails = [devEmail];
          shouldSendToStudent = false;
          console.log(
            `📧 [CU-REG-PART2-NOTIF] [DEV MODE] Sending ONLY to developer: ${devEmail} (NOT to student)`,
          );
        } else if (sendToStaffOnly) {
          // Staging: send ONLY to staff, NOT to student
          try {
            const staffUsers = await db
              .select({
                email: userModel.email,
              })
              .from(userModel)
              .where(
                and(
                  or(eq(userModel.type, "STAFF"), eq(userModel.type, "ADMIN")),
                  eq(userModel.sendStagingNotifications, true),
                  eq(userModel.isActive, true),
                  eq(userModel.isSuspended, false),
                ),
              );

            otherUsersEmails = staffUsers
              .map((user) => user.email)
              .filter(
                (email): email is string =>
                  email !== null && email !== undefined,
              );

            shouldSendToStudent = false;
            console.log(
              `📧 [CU-REG-PART2-NOTIF] [STAGING] Sending ONLY to staff: ${otherUsersEmails.join(", ")} (NOT to student)`,
            );
          } catch (error) {
            console.error(
              "❌ [CU-REG-PART2-NOTIF] Error fetching staff users for staging:",
              error,
            );
          }
        } else {
          // Production: send to real user
          shouldSendToStudent = true;
          console.log(
            `📧 [CU-REG-PART2-NOTIF] [PRODUCTION] Sending to real user: ${studentData.userEmail}`,
          );
        }

        // Prepare notification data
        let notificationData;

        // Define email subject - can be made configurable in the future
        const emailSubject =
          "Confirmation of physical submission of data sheet for Calcutta University Registration";

        if (shouldSendToStudent) {
          // Production: send to student
          notificationData = {
            userId: studentData.userId,
            variant: "EMAIL" as const,
            type: "ADMISSION" as const,
            message:
              "Your Calcutta University Registration Part 2 submission has been confirmed.",
            notificationMasterId: emailMaster.id,
            otherUsersEmails: undefined,
            notificationEvent: {
              subject: emailSubject,
              templateData: {
                studentName: studentData.userName || "Student",
              },
            },
          };
        } else {
          // Development/Staging: send to other users only
          notificationData = {
            userId: studentData.userId,
            variant: "EMAIL" as const,
            type: "ADMISSION" as const,
            message: `CU Registration Part 2 confirmation for testing. Student: ${studentData.userName || studentData.userEmail}`,
            notificationMasterId: emailMaster.id,
            otherUsersEmails:
              otherUsersEmails.length > 0 ? otherUsersEmails : undefined,
            notificationEvent: {
              subject: redirectToDev
                ? `[DEV MODE] ${emailSubject}`
                : `[STAGING] ${emailSubject}`,
              templateData: {
                studentName: redirectToDev
                  ? `Developer (Original: ${studentData.userName || studentData.userEmail})`
                  : `Staff Member (${studentData.userName || studentData.userEmail})`,
                ...(redirectToDev && {
                  originalRecipient: studentData.userEmail,
                  originalUserName: studentData.userName || "Student",
                }),
                ...(sendToStaffOnly && {
                  environment: "staging",
                  recipientType: "staff",
                }),
              },
            },
          };
        }

        console.log(
          "📧 [CU-REG-PART2-NOTIF] Enqueuing notification with data:",
          {
            userId: notificationData.userId,
            variant: notificationData.variant,
            type: notificationData.type,
            notificationMasterId: notificationData.notificationMasterId,
            shouldSendToStudent: shouldSendToStudent,
            hasOtherUsersEmails: otherUsersEmails.length > 0,
          },
        );

        // Enqueue the notification
        const result = await enqueueNotification(notificationData);
        console.log(
          "✅ [CU-REG-PART2-NOTIF] Part 2 confirmation email notification enqueued successfully",
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ [CU-REG-PART2-NOTIF] Error sending Part 2 confirmation email notification:",
      error,
    );
    // Don't throw error - notification failure should not block the main operation
  }

  return await modelToDto(updated);
}

// UPDATE
export async function updateCuRegistrationCorrectionRequest(
  id: number,
  updateData: Partial<CuRegistrationCorrectionRequestInsertTypeT>,
  user: UserDto,
): Promise<CuRegistrationCorrectionRequestDto | null> {
  console.info(
    "[CU-REG CORRECTION][UPDATE] Start",
    JSON.stringify({
      id,
      flags: (updateData as any)?.flags
        ? Object.keys((updateData as any).flags as any)
        : [],
    }),
  );
  // Load existing request to resolve student and user context
  const [existing] = await db
    .select()
    .from(cuRegistrationCorrectionRequestModel)
    .where(eq(cuRegistrationCorrectionRequestModel.id, id));

  if (!existing) return null;

  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, existing.studentId));

  // Guard: student must exist
  if (!student) return null;

  const [pd] = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.userId, student.userId as number));

  // Check PDF generation conditions before transaction
  const flags: any = (updateData as any)?.flags || {};
  const hasCorrectionFlags = Object.values(flags).some(Boolean);
  const isFinalSubmission = (updateData as any).onlineRegistrationDone === true;

  // Check if all declarations are completed
  const personalInfoDeclared =
    (updateData as any).personalInfoDeclaration === true;
  const addressInfoDeclared =
    (updateData as any).addressInfoDeclaration === true;
  const subjectsDeclared = (updateData as any).subjectsDeclaration === true;
  const documentsDeclared = (updateData as any).documentsDeclaration === true;

  // Check if subject selection is required for this student's program
  const subjectSelectionRequired = await isSubjectSelectionRequired(
    existing.studentId,
  );

  const allDeclarationsCompleted =
    personalInfoDeclared &&
    addressInfoDeclared &&
    (subjectSelectionRequired ? subjectsDeclared : true) && // Skip subjects check if not required
    documentsDeclared;

  // Only generate PDF and send notifications for final submission, not declaration updates
  const shouldGeneratePdf = isFinalSubmission && allDeclarationsCompleted;

  // Begin transactional update to keep data in sync
  const [updatedRequest] = await db.transaction(async (tx) => {
    console.info("[CU-REG BACKEND] Updating correction request", {
      id,
      flags,
      updateKeys: Object.keys(updateData as any),
    });
    // 1) Update the correction request record itself
    const setData: any = {
      updatedAt: new Date(),
      lastUpdatedBy: user.id,
    };
    if (typeof (updateData as any).remarks !== "undefined")
      setData.remarks = (updateData as any).remarks;
    if (typeof (updateData as any).status !== "undefined")
      setData.status = (updateData as any).status as any;
    if (typeof (updateData as any).onlineRegistrationDone !== "undefined")
      setData.onlineRegistrationDone = (
        updateData as any
      ).onlineRegistrationDone;

    // Always set introductoryDeclaration to true on any update
    setData.introductoryDeclaration = true;
    console.info(
      `[CU-REG CORRECTION][UPDATE] Always setting introductoryDeclaration to true (existing: ${existing.introductoryDeclaration})`,
    );
    if (typeof (updateData as any).personalInfoDeclaration !== "undefined")
      setData.personalInfoDeclaration = Boolean(
        existing.personalInfoDeclaration ||
          (updateData as any).personalInfoDeclaration,
      );
    if (typeof (updateData as any).addressInfoDeclaration !== "undefined")
      setData.addressInfoDeclaration = Boolean(
        existing.addressInfoDeclaration ||
          (updateData as any).addressInfoDeclaration,
      );
    if (typeof (updateData as any).subjectsDeclaration !== "undefined")
      setData.subjectsDeclaration = Boolean(
        existing.subjectsDeclaration || (updateData as any).subjectsDeclaration,
      );
    if (typeof (updateData as any).documentsDeclaration !== "undefined")
      setData.documentsDeclaration = Boolean(
        existing.documentsDeclaration ||
          (updateData as any).documentsDeclaration,
      );

    // Handle correction request flags directly
    if (typeof (updateData as any).genderCorrectionRequest !== "undefined")
      setData.genderCorrectionRequest = (
        updateData as any
      ).genderCorrectionRequest;
    if (typeof (updateData as any).nationalityCorrectionRequest !== "undefined")
      setData.nationalityCorrectionRequest = (
        updateData as any
      ).nationalityCorrectionRequest;
    if (
      typeof (updateData as any).aadhaarCardNumberCorrectionRequest !==
      "undefined"
    )
      setData.aadhaarCardNumberCorrectionRequest = (
        updateData as any
      ).aadhaarCardNumberCorrectionRequest;
    if (typeof (updateData as any).apaarIdCorrectionRequest !== "undefined")
      setData.apaarIdCorrectionRequest = (
        updateData as any
      ).apaarIdCorrectionRequest;
    if (typeof (updateData as any).subjectsCorrectionRequest !== "undefined")
      setData.subjectsCorrectionRequest = (
        updateData as any
      ).subjectsCorrectionRequest;
    // CRITICAL PROTECTION: Prevent updating application number if it already exists
    // This ensures that once an application number is generated, it can NEVER be changed
    if (
      typeof (updateData as any).cuRegistrationApplicationNumber !== "undefined"
    ) {
      if (existing.cuRegistrationApplicationNumber) {
        console.warn(
          "[CU-REG CORRECTION][UPDATE] BLOCKED: Attempted to update existing application number - IGNORING",
          {
            existing: existing.cuRegistrationApplicationNumber,
            attempted: (updateData as any).cuRegistrationApplicationNumber,
            reason: "Application number already exists and cannot be changed",
          },
        );
        // CRITICAL: Do NOT update the application number if it already exists
        // This prevents any accidental or malicious attempts to change it
      } else {
        // Only allow setting if no existing number exists
        setData.cuRegistrationApplicationNumber = (
          updateData as any
        ).cuRegistrationApplicationNumber;
        console.info(
          "[CU-REG CORRECTION][UPDATE] Setting application number from updateData (none existed)",
          {
            newNumber: (updateData as any).cuRegistrationApplicationNumber,
          },
        );
      }
    }

    // Map flags into explicit columns if provided
    if (typeof flags.gender !== "undefined") {
      setData.genderCorrectionRequest = !!flags.gender;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Setting genderCorrectionRequest:",
        !!flags.gender,
      );
    }
    if (typeof flags.nationality !== "undefined") {
      setData.nationalityCorrectionRequest = !!flags.nationality;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Setting nationalityCorrectionRequest:",
        !!flags.nationality,
      );
    }
    if (typeof flags.aadhaarNumber !== "undefined") {
      setData.aadhaarCardNumberCorrectionRequest = !!flags.aadhaarNumber;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Setting aadhaarCardNumberCorrectionRequest:",
        !!flags.aadhaarNumber,
      );
    }
    if (typeof flags.apaarId !== "undefined") {
      setData.apaarIdCorrectionRequest = !!flags.apaarId;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Setting apaarIdCorrectionRequest:",
        !!flags.apaarId,
      );
    }
    if (typeof flags.subjects !== "undefined") {
      setData.subjectsCorrectionRequest = !!flags.subjects;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Setting subjectsCorrectionRequest:",
        !!flags.subjects,
      );
    }

    // Debug logging for PDF generation conditions
    console.info(
      "[CU-REG CORRECTION][UPDATE] PDF Generation Conditions Check:",
      {
        personalInfoDeclared,
        addressInfoDeclared,
        subjectsDeclared,
        documentsDeclared,
        subjectSelectionRequired,
        allDeclarationsCompleted,
        isFinalSubmission,
        hasApplicationNumber: !!existing.cuRegistrationApplicationNumber,
        shouldGeneratePdf,
        willGeneratePdf:
          shouldGeneratePdf && !existing.cuRegistrationApplicationNumber,
      },
    );

    // Generate PDF and application number if conditions are met
    // IMPORTANT: Never regenerate application number if it already exists
    // Determine which application number to use (existing or generate new)
    let applicationNumber: string | undefined;

    // CRITICAL: Always check if application number already exists FIRST
    // If it exists, use it and NEVER generate a new one
    if (existing.cuRegistrationApplicationNumber) {
      // Use existing application number - NEVER regenerate, even if conditions suggest otherwise
      applicationNumber = existing.cuRegistrationApplicationNumber;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Application number already exists - using existing (will NOT regenerate):",
        applicationNumber,
      );
      // Explicitly do NOT set in setData - we're keeping the existing value
    } else if (shouldGeneratePdf) {
      // Only generate new application number if:
      // 1. No existing application number AND
      // 2. Conditions for PDF generation are met
      applicationNumber =
        await CuRegistrationNumberService.generateNextApplicationNumber();
      setData.cuRegistrationApplicationNumber = applicationNumber;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Generated new application number (none existed):",
        applicationNumber,
      );
    } else {
      // No existing number but conditions not met for generation
      console.info(
        "[CU-REG CORRECTION][UPDATE] No application number exists, but conditions not met for generation",
      );
    }

    // Generate PDF based on user type and conditions:
    // - For STUDENT: Only generate when final submission conditions are met (shouldGeneratePdf)
    // - For NON-STUDENT: Can generate anytime if application number exists
    const shouldGeneratePdfInTransaction =
      applicationNumber &&
      ((user.type === "STUDENT" && shouldGeneratePdf) || // Students: only on final submission
        user.type !== "STUDENT"); // Non-students: anytime if number exists

    if (shouldGeneratePdfInTransaction) {
      try {
        console.info("[CU-REG CORRECTION][UPDATE] Generating PDF", {
          userType: user.type,
          studentId: existing.studentId,
          correctionRequestId: id,
          applicationNumber,
          isNewNumber: !existing.cuRegistrationApplicationNumber,
          isFinalSubmission: isFinalSubmission,
          allDeclarationsCompleted: allDeclarationsCompleted,
        });

        // Get student UID for S3 upload
        const [studentRecord] = await tx
          .select({ uid: studentModel.uid })
          .from(studentModel)
          .where(eq(studentModel.id, existing.studentId))
          .limit(1);

        if (!studentRecord?.uid) {
          console.error(
            "[CU-REG CORRECTION][UPDATE] Student UID not found for PDF generation",
          );
          throw new Error("Student UID is required for PDF generation");
        }

        // TypeScript guard: applicationNumber is guaranteed to be string here due to shouldGeneratePdfInTransaction check
        if (!applicationNumber) {
          throw new Error("Application number is required for PDF generation");
        }

        const pdfResult =
          await CuRegistrationPdfIntegrationService.generateCuRegistrationPdfForFinalSubmission(
            existing.studentId,
            id,
            applicationNumber, // Use the application number (existing or newly generated)
            studentRecord.uid,
          );

        if (pdfResult.success) {
          console.info(
            "[CU-REG CORRECTION][UPDATE] PDF generated successfully",
            {
              pdfPath: pdfResult.pdfPath,
              s3Url: pdfResult.s3Url,
              applicationNumber,
            },
          );
        } else {
          console.error("[CU-REG CORRECTION][UPDATE] PDF generation failed", {
            error: pdfResult.error,
            applicationNumber,
          });
          // Don't fail the entire process if PDF generation fails
        }
      } catch (pdfError) {
        console.error("[CU-REG CORRECTION][UPDATE] PDF generation error", {
          error: pdfError,
          applicationNumber,
        });
        // Don't fail the entire process if PDF generation fails
      }
    }

    // FIXED: Don't automatically set status - let user set it manually
    // Only set status if explicitly provided in the update data
    if (typeof (updateData as any).status !== "undefined") {
      setData.status = (updateData as any).status;
      console.info(
        `[CU-REG CORRECTION][UPDATE] Status explicitly set to: ${setData.status}`,
      );
    } else {
      console.info(
        `[CU-REG CORRECTION][UPDATE] No status provided - keeping existing status (user must set manually)`,
      );
    }

    // Always ensure academic year ID is set (fetch fresh if missing or update if provided)
    const academicYearId = await getAcademicYearIdByStudentId(
      existing.studentId,
    );
    if (academicYearId) {
      setData.academicYearId = academicYearId;
      console.info(
        `[CU-REG CORRECTION][UPDATE] Set academic year ID: ${academicYearId} for student: ${existing.studentId}`,
      );
    } else {
      console.warn(
        `[CU-REG CORRECTION][UPDATE] No academic year ID found for student: ${existing.studentId}`,
      );
    }

    console.info(
      "[CU-REG CORRECTION][UPDATE] Final setData before DB update:",
      setData,
    );
    console.info(
      "[CU-REG CORRECTION][UPDATE] Introductory declaration in setData:",
      setData.introductoryDeclaration,
    );
    console.info(
      "[CU-REG CORRECTION][UPDATE] All setData keys:",
      Object.keys(setData),
    );

    console.info(
      "[CU-REG CORRECTION][UPDATE] About to update database with setData:",
      JSON.stringify(setData, null, 2),
    );

    const [req] = await tx
      .update(cuRegistrationCorrectionRequestModel)
      .set(setData)
      .where(eq(cuRegistrationCorrectionRequestModel.id, id))
      .returning();

    console.info(
      "[CU-REG CORRECTION][UPDATE] Database update completed, returned record:",
      JSON.stringify(req, null, 2),
    );
    console.info("[CU-REG BACKEND] Correction request updated in DB", {
      id: req?.id,
      status: req?.status,
      introductoryDeclaration: (req as any)?.introductoryDeclaration,
      personalInfoDeclaration: (req as any)?.personalInfoDeclaration,
      addressInfoDeclaration: (req as any)?.addressInfoDeclaration,
      subjectsDeclaration: (req as any)?.subjectsDeclaration,
      documentsDeclaration: (req as any)?.documentsDeclaration,
      genderCorrectionRequest: (req as any)?.genderCorrectionRequest,
      nationalityCorrectionRequest: (req as any)?.nationalityCorrectionRequest,
      aadhaarCardNumberCorrectionRequest: (req as any)
        ?.aadhaarCardNumberCorrectionRequest,
      apaarIdCorrectionRequest: (req as any)?.apaarIdCorrectionRequest,
      subjectsCorrectionRequest: (req as any)?.subjectsCorrectionRequest,
    });

    // 2) If payload provided, persist relevant fields to canonical tables
    const payload: any = (updateData as any)?.payload;
    console.info("[CU-REG CORRECTION][UPDATE] Processing payload", {
      payload,
      hasPersonalInfo: !!payload?.personalInfo,
      personalInfoKeys: payload?.personalInfo
        ? Object.keys(payload.personalInfo)
        : [],
      hasFullName: !!payload?.personalInfo?.fullName,
      hasFatherMotherName: !!payload?.personalInfo?.fatherMotherName,
      fatherMotherNameValue: payload?.personalInfo?.fatherMotherName,
    });
    if (payload) {
      // personalInfo: gender, nationality, apaar/abc
      if (payload.personalInfo && pd) {
        const personalUpdates: any = {};
        if (payload.personalInfo.gender) {
          personalUpdates.gender = payload.personalInfo.gender;
        }
        if (payload.personalInfo.nationality) {
          personalUpdates.nationality = payload.personalInfo.nationality;
        }
        if (payload.personalInfo.aadhaarNumber) {
          // Format Aadhaar number to 4-4-4 format before saving to database
          const digits = payload.personalInfo.aadhaarNumber.replace(/\D/g, "");
          const formattedAadhaarNumber =
            digits.length === 12
              ? digits.replace(/^(\d{4})(\d{4})(\d{4})$/, "$1-$2-$3")
              : payload.personalInfo.aadhaarNumber;
          personalUpdates.aadhaarCardNumber = formattedAadhaarNumber;
          console.info("[CU-REG CORRECTION][UPDATE] Updated Aadhaar number", {
            original: payload.personalInfo.aadhaarNumber,
            formatted: formattedAadhaarNumber,
          });
        }

        if (Object.keys(personalUpdates).length > 0) {
          console.info(
            "[CU-REG CORRECTION][UPDATE] Updating personal details",
            { personalUpdates },
          );
          await tx
            .update(personalDetailsModel)
            .set(personalUpdates)
            .where(eq(personalDetailsModel.id, pd.id as number));
        } else {
          console.info(
            "[CU-REG CORRECTION][UPDATE] No personal details to update",
          );
        }

        // Student APAAR/ABC update - always process if present in payload
        if (payload.personalInfo.hasOwnProperty("apaarId")) {
          let formattedApaarId = null;

          console.info("[CU-REG CORRECTION][UPDATE] Processing APAAR ID", {
            received: payload.personalInfo.apaarId,
            type: typeof payload.personalInfo.apaarId,
            isEmpty: payload.personalInfo.apaarId === "",
            isNull: payload.personalInfo.apaarId === null,
            isUndefined: payload.personalInfo.apaarId === undefined,
          });

          if (
            payload.personalInfo.apaarId &&
            payload.personalInfo.apaarId.trim() !== ""
          ) {
            // Format APAAR ID to 3-3-3-3 format before saving to database
            const digits = payload.personalInfo.apaarId.replace(/\D/g, "");
            formattedApaarId =
              digits.length === 12
                ? digits.replace(
                    /^(\d{3})(\d{3})(\d{3})(\d{3})$/,
                    "$1-$2-$3-$4",
                  )
                : payload.personalInfo.apaarId;
          } else {
            // If empty string is sent, set to null in database
            formattedApaarId = null;
          }

          await tx
            .update(studentModel)
            .set({ apaarId: formattedApaarId })
            .where(eq(studentModel.id, student.id));
          console.info("[CU-REG CORRECTION][UPDATE] Updated APAAR ID", {
            original: payload.personalInfo.apaarId,
            formatted: formattedApaarId,
            studentId: student.id,
          });
        } else {
          console.info(
            "[CU-REG CORRECTION][UPDATE] APAAR ID not present in payload",
            {
              personalInfoKeys: Object.keys(payload.personalInfo),
              hasApaarId: "apaarId" in payload.personalInfo,
            },
          );
        }

        // Student EWS status update (EWS is editable by students)
        if (payload.personalInfo.ews !== undefined) {
          const ewsValue =
            payload.personalInfo.ews === "Yes" ||
            payload.personalInfo.ews === true;
          await tx
            .update(studentModel)
            .set({ belongsToEWS: ewsValue })
            .where(eq(studentModel.id, student.id));
          console.info("[CU-REG CORRECTION][UPDATE] Updated EWS status", {
            ews: ewsValue,
          });
        }

        // Update User.name (fullName) if provided
        if (payload.personalInfo.fullName && student.userId) {
          await tx
            .update(userModel)
            .set({ name: payload.personalInfo.fullName.trim() })
            .where(eq(userModel.id, student.userId as number));
          console.info("[CU-REG CORRECTION][UPDATE] Updated User name", {
            userId: student.userId,
            fullName: payload.personalInfo.fullName,
          });
        }

        // Update Father/Mother name if provided
        if (
          payload.personalInfo.fatherMotherName !== undefined &&
          payload.personalInfo.fatherMotherName !== null &&
          payload.personalInfo.fatherMotherName.trim() !== "" &&
          student.userId
        ) {
          // Determine which parent type to update (from frontend or default to FATHER)
          const parentTypeToUpdate = (
            payload.personalInfo.parentType === "MOTHER" ? "MOTHER" : "FATHER"
          ) as "FATHER" | "MOTHER";

          console.info(
            "[CU-REG CORRECTION][UPDATE] Attempting to update father/mother name",
            {
              fatherMotherName: payload.personalInfo.fatherMotherName,
              parentType: parentTypeToUpdate,
              requestedParentType: payload.personalInfo.parentType,
              userId: student.userId,
            },
          );

          // Get family details for this user
          const [family] = await tx
            .select()
            .from(familyModel)
            .where(eq(familyModel.userId, student.userId as number))
            .limit(1);

          if (family) {
            console.info(
              "[CU-REG CORRECTION][UPDATE] Family found, searching for specific parent type",
              { familyId: family.id, parentTypeToUpdate },
            );

            // Find the specific parent type (FATHER or MOTHER) person record
            const [familyMember] = await tx
              .select()
              .from(personModel)
              .where(
                and(
                  eq(personModel.familyId, family.id as number),
                  eq(personModel.type, parentTypeToUpdate as any),
                ),
              )
              .limit(1);

            if (familyMember) {
              // Update existing parent record
              const trimmedName = payload.personalInfo.fatherMotherName.trim();

              await tx
                .update(personModel)
                .set({ name: trimmedName })
                .where(eq(personModel.id, familyMember.id as number));

              // Verify the update was successful by querying the updated record
              const [verifiedMember] = await tx
                .select()
                .from(personModel)
                .where(eq(personModel.id, familyMember.id as number))
                .limit(1);

              console.info(
                "[CU-REG CORRECTION][UPDATE] Successfully updated family member name",
                {
                  familyId: family.id,
                  personId: familyMember.id,
                  type: parentTypeToUpdate,
                  oldName: familyMember.name,
                  newName: trimmedName,
                  verifiedName: verifiedMember?.name,
                  updateVerified: verifiedMember?.name === trimmedName,
                },
              );
            } else {
              // If the specific parent type doesn't exist, create it
              const trimmedName = payload.personalInfo.fatherMotherName.trim();
              const [newPerson] = await tx
                .insert(personModel)
                .values({
                  familyId: family.id as number,
                  type: parentTypeToUpdate as any,
                  name: trimmedName,
                })
                .returning();

              console.info(
                `[CU-REG CORRECTION][UPDATE] Created new ${parentTypeToUpdate} person record`,
                {
                  familyId: family.id,
                  personId: newPerson.id,
                  type: parentTypeToUpdate,
                  name: trimmedName,
                },
              );
            }
          } else {
            console.warn(
              "[CU-REG CORRECTION][UPDATE] Family details not found for user",
              {
                userId: student.userId,
                studentId: student.id,
              },
            );
          }
        } else {
          console.info(
            "[CU-REG CORRECTION][UPDATE] Skipping father/mother name update",
            {
              hasValue: payload.personalInfo.fatherMotherName !== undefined,
              value: payload.personalInfo.fatherMotherName,
              isNotEmpty: payload.personalInfo.fatherMotherName?.trim() !== "",
              hasUserId: !!student.userId,
            },
          );
        }
      }

      // addressData: residential and mailing
      if (payload.addressData && pd) {
        const upsertAddress = async (
          type: "RESIDENTIAL" | "MAILING",
          data: any,
        ) => {
          if (!data) return;
          const [addr] = await tx
            .select()
            .from(addressModel)
            .where(
              and(
                eq(addressModel.personalDetailsId, pd.id as number),
                eq(addressModel.type, type as any),
              ),
            );

          const addressUpdates: any = {};
          if (typeof data.cityId !== "undefined")
            addressUpdates.cityId = data.cityId || null;
          if (typeof data.districtId !== "undefined")
            addressUpdates.districtId = data.districtId || null;
          if (typeof data.stateId !== "undefined")
            addressUpdates.stateId = data.stateId || null;
          if (typeof data.countryId !== "undefined")
            addressUpdates.countryId = data.countryId || null;
          if (typeof data.postofficeId !== "undefined")
            addressUpdates.postofficeId = data.postofficeId || null;
          if (typeof data.otherPostoffice !== "undefined")
            addressUpdates.otherPostoffice = data.otherPostoffice || null;
          if (typeof data.policeStationId !== "undefined")
            addressUpdates.policeStationId = data.policeStationId || null;
          if (typeof data.otherPoliceStation !== "undefined")
            addressUpdates.otherPoliceStation = data.otherPoliceStation || null;
          if (typeof data.otherDistrict !== "undefined")
            addressUpdates.otherDistrict = data.otherDistrict || null;
          if (typeof data.otherCity !== "undefined")
            addressUpdates.otherCity = data.otherCity || null;
          if (typeof data.otherState !== "undefined")
            addressUpdates.otherState = data.otherState || null;
          if (typeof data.otherCountry !== "undefined")
            addressUpdates.otherCountry = data.otherCountry || null;
          if (typeof data.addressLine !== "undefined")
            addressUpdates.addressLine = data.addressLine || null;
          if (typeof data.pincode !== "undefined")
            addressUpdates.pincode = data.pincode || null;

          if (addr) {
            await tx
              .update(addressModel)
              .set(addressUpdates)
              .where(eq(addressModel.id, addr.id as number));
          }
        };

        await upsertAddress("RESIDENTIAL", payload.addressData.residential);
        await upsertAddress("MAILING", payload.addressData.mailing);
      }
    }

    // 3) Optional: nested document metadata save
    const docs: Array<Partial<cuRegistrationDocumentUploadInsertTypeT>> =
      (updateData as any)?.documentUploads || [];
    if (Array.isArray(docs) && docs.length > 0) {
      for (const d of docs) {
        if (!d?.documentId) continue;
        // Replace existing record for this request+documentId with latest metadata
        await tx
          .delete(cuRegistrationDocumentUploadModel)
          .where(
            and(
              eq(
                cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
                id,
              ),
              eq(cuRegistrationDocumentUploadModel.documentId, d.documentId),
            ),
          );

        await tx.insert(cuRegistrationDocumentUploadModel).values({
          cuRegistrationCorrectionRequestId: id,
          documentId: d.documentId,
          fileName: d.fileName ?? null,
          fileType: d.fileType ?? null,
          fileSize: (d as any).fileSize ?? null,
          path: (d as any).path ?? null,
          documentUrl: (d as any).documentUrl ?? null,
          remarks: d.remarks ?? null,
        });
      }
    }

    console.info(
      "[CU-REG CORRECTION][UPDATE] Persisted",
      JSON.stringify({ id: req.id, studentId: existing.studentId }),
    );
    return [req];
  });

  // Post-transaction verification: Verify father/mother name update persisted
  if (
    (updateData as any)?.payload?.personalInfo?.fatherMotherName &&
    student.userId
  ) {
    try {
      const [family] = await db
        .select()
        .from(familyModel)
        .where(eq(familyModel.userId, student.userId as number))
        .limit(1);

      if (family) {
        const parentTypeToUpdate = (
          (updateData as any)?.payload?.personalInfo?.parentType === "MOTHER"
            ? "MOTHER"
            : "FATHER"
        ) as "FATHER" | "MOTHER";

        const [verifiedMember] = await db
          .select()
          .from(personModel)
          .where(
            and(
              eq(personModel.familyId, family.id as number),
              eq(personModel.type, parentTypeToUpdate as any),
            ),
          )
          .limit(1);

        if (verifiedMember) {
          const expectedName = (
            updateData as any
          )?.payload?.personalInfo?.fatherMotherName.trim();
          console.info(
            "[CU-REG CORRECTION][UPDATE] Post-transaction verification",
            {
              personId: verifiedMember.id,
              type: parentTypeToUpdate,
              expectedName,
              actualName: verifiedMember.name,
              match: verifiedMember.name === expectedName,
            },
          );

          if (verifiedMember.name !== expectedName) {
            console.error(
              "[CU-REG CORRECTION][UPDATE] WARNING: Name mismatch after update!",
              {
                expected: expectedName,
                actual: verifiedMember.name,
              },
            );
          }
        } else {
          console.warn(
            "[CU-REG CORRECTION][UPDATE] Post-transaction: Person record not found",
            {
              familyId: family.id,
              parentType: parentTypeToUpdate,
            },
          );
        }
      }
    } catch (verifyError) {
      console.error(
        "[CU-REG CORRECTION][UPDATE] Error in post-transaction verification:",
        verifyError,
      );
    }
  }

  if (!updatedRequest) return null;

  // Only regenerate PDF when all declarations are completed AND data was actually updated
  const allDeclarationsCompletedInDB =
    updatedRequest.personalInfoDeclaration &&
    updatedRequest.addressInfoDeclaration &&
    updatedRequest.subjectsDeclaration &&
    updatedRequest.documentsDeclaration;

  // Check if any data fields were updated (not just status changes)
  const dataFieldsUpdated =
    updateData.personalInfoDeclaration !== undefined ||
    updateData.addressInfoDeclaration !== undefined ||
    updateData.subjectsDeclaration !== undefined ||
    updateData.documentsDeclaration !== undefined ||
    (updateData as any).payload !== undefined ||
    (updateData as any).flags !== undefined;

  // PDF regeneration logic:
  // - PDF can be regenerated with updated data when student information changes
  // - BUT application number MUST remain unchanged - use existing number from DB
  // - For STUDENT: Only regenerate when final submission conditions are met (all declarations + final submission)
  // - For NON-STUDENT: Can regenerate anytime if application number exists
  const shouldGeneratePdfNow =
    isFinalSubmission || allDeclarationsCompletedInDB;

  const shouldRegeneratePdf =
    updatedRequest.cuRegistrationApplicationNumber &&
    // For STUDENT: only when final submission conditions are met AND data was updated
    ((user.type === "STUDENT" && shouldGeneratePdfNow && dataFieldsUpdated) ||
      // For NON-STUDENT: anytime if application number exists
      user.type !== "STUDENT");

  if (shouldRegeneratePdf) {
    try {
      // CRITICAL: Validate that application number exists before regenerating PDF
      if (!updatedRequest.cuRegistrationApplicationNumber) {
        console.error(
          "[CU-REG CORRECTION][UPDATE] Cannot regenerate PDF - application number is missing",
        );
        throw new Error("Application number is required for PDF regeneration");
      }

      // CRITICAL: Use EXISTING application number - NEVER generate or update it during regeneration
      const existingApplicationNumber =
        updatedRequest.cuRegistrationApplicationNumber;

      console.info(
        "[CU-REG CORRECTION][UPDATE] Regenerating PDF with latest data (application number unchanged)",
        {
          userType: user.type,
          isFinalSubmission,
          allDeclarationsCompleted: allDeclarationsCompletedInDB,
          dataFieldsUpdated,
          applicationNumber: existingApplicationNumber,
          note: "Using EXISTING application number - NOT generating new",
        },
      );

      // Import the PDF integration service
      const { CuRegistrationPdfIntegrationService } = await import(
        "@/services/cu-registration-pdf-integration.service.js"
      );

      // Regenerate PDF with latest student data but SAME application number
      // The PDF will contain updated student information but the form number stays the same
      const pdfResult =
        await CuRegistrationPdfIntegrationService.generateCuRegistrationPdfForFinalSubmission(
          existing.studentId,
          id,
          existingApplicationNumber, // CRITICAL: Use existing number - never change it
          student.uid,
        );

      if (pdfResult.success) {
        console.info(
          "[CU-REG CORRECTION][UPDATE] PDF regenerated successfully with updated data",
          {
            pdfPath: pdfResult.pdfPath,
            s3Url: pdfResult.s3Url,
            applicationNumber: existingApplicationNumber,
            note: "Application number unchanged - PDF contains updated student data",
          },
        );

        // Send email notification with PDF attachment (same as student console)
        // Only send notifications if CU application number is not null
        // NOTE: Email is sent only for students on initial final submission, not on every regeneration
        if (
          pdfResult.pdfBuffer &&
          existingApplicationNumber &&
          user.type === "STUDENT"
        ) {
          try {
            console.info(
              `[CU-REG CORRECTION][UPDATE] Sending admission registration email notification`,
              {
                studentId: existing.studentId,
                applicationNumber: existingApplicationNumber,
                pdfBufferSize: pdfResult.pdfBuffer.length,
                pdfUrl: pdfResult.s3Url,
                note: "Using existing application number for email",
              },
            );

            const notificationResult =
              await sendAdmissionRegistrationNotification(
                existing.studentId,
                existingApplicationNumber, // Use existing - never generate
                pdfResult.pdfBuffer,
                pdfResult.s3Url!,
              );

            if (notificationResult.success) {
              console.info(
                `[CU-REG CORRECTION][UPDATE] Email notification sent successfully`,
                { notificationId: notificationResult.notificationId },
              );
            } else {
              console.error(
                `[CU-REG CORRECTION][UPDATE] Failed to send email notification:`,
                notificationResult.error,
              );
            }
          } catch (notificationError) {
            console.error(
              `[CU-REG CORRECTION][UPDATE] Error sending email notification:`,
              notificationError,
            );
            // Don't fail the entire request if notification fails
          }
        } else {
          if (!pdfResult.pdfBuffer) {
            console.warn(
              `[CU-REG CORRECTION][UPDATE] PDF buffer not available for notification`,
            );
          }
          if (!updatedRequest.cuRegistrationApplicationNumber) {
            console.warn(
              `[CU-REG CORRECTION][UPDATE] CU application number is null - skipping notifications`,
            );
          }
        }
      } else {
        console.error("[CU-REG CORRECTION][UPDATE] PDF regeneration failed", {
          error: pdfResult.error,
          applicationNumber: existingApplicationNumber,
          note: "Application number was not changed during failed regeneration",
        });
      }
    } catch (error) {
      console.error(
        "[CU-REG CORRECTION][UPDATE] Error regenerating PDF:",
        error,
      );
      // Don't fail the update if PDF regeneration fails
    }
  } else {
    // This is a declaration update, not a final submission - skip PDF generation
    console.info(
      "[CU-REG CORRECTION][UPDATE] Declaration update - skipping PDF generation and notifications",
      {
        isFinalSubmission,
        allDeclarationsCompleted,
        shouldGeneratePdf,
        reason: !isFinalSubmission
          ? "Not a final submission"
          : "Not all declarations completed",
      },
    );
  }

  console.info(
    "[CU-REG CORRECTION][UPDATE] Completed",
    JSON.stringify({ id: updatedRequest.id }),
  );

  // Emit MIS dashboard update for this student so online/physical flags reflect immediately
  try {
    const [promotion] = await db
      .select({
        sessionId: promotionModel.sessionId,
        classId: promotionModel.classId,
      })
      .from(promotionModel)
      .where(eq(promotionModel.studentId, existing.studentId))
      .orderBy(desc(promotionModel.createdAt))
      .limit(1);

    const sessionId = promotion?.sessionId;
    const classId = promotion?.classId;
    const misData = await getMisTableData(sessionId as any, classId as any);
    socketService.sendMisTableUpdate({ sessionId, classId }, misData.data, {
      trigger: "cu_reg_request_update",
      affectedStudents: 1,
    });
    socketService.sendMisTableUpdateToAll(misData.data, {
      trigger: "cu_reg_request_update",
      affectedStudents: 1,
    });
    console.info(
      "[CU-REG CORRECTION][UPDATE] Emitted MIS update for student",
      existing.studentId,
    );
  } catch (emitError) {
    console.warn(
      "[CU-REG CORRECTION][UPDATE] Failed to emit MIS update:",
      emitError,
    );
  }

  return await modelToDto(updatedRequest);
}

// UPDATE - Approve request
// export async function approveCuRegistrationCorrectionRequest(
//     id: number,
//     approvedBy: number,
//     approvedRemarks?: string,
// ): Promise<CuRegistrationCorrectionRequestDto | null> {
//     const [updatedRequest] = await db
//         .update(cuRegistrationCorrectionRequestModel)
//         .set({
//             status: "ONLINE_REGISTRATION_DONE",
//             approvedAt: new Date(),
//             approvedRemarks,
//             updatedAt: new Date(),
//         })
//         .where(eq(cuRegistrationCorrectionRequestModel.id, id))
//         .returning();

//     if (!updatedRequest) return null;

//     return await modelToDto(updatedRequest);
// }

// // UPDATE - Reject request
// export async function rejectCuRegistrationCorrectionRequest(
//     id: number,
//     rejectedBy: number,
//     rejectedRemarks?: string,
// ): Promise<CuRegistrationCorrectionRequestDto | null> {
//     const [updatedRequest] = await db
//         .update(cuRegistrationCorrectionRequestModel)
//         .set({
//             status: "PENDING",
//             onlineRegistrationDone: false,
//             physicalRegistrationDone: false,
//             rejectedBy,
//             rejectedAt: new Date(),
//             rejectedRemarks,
//             updatedAt: new Date(),
//         })
//         .where(eq(cuRegistrationCorrectionRequestModel.id, id))
//         .returning();

//     if (!updatedRequest) return null;

//     return await modelToDto(updatedRequest);
// }

// DELETE
export async function deleteCuRegistrationCorrectionRequest(
  id: number,
): Promise<boolean> {
  const result = await db
    .delete(cuRegistrationCorrectionRequestModel)
    .where(eq(cuRegistrationCorrectionRequestModel.id, id));

  return (result.rowCount ?? 0) > 0;
}

// READ - Get by status
export async function findCuRegistrationCorrectionRequestsByStatus(
  status: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  requests: CuRegistrationCorrectionRequestDto[];
  total: number;
  totalPages: number;
}> {
  const offset = (page - 1) * limit;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(cuRegistrationCorrectionRequestModel)
    .where(eq(cuRegistrationCorrectionRequestModel.status, status as any));

  // Get paginated results
  const requests = await db
    .select()
    .from(cuRegistrationCorrectionRequestModel)
    .where(eq(cuRegistrationCorrectionRequestModel.status, status as any))
    .orderBy(desc(cuRegistrationCorrectionRequestModel.createdAt))
    .limit(limit)
    .offset(offset);

  const requestDtos = await Promise.all(
    requests.map((request) => modelToDto(request)),
  );

  const totalPages = Math.ceil(total / limit);

  return {
    requests: requestDtos,
    total,
    totalPages,
  };
}

// Update actual database fields based on correction request data
export async function updateStudentDataFromCorrectionRequest(
  studentId: number,
  correctionFlags: {
    gender?: boolean;
    nationality?: boolean;
    apaarId?: boolean;
    subjects?: boolean;
  },
  formData: {
    personalInfo?: {
      gender?: string;
      nationalityId?: number;
      apaarId?: string;
      ews?: string | boolean;
    };
    addressData?: {
      residential?: any;
      mailing?: any;
    };
    // Note: Subject selections are not updated by students in CU registration
  },
): Promise<{
  success: boolean;
  errors?: string[];
  updatedFields?: string[];
}> {
  console.info(
    "[CU-REG DB UPDATE] Starting database field updates",
    JSON.stringify({
      studentId,
      correctionFlags,
      formDataKeys: Object.keys(formData),
    }),
  );

  const errors: string[] = [];
  const updatedFields: string[] = [];

  try {
    // Get student and personal details
    const [student] = await db
      .select()
      .from(studentModel)
      .where(eq(studentModel.id, studentId));

    if (!student) {
      return { success: false, errors: ["Student not found"] };
    }

    const [personalDetails] = await db
      .select()
      .from(personalDetailsModel)
      .where(eq(personalDetailsModel.userId, student.userId as number));

    if (!personalDetails) {
      return { success: false, errors: ["Personal details not found"] };
    }

    // Note: Personal details (gender, nationality) are not updated by students
    // Students can only request corrections via flags, but cannot provide new values
    // These corrections need to be handled by admin separately
    if (correctionFlags.gender || correctionFlags.nationality) {
      console.info(
        "[CU-REG DB UPDATE] Personal details correction requested but not updated - requires admin approval",
      );
      updatedFields.push("personalDetailsCorrectionRequested");
    }

    // APAAR ID update logic
    if (formData.personalInfo?.apaarId !== undefined) {
      if (correctionFlags.apaarId) {
        // Correction request - requires admin approval
        console.info(
          "[CU-REG DB UPDATE] APAAR ID correction requested but not updated - requires admin approval",
        );
        updatedFields.push("apaarIdCorrectionRequested");
      } else {
        // New APAAR ID entry - allow student to update
        let formattedApaarId = null;

        if (
          formData.personalInfo.apaarId &&
          formData.personalInfo.apaarId.trim() !== ""
        ) {
          // Format APAAR ID to 3-3-3-3 format before saving to database
          const digits = formData.personalInfo.apaarId.replace(/\D/g, "");
          formattedApaarId =
            digits.length === 12
              ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1-$2-$3-$4")
              : formData.personalInfo.apaarId;
        }

        await db
          .update(studentModel)
          .set({ apaarId: formattedApaarId })
          .where(eq(studentModel.id, studentId));

        console.info("[CU-REG DB UPDATE] Updated APAAR ID", {
          original: formData.personalInfo.apaarId,
          formatted: formattedApaarId,
          studentId: studentId,
        });
        updatedFields.push("apaarId");
      }
    }

    // Update EWS status if provided (EWS is editable by students)
    if (formData.personalInfo?.ews !== undefined) {
      const ewsValue =
        formData.personalInfo.ews === "Yes" ||
        formData.personalInfo.ews === true;
      await db
        .update(studentModel)
        .set({ belongsToEWS: ewsValue })
        .where(eq(studentModel.id, studentId));

      updatedFields.push("ewsStatus");
      console.info("[CU-REG DB UPDATE] Updated EWS status", { ews: ewsValue });
    }

    // Update addresses if provided (addresses are always editable in the form)
    if (formData.addressData) {
      console.info(
        "[CU-REG DB UPDATE] Address data provided, will update address fields",
      );
      console.info(
        "[CU-REG DB UPDATE] Full address data received:",
        JSON.stringify(formData.addressData, null, 2),
      );
      const updateAddress = async (
        type: "RESIDENTIAL" | "MAILING",
        data: any,
      ) => {
        if (!data) return;
        console.info(
          `[CU-REG DB UPDATE] Processing ${type} address:`,
          JSON.stringify(data, null, 2),
        );

        const [address] = await db
          .select()
          .from(addressModel)
          .where(
            and(
              eq(addressModel.personalDetailsId, personalDetails.id as number),
              eq(addressModel.type, type as any),
            ),
          );

        console.info(
          `[CU-REG DB UPDATE] Current ${type} address in DB:`,
          JSON.stringify(address, null, 2),
        );

        const addressUpdates: any = {};
        if (typeof data.cityId !== "undefined")
          addressUpdates.cityId = data.cityId || null;
        if (typeof data.districtId !== "undefined")
          addressUpdates.districtId = data.districtId || null;
        if (typeof data.stateId !== "undefined")
          addressUpdates.stateId = data.stateId || null;
        if (typeof data.countryId !== "undefined")
          addressUpdates.countryId = data.countryId || null;
        if (typeof data.postofficeId !== "undefined")
          addressUpdates.postofficeId = data.postofficeId || null;
        if (typeof data.otherPostoffice !== "undefined")
          addressUpdates.otherPostoffice = data.otherPostoffice || null;
        if (typeof data.policeStationId !== "undefined")
          addressUpdates.policeStationId = data.policeStationId || null;
        if (typeof data.otherPoliceStation !== "undefined")
          addressUpdates.otherPoliceStation = data.otherPoliceStation || null;
        if (typeof data.otherDistrict !== "undefined")
          addressUpdates.otherDistrict = data.otherDistrict || null;
        if (typeof data.otherCity !== "undefined")
          addressUpdates.otherCity = data.otherCity || null;
        if (typeof data.otherState !== "undefined")
          addressUpdates.otherState = data.otherState || null;
        if (typeof data.otherCountry !== "undefined")
          addressUpdates.otherCountry = data.otherCountry || null;
        if (typeof data.addressLine !== "undefined")
          addressUpdates.addressLine = data.addressLine || null;
        if (typeof data.pincode !== "undefined")
          addressUpdates.pincode = data.pincode || null;

        console.info(
          `[CU-REG DB UPDATE] Address updates for ${type}:`,
          JSON.stringify(addressUpdates, null, 2),
        );

        if (address && Object.keys(addressUpdates).length > 0) {
          await db
            .update(addressModel)
            .set(addressUpdates)
            .where(eq(addressModel.id, address.id as number));

          updatedFields.push(`${type.toLowerCase()}Address`);
          console.info(
            `[CU-REG DB UPDATE] Updated ${type} address`,
            addressUpdates,
          );

          // Verify the update by fetching the address again
          const [updatedAddress] = await db
            .select()
            .from(addressModel)
            .where(eq(addressModel.id, address.id as number));
          console.info(
            `[CU-REG DB UPDATE] ${type} address after update:`,
            JSON.stringify(updatedAddress, null, 2),
          );
        } else {
          console.warn(
            `[CU-REG DB UPDATE] No ${type} address found or no updates to apply`,
          );
        }
      };

      await updateAddress("RESIDENTIAL", formData.addressData.residential);
      await updateAddress("MAILING", formData.addressData.mailing);
    }

    // Note: Subject selections are not updated by students in CU registration
    // Subject changes require admin approval and should be handled separately
    if (correctionFlags.subjects) {
      console.info(
        "[CU-REG DB UPDATE] Subject selection updates are not allowed for students in CU registration",
      );
      // Don't update subject selections - this should be handled by admin separately
    }

    console.info(
      "[CU-REG DB UPDATE] Completed",
      JSON.stringify({ success: true, updatedFields, errors }),
    );

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      updatedFields,
    };
  } catch (error: any) {
    console.error("[CU-REG DB UPDATE] Error:", error);
    return {
      success: false,
      errors: [`Database update failed: ${error.message}`],
    };
  }
}

// Helper function to check if student's program course requires subject selection
async function isSubjectSelectionRequired(studentId: number): Promise<boolean> {
  try {
    // Get student's program course information
    const [studentData] = await db
      .select({
        programCourseName: programCourseModel.name,
      })
      .from(promotionModel)
      .innerJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .where(eq(promotionModel.studentId, studentId))
      .orderBy(desc(promotionModel.createdAt))
      .limit(1);

    if (!studentData?.programCourseName) {
      console.warn(
        `[CU-REG CORRECTION] No program course found for student ${studentId}, assuming subject selection required`,
      );
      return true; // Default to requiring subject selection if no program course found
    }

    // Normalize program course name (remove special characters, convert to uppercase)
    const normalizedName = studentData.programCourseName
      .normalize("NFKD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase();

    // Check if program course name starts with BBA, MA, or MCOM
    const blockedPrograms = ["BBA", "MA", "MCOM"];
    const isBlocked = blockedPrograms.some((program) =>
      normalizedName.startsWith(program),
    );

    console.info(
      `[CU-REG CORRECTION] Subject selection check for student ${studentId}:`,
      {
        programCourseName: studentData.programCourseName,
        normalizedName,
        isBlocked,
        subjectSelectionRequired: !isBlocked,
      },
    );

    return !isBlocked; // Subject selection is required if NOT blocked
  } catch (error) {
    console.error(
      `[CU-REG CORRECTION] Error checking subject selection requirement for student ${studentId}:`,
      error,
    );
    return true; // Default to requiring subject selection on error
  }
}

// Helper function to convert model to DTO
async function modelToDto(
  request: any,
): Promise<CuRegistrationCorrectionRequestDto> {
  // Get student details with user info and program course
  const [studentData] = await db
    .select({
      id: studentModel.id,
      legacyStudentId: studentModel.legacyStudentId,
      userId: studentModel.userId,
      applicationId: studentModel.applicationId,
      admissionCourseDetailsId: studentModel.admissionCourseDetailsId,
      programCourseId: studentModel.programCourseId,
      specializationId: studentModel.specializationId,
      uid: studentModel.uid,
      oldUid: studentModel.oldUid,
      rfidNumber: studentModel.rfidNumber,
      cuFormNumber: studentModel.cuFormNumber,
      registrationNumber: studentModel.registrationNumber,
      rollNumber: studentModel.rollNumber,
      classRollNumber: studentModel.classRollNumber,
      apaarId: studentModel.apaarId,

      checkRepeat: studentModel.checkRepeat,
      community: studentModel.community,
      handicapped: studentModel.handicapped,
      lastPassedYear: studentModel.lastPassedYear,
      notes: studentModel.notes,
      active: studentModel.active,
      alumni: studentModel.alumni,
      leavingDate: studentModel.leavingDate,
      leavingReason: studentModel.leavingReason,
      createdAt: studentModel.createdAt,
      updatedAt: studentModel.updatedAt,
      programCourseName: programCourseModel.name,
      user: {
        id: userModel.id,
        name: userModel.name,
        email: userModel.email,
        phone: userModel.phone,
        whatsappNumber: userModel.whatsappNumber,
        image: userModel.image,
        type: userModel.type,
        isSuspended: userModel.isSuspended,
        suspendedReason: userModel.suspendedReason,
        suspendedTillDate: userModel.suspendedTillDate,
        isActive: userModel.isActive,
        sendStagingNotifications: userModel.sendStagingNotifications,
        createdAt: userModel.createdAt,
        updatedAt: userModel.updatedAt,
      },
    })
    .from(studentModel)
    .leftJoin(userModel, eq(studentModel.userId, userModel.id))
    .leftJoin(
      programCourseModel,
      eq(studentModel.programCourseId, programCourseModel.id),
    )
    .where(eq(studentModel.id, request.studentId));

  // Get physical registration marked by details
  let physicalRegistrationDoneBy = null;
  if (request.physicalRegistrationDoneBy) {
    const [marker] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, request.physicalRegistrationDoneBy));
    physicalRegistrationDoneBy = marker;
  }

  // Get last updated by details
  let lastUpdatedBy = null;
  if (request.lastUpdatedBy) {
    const [updater] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, request.lastUpdatedBy));
    lastUpdatedBy = updater;
  }

  // Get documents
  const documents = await db
    .select({
      id: cuRegistrationDocumentUploadModel.id,
      documentUrl: cuRegistrationDocumentUploadModel.documentUrl,
      path: cuRegistrationDocumentUploadModel.path,
      fileName: cuRegistrationDocumentUploadModel.fileName,
      fileType: cuRegistrationDocumentUploadModel.fileType,
      fileSize: cuRegistrationDocumentUploadModel.fileSize,
      remarks: cuRegistrationDocumentUploadModel.remarks,
      createdAt: cuRegistrationDocumentUploadModel.createdAt,
      updatedAt: cuRegistrationDocumentUploadModel.updatedAt,
      document: {
        id: documentModel.id,
        name: documentModel.name,
        description: documentModel.description,
        sequence: documentModel.sequence,
        isActive: documentModel.isActive,
        createdAt: documentModel.createdAt,
        updatedAt: documentModel.updatedAt,
      },
    })
    .from(cuRegistrationDocumentUploadModel)
    .leftJoin(
      documentModel,
      eq(cuRegistrationDocumentUploadModel.documentId, documentModel.id),
    )
    .where(
      eq(
        cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
        request.id,
      ),
    );

  return {
    id: request.id,
    cuRegistrationApplicationNumber: request.cuRegistrationApplicationNumber,
    status: request.status,
    remarks: request.remarks,
    // Declarations
    introductoryDeclaration: request.introductoryDeclaration,
    personalInfoDeclaration: request.personalInfoDeclaration,
    addressInfoDeclaration: request.addressInfoDeclaration,
    subjectsDeclaration: request.subjectsDeclaration,
    documentsDeclaration: request.documentsDeclaration,
    onlineRegistrationDone: request.onlineRegistrationDone,
    physicalRegistrationDone: request.physicalRegistrationDone,
    physicalRegistrationDoneAt: request.physicalRegistrationDoneAt,
    physicalRegistrationDoneBy: physicalRegistrationDoneBy,
    lastUpdatedBy: lastUpdatedBy,
    genderCorrectionRequest: request.genderCorrectionRequest,
    nationalityCorrectionRequest: request.nationalityCorrectionRequest,
    aadhaarCardNumberCorrectionRequest:
      request.aadhaarCardNumberCorrectionRequest,
    apaarIdCorrectionRequest: request.apaarIdCorrectionRequest,
    subjectsCorrectionRequest: request.subjectsCorrectionRequest,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    student: studentData!,
    documents: documents.map((doc) => ({
      id: doc.id,
      documentUrl: doc.documentUrl,
      path: doc.path,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      remarks: doc.remarks,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      document: doc.document!,
      file: null as any, // This will be handled in the controller for file uploads
    })),
  };
}

// NOTIFICATION FUNCTIONS

export interface AdmissionRegistrationNotificationData {
  studentId: number;
  studentEmail: string;
  studentName: string;
  studentUid: string;
  applicationNumber: string;
  courseName: string;
  submissionDate: string;
  pdfUrl: string;
  pdfBuffer: Buffer;
  studentPhone?: string;
  studentWhatsappNumber?: string;
  // Template data for conditional document display
  isEWS?: boolean;
  isPWD?: boolean;
  isSCSTOBC?: boolean;
  isIndian?: boolean;
  hasCURegistration?: boolean;
  boardCode?: string;
}

export interface AdmissionRegistrationNotificationResult {
  success: boolean;
  error?: string;
  notificationId?: number;
}

/**
 * Send admission registration congratulations email with PDF attachment
 */
export const sendAdmissionRegistrationEmailNotification = async (
  data: AdmissionRegistrationNotificationData,
): Promise<AdmissionRegistrationNotificationResult> => {
  try {
    console.log(
      "📧 [CU-REG-NOTIF] Sending admission registration email notification",
    );
    console.log("📧 [CU-REG-NOTIF] Data:", {
      studentId: data.studentId,
      studentEmail: data.studentEmail,
      studentName: data.studentName,
      applicationNumber: data.applicationNumber,
    });

    // Get the admission registration notification master for EMAIL
    const [emailMaster] = await db
      .select()
      .from(notificationMasterModel)
      .where(
        and(
          eq(notificationMasterModel.name, "Admission Reg. Form"),
          eq(notificationMasterModel.template, "adm-reg-form"),
          eq(notificationMasterModel.variant, "EMAIL"),
        ),
      );

    if (!emailMaster) {
      throw new Error(
        "Admission Registration EMAIL notification master not found",
      );
    }

    console.log("📧 [CU-REG-NOTIF] Found notification master:", emailMaster.id);

    // Check environment-specific logic
    const redirectToDev = shouldRedirectToDeveloper();
    const sendToStaffOnly = shouldSendToStaffOnly();
    const { devEmail, devPhone } = getDeveloperContact();

    // Determine notification recipients based on environment
    let otherUsersEmails: string[] = [];
    let otherUsersWhatsAppNumbers: string[] = [];
    let shouldSendToStudent = false; // Default: not send to student

    if (redirectToDev && devEmail) {
      // Development: send ONLY to developer, NOT to student
      otherUsersEmails = [devEmail];
      shouldSendToStudent = false; // Don't send to student in dev
      console.log(
        `📧 [CU-REG-NOTIF] [DEV MODE] Sending ONLY to developer: ${devEmail} (NOT to student)`,
      );
    } else if (sendToStaffOnly) {
      // Staging: send ONLY to staff, NOT to student
      try {
        const staffUsers = await db
          .select({
            email: userModel.email,
            phone: userModel.phone,
            whatsappNumber: userModel.whatsappNumber,
          })
          .from(userModel)
          .where(
            and(
              or(eq(userModel.type, "STAFF"), eq(userModel.type, "ADMIN")),
              eq(userModel.sendStagingNotifications, true),
              eq(userModel.isActive, true),
              eq(userModel.isSuspended, false),
            ),
          );

        otherUsersEmails = staffUsers
          .map((user) => user.email)
          .filter(
            (email): email is string => email !== null && email !== undefined,
          );

        otherUsersWhatsAppNumbers = staffUsers
          .map((user) => user.whatsappNumber || user.phone)
          .filter(
            (phone): phone is string => phone !== null && phone !== undefined,
          );

        shouldSendToStudent = false; // Don't send to student in staging
        console.log(
          `📧 [CU-REG-NOTIF] [STAGING] Sending ONLY to staff: ${otherUsersEmails.join(", ")} (NOT to student)`,
        );
        console.log(
          `📱 [CU-REG-NOTIF] [STAGING] Staff WhatsApp numbers: ${otherUsersWhatsAppNumbers.join(", ")}`,
        );
      } catch (error) {
        console.error(
          "❌ [CU-REG-NOTIF] Error fetching staff users for staging:",
          error,
        );
      }
    } else {
      // Production: send to real user (no additional recipients)
      shouldSendToStudent = true; // Send to student in production
      console.log(
        `📧 [CU-REG-NOTIF] [PRODUCTION] Sending to real user: ${data.studentEmail}`,
      );
    }

    // Prepare notification data based on environment
    let notificationData;

    if (shouldSendToStudent) {
      // Production: send to student
      notificationData = {
        userId: data.studentId,
        variant: "EMAIL" as const,
        type: "ADMISSION" as const,
        message: `Your admission registration form has been successfully submitted. Application Number: ${data.applicationNumber}`,
        notificationMasterId: emailMaster.id,
        otherUsersEmails: undefined, // No additional recipients in production
        otherUsersWhatsAppNumbers: undefined,
        // Store PDF S3 URL for email worker to download
        emailAttachments: data.pdfUrl ? [{ pdfS3Url: data.pdfUrl }] : undefined,
        // Pass template data for conditional document display
        notificationEvent: {
          templateData: {
            isEWS: data.isEWS,
            isPWD: data.isPWD,
            isSCSTOBC: data.isSCSTOBC,
            isIndian: data.isIndian,
            hasCURegistration: data.hasCURegistration,
            boardCode: data.boardCode,
          },
        },
      };
    } else {
      // Development/Staging: send to other users only
      notificationData = {
        userId: data.studentId, // Still need a userId for the notification record
        variant: "EMAIL" as const,
        type: "ADMISSION" as const,
        message: `Admission registration form submitted for testing. Application Number: ${data.applicationNumber}`,
        notificationMasterId: emailMaster.id,
        // Set otherUsersEmails for development/staging (not sent to real student)
        otherUsersEmails:
          otherUsersEmails.length > 0 ? otherUsersEmails : undefined,
        otherUsersWhatsAppNumbers: undefined, // Email variant doesn't need WhatsApp numbers
        // Store PDF S3 URL for email worker to download
        emailAttachments: data.pdfUrl ? [{ pdfS3Url: data.pdfUrl }] : undefined,
        // Pass template data for conditional document display
        notificationEvent: {
          templateData: {
            isEWS: data.isEWS,
            isPWD: data.isPWD,
            isSCSTOBC: data.isSCSTOBC,
            isIndian: data.isIndian,
            hasCURegistration: data.hasCURegistration,
            boardCode: data.boardCode,
          },
        },
      };
    }

    console.log("📧 [CU-REG-NOTIF] Enqueuing notification with data:", {
      userId: notificationData.userId,
      variant: notificationData.variant,
      type: notificationData.type,
      notificationMasterId: notificationData.notificationMasterId,
      shouldSendToStudent: shouldSendToStudent,
      hasOtherUsersEmails: otherUsersEmails.length > 0,
      hasOtherUsersWhatsApp: otherUsersWhatsAppNumbers.length > 0,
      hasTemplateData: !!notificationData.notificationEvent?.templateData,
      templateDataKeys: notificationData.notificationEvent?.templateData
        ? Object.keys(notificationData.notificationEvent.templateData)
        : [],
    });

    // Enqueue the notification
    const result = await enqueueNotification(notificationData);
    console.log(
      "✅ [CU-REG-NOTIF] Admission registration email notification enqueued successfully",
    );

    return {
      success: true,
      notificationId: (result as any)?.id || (result as any)?.notificationId,
    };
  } catch (error) {
    console.error(
      "❌ [CU-REG-NOTIF] Error sending admission registration email notification:",
      error,
    );
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Send admission registration WhatsApp notification with PDF access link
 */
export const sendAdmissionRegistrationWhatsAppNotification = async (
  data: AdmissionRegistrationNotificationData,
): Promise<AdmissionRegistrationNotificationResult> => {
  try {
    console.log(
      "📱 [CU-REG-NOTIF] Sending admission registration WhatsApp notification",
    );
    console.log("📱 [CU-REG-NOTIF] Data:", {
      studentId: data.studentId,
      studentName: data.studentName,
      applicationNumber: data.applicationNumber,
      studentPhone: data.studentPhone,
      studentWhatsappNumber: data.studentWhatsappNumber,
    });

    // Check if phone number is available
    const phoneNumber = data.studentWhatsappNumber || data.studentPhone;
    if (!phoneNumber) {
      console.warn(
        "📱 [CU-REG-NOTIF] No phone number available for WhatsApp notification",
      );
      return {
        success: false,
        error: "No phone number available for WhatsApp notification",
      };
    }

    // Get the admission registration notification master for WHATSAPP
    console.log(
      "📱 [CU-REG-NOTIF] Searching for WhatsApp notification master...",
    );
    const [whatsappMaster] = await db
      .select()
      .from(notificationMasterModel)
      .where(
        and(
          eq(notificationMasterModel.name, "Admission Reg. Form"),
          eq(notificationMasterModel.template, "regp1conf"),
          eq(notificationMasterModel.variant, "WHATSAPP"),
        ),
      );

    console.log(
      "📱 [CU-REG-NOTIF] WhatsApp master search result:",
      whatsappMaster,
    );

    if (!whatsappMaster) {
      console.error(
        "📱 [CU-REG-NOTIF] WhatsApp notification master not found!",
      );
      console.log("📱 [CU-REG-NOTIF] Available notification masters:");
      const allMasters = await db
        .select()
        .from(notificationMasterModel)
        .where(eq(notificationMasterModel.name, "Admission Reg. Form"));
      console.log(
        "📱 [CU-REG-NOTIF] All 'Admission Reg. Form' masters:",
        allMasters,
      );

      return {
        success: false,
        error: "Admission Registration WHATSAPP notification master not found",
      };
    }

    console.log(
      "📱 [CU-REG-NOTIF] Found WhatsApp notification master:",
      whatsappMaster.id,
    );

    // Check environment-specific logic
    const redirectToDev = shouldRedirectToDeveloper();
    const sendToStaffOnly = shouldSendToStaffOnly();
    const { devPhone } = getDeveloperContact();

    // Determine notification recipients based on environment
    let targetPhone = phoneNumber;
    let shouldSendToStudent = false; // Default: not send to student
    let otherUsersWhatsAppNumbers: string[] = []; // For dev/staging WhatsApp notifications

    if (redirectToDev && devPhone) {
      // Development: send ONLY to developer, NOT to student
      targetPhone = devPhone;
      otherUsersWhatsAppNumbers = [devPhone];
      shouldSendToStudent = false; // Don't send to student in dev
      console.log(
        `📱 [CU-REG-NOTIF] [DEV MODE] Sending ONLY to developer: ${devPhone} (NOT to student)`,
      );
    } else if (sendToStaffOnly) {
      // Staging: send ONLY to staff, NOT to student
      try {
        const staffUsers = await db
          .select({
            phone: userModel.phone,
            whatsappNumber: userModel.whatsappNumber,
          })
          .from(userModel)
          .where(
            and(
              or(eq(userModel.type, "STAFF"), eq(userModel.type, "ADMIN")),
              eq(userModel.sendStagingNotifications, true),
              eq(userModel.isActive, true),
              eq(userModel.isSuspended, false),
            ),
          );

        const staffPhones = staffUsers
          .map((user) => user.whatsappNumber || user.phone)
          .filter(
            (phone): phone is string => phone !== null && phone !== undefined,
          );

        if (staffPhones.length > 0) {
          targetPhone = staffPhones[0]; // Use first staff phone for staging
          otherUsersWhatsAppNumbers = staffPhones; // Set all staff phones for otherUsersWhatsAppNumbers
          shouldSendToStudent = false; // Don't send to student in staging
          console.log(
            `📱 [CU-REG-NOTIF] [STAGING] Sending ONLY to staff: ${targetPhone} (NOT to student)`,
          );
        } else {
          console.log(
            `📱 [CU-REG-NOTIF] [STAGING] No staff users found with staging notifications enabled`,
          );
          return {
            success: false,
            error: "No staff users found for staging notifications",
          };
        }
      } catch (error) {
        console.error(
          "❌ [CU-REG-NOTIF] Error fetching staff users for staging:",
          error,
        );
        return {
          success: false,
          error: "Error fetching staff users for staging",
        };
      }
    } else {
      // Production: send to real user (no additional recipients)
      shouldSendToStudent = true; // Send to student in production
      console.log(
        `📱 [CU-REG-NOTIF] [PRODUCTION] Sending to real user: ${phoneNumber}`,
      );
    }

    // Generate PDF access URL using encoded application number
    const admRegFormService = new AdmRegFormService();
    const baseUrl = `${process.env.BACKEND_URL}`;
    const pdfAccessUrl = admRegFormService.generatePdfAccessUrl(
      data.applicationNumber,
      baseUrl,
    );

    console.log("📱 [CU-REG-NOTIF] Generated PDF access URL:", pdfAccessUrl);

    // Prepare notification data based on environment
    let notificationData;

    if (shouldSendToStudent) {
      // Production: send to student
      notificationData = {
        userId: data.studentId,
        variant: "WHATSAPP" as const,
        type: "ADMISSION" as const,
        message: `Your admission registration form has been successfully submitted. Application Number: ${data.applicationNumber}`,
        notificationMasterId: whatsappMaster.id,
        notificationEvent: {
          templateData: {
            studentName: data.studentName,
            applicationNumber: data.applicationNumber,
            courseName: data.courseName,
            submissionDate: data.submissionDate,
            pdfAccessUrl: pdfAccessUrl,
          },
          // Body values for Interakt template placeholders
          bodyValues: [data.studentName, data.applicationNumber, pdfAccessUrl],
        },
      };
    } else {
      // Development/Staging: send to other users only
      notificationData = {
        userId: data.studentId, // Still need a userId for the notification record
        variant: "WHATSAPP" as const,
        type: "ADMISSION" as const,
        message: `Admission registration form submitted for testing. Application Number: ${data.applicationNumber}`,
        notificationMasterId: whatsappMaster.id,
        // Set otherUsersWhatsAppNumbers for development/staging (not sent to real student)
        otherUsersEmails: undefined, // WhatsApp variant doesn't need email addresses
        otherUsersWhatsAppNumbers:
          otherUsersWhatsAppNumbers.length > 0
            ? otherUsersWhatsAppNumbers
            : undefined,
        notificationEvent: {
          templateData: {
            studentName: redirectToDev
              ? `Developer (Original: ${data.studentName})`
              : `Staff Member (${data.studentName})`,
            applicationNumber: data.applicationNumber,
            courseName: data.courseName,
            submissionDate: data.submissionDate,
            pdfAccessUrl: pdfAccessUrl,
            ...(redirectToDev && {
              originalRecipient: phoneNumber,
              originalStudentName: data.studentName,
            }),
            ...(sendToStaffOnly && {
              environment: "staging",
              recipientType: "staff",
            }),
          },
          // Body values for Interakt template placeholders
          bodyValues: [
            redirectToDev
              ? `Developer (Original: ${data.studentName})`
              : `Staff Member (${data.studentName})`,
            data.applicationNumber,
            pdfAccessUrl,
          ],
        },
      };
    }

    console.log(
      "📱 [CU-REG-NOTIF] Enqueuing WhatsApp notification with data:",
      {
        userId: notificationData.userId,
        variant: notificationData.variant,
        type: notificationData.type,
        notificationMasterId: notificationData.notificationMasterId,
        shouldSendToStudent: shouldSendToStudent,
        targetPhone: targetPhone,
      },
    );

    // Enqueue the notification
    const result = await enqueueNotification(notificationData);
    console.log(
      "✅ [CU-REG-NOTIF] Admission registration WhatsApp notification enqueued successfully",
    );

    return {
      success: true,
      notificationId: (result as any)?.id || (result as any)?.notificationId,
    };
  } catch (error) {
    console.error(
      "❌ [CU-REG-NOTIF] Error sending admission registration WhatsApp notification:",
      error,
    );
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Send admission registration notification with PDF attachment
 * This function should be called after successful PDF generation
 * IMPORTANT: This function NEVER generates application numbers - it only uses the one passed to it
 */
export const sendAdmissionRegistrationNotification = async (
  studentId: number,
  applicationNumber: string, // MUST be the existing application number - never generate new
  pdfBuffer: Buffer, // PDF buffer directly from memory
  pdfUrl: string, // S3 URL for reference
): Promise<AdmissionRegistrationNotificationResult> => {
  try {
    // CRITICAL VALIDATION: Ensure application number is provided and not empty
    if (!applicationNumber || applicationNumber.trim() === "") {
      throw new Error(
        "Application number is required for email notification. Cannot send notification without application number.",
      );
    }

    console.log(
      "📧 [CU-REG-NOTIF] Starting admission registration notification process",
      {
        studentId,
        applicationNumber,
        note: "Using EXISTING application number - NOT generating new",
      },
    );

    // Get student details with user info, personal details, board, and category (studentId -> student -> user -> personal details -> admission academic info -> board/category/nationality)
    const { personalDetailsModel, boardModel, admissionAcademicInfoModel } =
      await import("@repo/db/schemas/models");
    const { categoryModel, nationalityModel } = await import(
      "@repo/db/schemas/models/resources"
    );
    const [studentData] = await db
      .select({
        studentId: studentModel.id,
        studentUid: studentModel.uid,
        userId: studentModel.userId,
        userName: userModel.name,
        userEmail: userModel.email,
        userPhone: userModel.phone,
        userWhatsappNumber: userModel.whatsappNumber,
        handicapped: studentModel.handicapped,
        belongsToEWS: studentModel.belongsToEWS,
        boardCode: boardModel.code,
        cuRegistrationNumber: admissionAcademicInfoModel.cuRegistrationNumber,
        // Personal details
        disability: personalDetailsModel.disability,
        categoryName: categoryModel.name,
        nationalityName: nationalityModel.name,
      })
      .from(studentModel)
      .innerJoin(userModel, eq(studentModel.userId, userModel.id))
      .leftJoin(
        personalDetailsModel,
        eq(userModel.id, personalDetailsModel.userId),
      )
      .leftJoin(
        admissionAcademicInfoModel,
        eq(studentModel.id, admissionAcademicInfoModel.studentId),
      )
      .leftJoin(
        boardModel,
        eq(admissionAcademicInfoModel.boardId, boardModel.id),
      )
      .leftJoin(
        nationalityModel,
        eq(personalDetailsModel.nationalityId, nationalityModel.id),
      )
      .leftJoin(
        categoryModel,
        eq(personalDetailsModel.categoryId, categoryModel.id),
      )
      .where(eq(studentModel.id, studentId));

    console.log("📧 [CU-REG-NOTIF] Fetched student data from database:", {
      studentId,
      studentUid: studentData?.studentUid,
      userName: studentData?.userName,
      userEmail: studentData?.userEmail,
    });

    if (!studentData) {
      throw new Error(`Student not found for ID: ${studentId}`);
    }

    // Compute flags for conditional document display (same logic as PDF generation)
    const isPWD = !!(studentData.handicapped || !!studentData.disability);
    const isEWS = !!studentData.belongsToEWS;
    const isSCSTOBC = ["SC", "ST", "OBC"].includes(
      (studentData.categoryName || "").toUpperCase(),
    );
    const isIndian =
      (studentData.nationalityName || "").toLowerCase() === "indian";
    const hasCURegistration = !!studentData.cuRegistrationNumber;
    const boardCode = studentData.boardCode || undefined;

    console.log("📧 [CU-REG-NOTIF] Computed flags:", {
      isPWD,
      isEWS,
      isSCSTOBC,
      isIndian,
      hasCURegistration,
      boardCode,
      handicapped: studentData.handicapped,
      disability: studentData.disability,
      belongsToEWS: studentData.belongsToEWS,
      categoryName: studentData.categoryName,
      nationalityName: studentData.nationalityName,
      cuRegistrationNumber: studentData.cuRegistrationNumber,
    });

    // Prepare notification data
    const notificationData: AdmissionRegistrationNotificationData = {
      studentId: studentData.userId, // Use the actual user ID for the notification
      studentEmail: studentData.userEmail || "",
      studentName: studentData.userName || "Student",
      studentUid: studentData.studentUid || "",
      applicationNumber: applicationNumber,
      courseName: "B.Com (H)", // This should be fetched from student's course
      submissionDate: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      pdfUrl: pdfUrl,
      pdfBuffer: pdfBuffer,
      studentPhone: studentData.userPhone || undefined,
      studentWhatsappNumber: studentData.userWhatsappNumber || undefined,
      // Template data for conditional document display
      isEWS,
      isPWD,
      isSCSTOBC,
      isIndian,
      hasCURegistration,
      boardCode,
    };

    // Send both email and WhatsApp notifications
    console.log("📧 [CU-REG-NOTIF] Starting email notification...");
    const emailResult =
      await sendAdmissionRegistrationEmailNotification(notificationData);

    console.log("📱 [CU-REG-NOTIF] Starting WhatsApp notification...");
    const whatsappResult =
      await sendAdmissionRegistrationWhatsAppNotification(notificationData);

    console.log("📧 [CU-REG-NOTIF] Email notification result:", {
      success: emailResult.success,
      error: emailResult.error,
    });

    console.log("📱 [CU-REG-NOTIF] WhatsApp notification result:", {
      success: whatsappResult.success,
      error: whatsappResult.error,
    });

    // Return success if at least one notification was sent successfully
    const overallSuccess = emailResult.success || whatsappResult.success;

    if (overallSuccess) {
      console.log(
        "✅ [CU-REG-NOTIF] Admission registration notifications sent successfully",
      );
    } else {
      console.error(
        "❌ [CU-REG-NOTIF] Failed to send admission registration notifications",
      );
    }

    return {
      success: overallSuccess,
      error: overallSuccess
        ? undefined
        : "Both email and WhatsApp notifications failed",
      notificationId:
        emailResult.notificationId || whatsappResult.notificationId,
    };
  } catch (error) {
    console.error(
      "❌ [CU-REG-NOTIF] Error in admission registration notification process:",
      error,
    );
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

// Export interface for Excel data
interface CuRegistrationExportData {
  // Basic Info
  studentId: number;
  studentName: string;
  studentUid: string;
  programCourseName: string;
  cuRegistrationApplicationNumber: string;
  status: string;
  onlineRegistrationDone: boolean;
  physicalRegistrationDone: boolean;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  physicalRegistrationDoneAt: string;
  physicalRegistrationDoneByUserName: string;
  admissionRollNumber: string;

  // Personal Info (from UI)
  fullName: string;
  parentName: string;
  gender: string;
  nationality: string;
  ews: string;
  aadhaarNumber: string;
  apaarId: string;

  // Residential Address (from UI)
  residentialAddressLine: string;
  residentialCountry: string;
  residentialState: string;
  residentialDistrict: string;
  residentialCity: string;
  residentialPinCode: string;
  residentialPoliceStation: string;
  residentialPostOffice: string;
  residentialOtherCountry: string;
  residentialOtherState: string;
  residentialOtherDistrict: string;
  residentialOtherCity: string;

  // Mailing Address (from UI)
  mailingAddressLine: string;
  mailingCountry: string;
  mailingState: string;
  mailingDistrict: string;
  mailingCity: string;
  mailingPinCode: string;
  mailingPoliceStation: string;
  mailingPostOffice: string;
  mailingOtherCountry: string;
  mailingOtherState: string;
  mailingOtherDistrict: string;
  mailingOtherCity: string;

  // Documents (from UI)
  classXIIMarksheet: string;
  aadhaarCard: string;
  apaarIdCard: string;
  fatherPhotoId: string;
  motherPhotoId: string;
  ewsCertificate: string;

  // Correction Flags
  genderCorrectionRequest: boolean;
  nationalityCorrectionRequest: boolean;
  aadhaarCardNumberCorrectionRequest: boolean;
  apaarIdCorrectionRequest: boolean;
  subjectsCorrectionRequest: boolean;

  // Declarations
  personalInfoDeclaration: boolean;
  addressInfoDeclaration: boolean;
  subjectsDeclaration: boolean;
  documentsDeclaration: boolean;

  // User info
  createdByUserName: string;
  updatedByUserName: string;
}

// Export service function
export const exportCuRegistrationCorrectionRequests = async (
  academicYearId: number,
): Promise<Buffer> => {
  try {
    console.log(
      "🔍 [CU-REG-EXPORT] Starting export of CU registration correction requests",
    );

    // Get all correction requests with joined data in a single query
    const correctionRequests = await db
      .select({
        // Correction request data
        id: cuRegistrationCorrectionRequestModel.id,
        studentId: cuRegistrationCorrectionRequestModel.studentId,
        cuRegistrationApplicationNumber:
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
        status: cuRegistrationCorrectionRequestModel.status,
        onlineRegistrationDone:
          cuRegistrationCorrectionRequestModel.onlineRegistrationDone,
        physicalRegistrationDone:
          cuRegistrationCorrectionRequestModel.physicalRegistrationDone,
        remarks: cuRegistrationCorrectionRequestModel.remarks,
        createdAt: cuRegistrationCorrectionRequestModel.createdAt,
        updatedAt: cuRegistrationCorrectionRequestModel.updatedAt,
        genderCorrectionRequest:
          cuRegistrationCorrectionRequestModel.genderCorrectionRequest,
        nationalityCorrectionRequest:
          cuRegistrationCorrectionRequestModel.nationalityCorrectionRequest,
        aadhaarCardNumberCorrectionRequest:
          cuRegistrationCorrectionRequestModel.aadhaarCardNumberCorrectionRequest,
        apaarIdCorrectionRequest:
          cuRegistrationCorrectionRequestModel.apaarIdCorrectionRequest,
        subjectsCorrectionRequest:
          cuRegistrationCorrectionRequestModel.subjectsCorrectionRequest,
        personalInfoDeclaration:
          cuRegistrationCorrectionRequestModel.personalInfoDeclaration,
        addressInfoDeclaration:
          cuRegistrationCorrectionRequestModel.addressInfoDeclaration,
        subjectsDeclaration:
          cuRegistrationCorrectionRequestModel.subjectsDeclaration,
        documentsDeclaration:
          cuRegistrationCorrectionRequestModel.documentsDeclaration,
        physicalRegistrationDoneBy:
          cuRegistrationCorrectionRequestModel.physicalRegistrationDoneBy,
        physicalRegistrationDoneAt:
          cuRegistrationCorrectionRequestModel.physicalRegistrationDoneAt,

        // Student data
        studentUserId: studentModel.userId,
        studentBelongsToEWS: studentModel.belongsToEWS,
        studentApaarId: studentModel.apaarId,
        studentUid: studentModel.uid,
        studentProgramCourseId: studentModel.programCourseId,

        // User data
        userName: userModel.name,

        // Personal details
        personalDetailsId: personalDetailsModel.id,
        gender: personalDetailsModel.gender,
        nationalityId: personalDetailsModel.nationalityId,
        aadhaarCardNumber: personalDetailsModel.aadhaarCardNumber,

        // Nationality name
        nationalityName: nationalityModel.name,

        // Program course name
        programCourseName: programCourseModel.name,

        // Admission academic info
        admissionRollNumber: admissionAcademicInfoModel.rollNumber,

        // Address data (residential)
        residentialAddressLine: addressModel.addressLine,
        residentialCountryId: addressModel.countryId,
        residentialStateId: addressModel.stateId,
        residentialDistrictId: addressModel.districtId,
        residentialCityId: addressModel.cityId,
        residentialPinCode: addressModel.pincode,
        residentialPoliceStation: addressModel.otherPoliceStation,
        residentialPostOffice: addressModel.otherPostoffice,
        residentialOtherCountry: addressModel.otherCountry,
        residentialOtherState: addressModel.otherState,
        residentialOtherDistrict: addressModel.otherDistrict,
        residentialOtherCity: addressModel.otherCity,

        // Country/State/District/City names for residential
        residentialCountryName: countryModel.name,
        residentialStateName: stateModel.name,
        residentialDistrictName: districtModel.name,
        residentialCityName: cityModel.name,
      })
      .from(cuRegistrationCorrectionRequestModel)
      .leftJoin(
        studentModel,
        eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
      )
      .leftJoin(userModel, eq(studentModel.userId, userModel.id))
      .leftJoin(
        personalDetailsModel,
        eq(userModel.id, personalDetailsModel.userId),
      )
      .leftJoin(
        nationalityModel,
        eq(personalDetailsModel.nationalityId, nationalityModel.id),
      )
      .leftJoin(
        programCourseModel,
        eq(studentModel.programCourseId, programCourseModel.id),
      )
      .leftJoin(
        admissionAcademicInfoModel,
        eq(studentModel.id, admissionAcademicInfoModel.studentId),
      )
      .leftJoin(
        addressModel,
        and(
          eq(addressModel.personalDetailsId, personalDetailsModel.id),
          eq(addressModel.type, "RESIDENTIAL"),
        ),
      )
      .leftJoin(countryModel, eq(addressModel.countryId, countryModel.id))
      .leftJoin(stateModel, eq(addressModel.stateId, stateModel.id))
      .leftJoin(districtModel, eq(addressModel.districtId, districtModel.id))
      .leftJoin(cityModel, eq(addressModel.cityId, cityModel.id))
      .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
      .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
      .where(eq(sessionModel.academicYearId, academicYearId));

    console.log(
      `🔍 [CU-REG-EXPORT] Found ${correctionRequests.length} correction requests`,
    );

    // Get mailing addresses separately
    const mailingAddresses = await db
      .select({
        personalDetailsId: addressModel.personalDetailsId,
        addressLine: addressModel.addressLine,
        countryId: addressModel.countryId,
        stateId: addressModel.stateId,
        districtId: addressModel.districtId,
        cityId: addressModel.cityId,
        pincode: addressModel.pincode,
        otherPoliceStation: addressModel.otherPoliceStation,
        otherPostoffice: addressModel.otherPostoffice,
        otherCountry: addressModel.otherCountry,
        otherState: addressModel.otherState,
        otherDistrict: addressModel.otherDistrict,
        otherCity: addressModel.otherCity,
        countryName: countryModel.name,
        stateName: stateModel.name,
        districtName: districtModel.name,
        cityName: cityModel.name,
      })
      .from(addressModel)
      .leftJoin(countryModel, eq(addressModel.countryId, countryModel.id))
      .leftJoin(stateModel, eq(addressModel.stateId, stateModel.id))
      .leftJoin(districtModel, eq(addressModel.districtId, districtModel.id))
      .leftJoin(cityModel, eq(addressModel.cityId, cityModel.id))
      .where(eq(addressModel.type, "MAILING"));

    // Get user names for physical marked by
    const userIds = [
      ...new Set([
        ...correctionRequests
          .map((r) => r.physicalRegistrationDoneBy)
          .filter((id): id is number => id !== null),
      ]),
    ];

    const users =
      userIds.length > 0
        ? await db
            .select({
              id: userModel.id,
              name: userModel.name,
            })
            .from(userModel)
            .where(inArray(userModel.id, userIds))
        : [];

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // Get documents
    const documents = await db
      .select({
        cuRegistrationCorrectionRequestId:
          cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
        documentId: cuRegistrationDocumentUploadModel.documentId,
        fileName: cuRegistrationDocumentUploadModel.fileName,
      })
      .from(cuRegistrationDocumentUploadModel)
      .where(
        inArray(
          cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
          correctionRequests.map((r) => r.id),
        ),
      );

    // Create maps for quick lookup
    const mailingAddressMap = new Map();
    mailingAddresses.forEach((addr) => {
      if (addr.personalDetailsId) {
        mailingAddressMap.set(addr.personalDetailsId, addr);
      }
    });

    const documentMap = new Map();
    documents.forEach((doc) => {
      if (!documentMap.has(doc.cuRegistrationCorrectionRequestId)) {
        documentMap.set(doc.cuRegistrationCorrectionRequestId, {});
      }
      const docTypeMap: Record<number, string> = {
        1: "classXIIMarksheet",
        2: "aadhaarCard",
        3: "apaarIdCard",
        4: "fatherPhotoId",
        5: "motherPhotoId",
        10: "ewsCertificate",
      };
      const docType = docTypeMap[doc.documentId];
      if (docType) {
        documentMap.get(doc.cuRegistrationCorrectionRequestId)[docType] =
          doc.fileName || "Uploaded";
      }
    });

    // Format functions
    const formatApaarId = (apaarId: string) => {
      if (!apaarId || apaarId === "Not provided") return apaarId;
      const digits = apaarId.replace(/\D/g, "");
      if (digits.length === 12) {
        return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1-$2-$3-$4");
      }
      return apaarId;
    };

    const formatAadhaarNumber = (aadhaar: string) => {
      if (!aadhaar || aadhaar === "XXXX XXXX XXXX") return aadhaar;
      const digits = aadhaar.replace(/\D/g, "");
      if (digits.length === 12) {
        return digits.replace(/^(\d{4})(\d{4})(\d{4})$/, "$1-$2-$3");
      }
      return aadhaar;
    };

    // Helper function to format date/time in AM/PM format
    const formatDateTimeAMPM = (date: Date | null | undefined): string => {
      if (!date) return "";
      try {
        const dateObj = new Date(date);
        // Format as MM/DD/YYYY HH:MM:SS AM/PM in IST timezone
        const formatted = dateObj.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        return formatted;
      } catch (error) {
        console.error("Error formatting date:", error);
        return "";
      }
    };

    // Process data
    const exportData: CuRegistrationExportData[] = correctionRequests.map(
      (request) => {
        const mailingAddress = mailingAddressMap.get(request.personalDetailsId);
        const documents = documentMap.get(request.id) || {};

        return {
          // Basic Info
          studentId: request.studentId,
          studentName: request.userName || "",
          studentUid: request.studentUid || "",
          programCourseName: request.programCourseName || "",
          cuRegistrationApplicationNumber:
            request.cuRegistrationApplicationNumber || "",
          status: request.status || "",
          onlineRegistrationDone: request.onlineRegistrationDone || false,
          physicalRegistrationDone: request.physicalRegistrationDone || false,
          remarks: request.remarks || "",
          createdAt: formatDateTimeAMPM(request.createdAt),
          updatedAt: formatDateTimeAMPM(request.updatedAt),
          physicalRegistrationDoneAt: formatDateTimeAMPM(
            request.physicalRegistrationDoneAt,
          ),
          physicalRegistrationDoneByUserName: request.physicalRegistrationDoneBy
            ? userMap.get(request.physicalRegistrationDoneBy) || ""
            : "",
          admissionRollNumber: request.admissionRollNumber || "",

          // Personal Info
          fullName: request.userName || "",
          parentName: "", // Would need family details
          gender: request.gender || "",
          nationality: request.nationalityName || "",
          ews: request.studentBelongsToEWS ? "Yes" : "No",
          aadhaarNumber: formatAadhaarNumber(
            request.aadhaarCardNumber || "XXXX XXXX XXXX",
          ),
          apaarId: formatApaarId(request.studentApaarId || ""),

          // Residential Address
          residentialAddressLine: request.residentialAddressLine || "",
          residentialCountry: request.residentialCountryName || "",
          residentialState: request.residentialStateName || "",
          residentialDistrict: request.residentialDistrictName || "",
          residentialCity: request.residentialCityName || "",
          residentialPinCode: request.residentialPinCode || "",
          residentialPoliceStation: request.residentialPoliceStation || "",
          residentialPostOffice: request.residentialPostOffice || "",
          residentialOtherCountry: request.residentialOtherCountry || "",
          residentialOtherState: request.residentialOtherState || "",
          residentialOtherDistrict: request.residentialOtherDistrict || "",
          residentialOtherCity: request.residentialOtherCity || "",

          // Mailing Address
          mailingAddressLine: mailingAddress?.addressLine || "",
          mailingCountry: mailingAddress?.countryName || "",
          mailingState: mailingAddress?.stateName || "",
          mailingDistrict: mailingAddress?.districtName || "",
          mailingCity: mailingAddress?.cityName || "",
          mailingPinCode: mailingAddress?.pincode || "",
          mailingPoliceStation: mailingAddress?.otherPoliceStation || "",
          mailingPostOffice: mailingAddress?.otherPostoffice || "",
          mailingOtherCountry: mailingAddress?.otherCountry || "",
          mailingOtherState: mailingAddress?.otherState || "",
          mailingOtherDistrict: mailingAddress?.otherDistrict || "",
          mailingOtherCity: mailingAddress?.otherCity || "",

          // Documents
          classXIIMarksheet: documents.classXIIMarksheet || "",
          aadhaarCard: documents.aadhaarCard || "",
          apaarIdCard: documents.apaarIdCard || "",
          fatherPhotoId: documents.fatherPhotoId || "",
          motherPhotoId: documents.motherPhotoId || "",
          ewsCertificate: documents.ewsCertificate || "",

          // Correction Flags
          genderCorrectionRequest: request.genderCorrectionRequest || false,
          nationalityCorrectionRequest:
            request.nationalityCorrectionRequest || false,
          aadhaarCardNumberCorrectionRequest:
            request.aadhaarCardNumberCorrectionRequest || false,
          apaarIdCorrectionRequest: request.apaarIdCorrectionRequest || false,
          subjectsCorrectionRequest: request.subjectsCorrectionRequest || false,

          // Declarations
          personalInfoDeclaration: request.personalInfoDeclaration || false,
          addressInfoDeclaration: request.addressInfoDeclaration || false,
          subjectsDeclaration: request.subjectsDeclaration || false,
          documentsDeclaration: request.documentsDeclaration || false,

          // User info
          createdByUserName: "", // No longer tracked
          updatedByUserName: request.physicalRegistrationDoneBy
            ? userMap.get(request.physicalRegistrationDoneBy) || ""
            : "",
        };
      },
    );

    console.log(
      `🔍 [CU-REG-EXPORT] Processed ${exportData.length} records for export`,
    );

    // Create Excel workbook using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const correctionSheet = workbook.addWorksheet("cu-reg-correction-report");

    // Get column headers from the first record
    const correctionHeaders = Object.keys(exportData[0] || {});

    let highlightedCount = 0;

    if (correctionHeaders.length > 0) {
      // Add header row with styling
      correctionSheet.columns = correctionHeaders.map((header) => ({
        header: header,
        key: header,
        width: 20,
      }));

      // Style the header row
      correctionSheet.getRow(1).font = { bold: true };
      correctionSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Find column indices for fields that need highlighting
      const genderColIndex = correctionHeaders.indexOf("gender") + 1; // ExcelJS uses 1-based indexing
      const nationalityColIndex = correctionHeaders.indexOf("nationality") + 1;
      const aadhaarColIndex = correctionHeaders.indexOf("aadhaarNumber") + 1;
      const apaarColIndex = correctionHeaders.indexOf("apaarId") + 1;

      // Add data rows
      exportData.forEach((rowData) => {
        const row = correctionSheet.addRow(rowData);

        // Apply highlighting for correction flags
        if (rowData.genderCorrectionRequest && genderColIndex > 0) {
          const cell = row.getCell(genderColIndex);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" }, // Bright yellow
          };
          cell.font = { bold: true };
          highlightedCount++;
        }

        if (rowData.nationalityCorrectionRequest && nationalityColIndex > 0) {
          const cell = row.getCell(nationalityColIndex);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" }, // Bright yellow
          };
          cell.font = { bold: true };
          highlightedCount++;
        }

        if (rowData.aadhaarCardNumberCorrectionRequest && aadhaarColIndex > 0) {
          const cell = row.getCell(aadhaarColIndex);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" }, // Bright yellow
          };
          cell.font = { bold: true };
          highlightedCount++;
        }

        if (rowData.apaarIdCorrectionRequest && apaarColIndex > 0) {
          const cell = row.getCell(apaarColIndex);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" }, // Bright yellow
          };
          cell.font = { bold: true };
          highlightedCount++;
        }
      });
    } else {
      correctionSheet.addRow(["No data available"]);
    }

    console.log(
      `🔍 [CU-REG-EXPORT] Total cells highlighted: ${highlightedCount}`,
    );

    console.log("🔍 [CU-REG-EXPORT] Fetching CU registration report data");
    console.log(
      "🔍 [CU-REG-EXPORT] Academic Year ID:",
      academicYearId,
      typeof academicYearId,
    );

    // Ensure academicYearId is a valid number
    if (!academicYearId || isNaN(Number(academicYearId))) {
      throw new Error(`Invalid academicYearId: ${academicYearId}`);
    }

    // Convert to number for proper type
    const academicYearIdNum = Number(academicYearId);

    // Use pg pool directly to avoid Drizzle parameter binding issues with CTEs
    const queryText = `
          WITH latest_promotion AS (
              SELECT
                  p.*,
                  ROW_NUMBER() OVER (
                      PARTITION BY p.student_id_fk
                      ORDER BY COALESCE(p.date_of_joining, p.created_at) DESC NULLS LAST, p.id DESC
                  ) AS rn
              FROM promotions AS p
          ),
          promotion_current AS (
              SELECT * FROM latest_promotion WHERE rn = 1
          ),
          latest_academic_info AS (
              SELECT
                  a.*,
                  ROW_NUMBER() OVER (
                      PARTITION BY a.student_id_fk
                      ORDER BY COALESCE(a.updated_at, a.created_at) DESC NULLS LAST, a.id DESC
                  ) AS rn
              FROM admission_academic_info AS a
          ),
          academic_info_selected AS (
              SELECT * FROM latest_academic_info WHERE rn = 1
          ),
          family_with_names AS (
              SELECT
                  fd.user_id_fk AS user_id,
                  MAX(fd.annual_income_id_fk) AS annual_income_id,
                  MAX(pr.name) FILTER (WHERE pr.type = 'FATHER') AS father_name,
                  MAX(pr.name) FILTER (WHERE pr.type = 'MOTHER') AS mother_name,
                  MAX(pr.name) FILTER (WHERE pr.type = 'GUARDIAN') AS guardian_name
              FROM family_details AS fd
              LEFT JOIN person AS pr ON pr.family_id_fk = fd.id
              GROUP BY fd.user_id_fk
          ),
          address_residential AS (
              SELECT
                  a.personal_details_id_fk AS personal_details_id,
                  a.address_line, a.pincode, a.locality_type,
                  c.name AS country_name, s.name AS state_name,
                  ROW_NUMBER() OVER (
                      PARTITION BY a.personal_details_id_fk
                      ORDER BY COALESCE(a.updated_at, a.created_at) DESC NULLS LAST, a.id DESC
                  ) AS rn
              FROM address AS a
              LEFT JOIN countries c ON c.id = a.country_id_fk
              LEFT JOIN states s ON s.id = a.state_id_fk
              WHERE a.type = 'RESIDENTIAL'
          ),
          address_mailing AS (
              SELECT
                  a.personal_details_id_fk AS personal_details_id,
                  a.address_line, a.pincode,
                  c.name AS country_name, s.name AS state_name,
                  ROW_NUMBER() OVER (
                      PARTITION BY a.personal_details_id_fk
                      ORDER BY COALESCE(a.updated_at, a.created_at) DESC NULLS LAST, a.id DESC
                  ) AS rn
              FROM address AS a
              LEFT JOIN countries c ON c.id = a.country_id_fk
              LEFT JOIN states s ON s.id = a.state_id_fk
              WHERE a.type = 'MAILING'
          ),
          student_subjects_raw AS (
              SELECT
                  sss.student_id_fk AS student_id,
                  UPPER(COALESCE(st.code, '')) AS subject_type_code,
                  UPPER(COALESCE(ssm.label, '')) AS label_upper,
                  COALESCE(ssm.label, '') AS label,
                  subj.code AS subject_code,
                  subj.name AS subject_name,
                  ROW_NUMBER() OVER (
                      PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
                      ORDER BY sss.version DESC, sss.created_at DESC NULLS LAST, sss.id DESC
                  ) AS rn
              FROM student_subject_selections AS sss
              JOIN subject_selection_meta ssm ON ssm.id = sss.subject_selection_meta_id_fk
              LEFT JOIN subject_types st ON st.id = ssm.subject_type_id_fk
              LEFT JOIN subjects subj ON subj.id = sss.subject_id_fk
              WHERE sss.is_active = TRUE
          ),
          student_subjects_latest AS (
              SELECT student_id, subject_type_code, label_upper, label, subject_code, subject_name
              FROM student_subjects_raw WHERE rn = 1
          ),
          student_subjects_pivot AS (
              SELECT
                  student_id,
                  MAX(subject_code) FILTER (WHERE subject_type_code IN ('DSCC','CORE','MAJOR')) AS dscc_core,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MN' AND label_upper LIKE 'MINOR 1%') AS minor1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MN' AND label_upper LIKE 'MINOR 2%') AS minor2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MN' AND label_upper LIKE 'MINOR 3%') AS minor3,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MN' AND label_upper LIKE 'MINOR 4%') AS minor4,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND (label_upper LIKE 'AEC 1%' OR label_upper LIKE 'AEC (SEMESTER I%')) AS aec1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND label_upper LIKE 'AEC 2%') AS aec2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND (label_upper LIKE 'AEC 3%' OR label_upper LIKE 'AEC3%' OR label_upper LIKE 'AEC (SEMESTER III%' OR label_upper LIKE 'AEC (SEMESTER III & IV%')) AS aec3,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND (label_upper LIKE 'AEC 4%' OR label_upper LIKE 'AEC4%' OR label_upper LIKE 'AEC (SEMESTER V%')) AS aec4,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'IDC' AND label_upper LIKE 'IDC 1%') AS idc1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'IDC' AND label_upper LIKE 'IDC 2%') AS idc2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'IDC' AND label_upper LIKE 'IDC 3%') AS idc3,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND label_upper LIKE 'MDC 1%') AS mdc1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND label_upper LIKE 'MDC 2%') AS mdc2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND label_upper LIKE 'MDC 3%') AS mdc3,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND label_upper LIKE 'SEC 1%') AS sec1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND label_upper LIKE 'SEC 2%') AS sec2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'CVAC' OR label_upper LIKE 'CVAC%') AS cvac
              FROM student_subjects_latest
              GROUP BY student_id
          ),
          program_papers AS (
              SELECT
                  p.programe_course_id_fk AS program_course_id,
                  UPPER(st.code) AS subject_type_code,
                  UPPER(cls.name) AS class_name,
                  subj.code AS subject_code,
                  subj.name AS subject_name,
                  ROW_NUMBER() OVER (
                      PARTITION BY p.programe_course_id_fk, st.code, cls.name
                      ORDER BY p.sequence NULLS LAST, p.id
                  ) AS rn
              FROM papers p
              JOIN subject_types st ON st.id = p.subject_type_id_fk
              JOIN subjects subj ON subj.id = p.subject_id_fk
              JOIN classes cls ON cls.id = p.class_id_fk
              WHERE p.is_active = TRUE
          ),
          program_papers_first AS (
              SELECT program_course_id, subject_type_code, class_name, subject_code, subject_name
              FROM program_papers WHERE rn = 1
          ),
          paper_pivot AS (
              SELECT
                  program_course_id,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'DSCC' AND class_name LIKE 'SEMESTER I%') AS dscc_sem1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MN' AND class_name LIKE 'SEMESTER I%') AS mn_sem1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MN' AND class_name LIKE 'SEMESTER II%') AS mn_sem2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MN' AND class_name LIKE 'SEMESTER III%') AS mn_sem3,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND class_name LIKE 'SEMESTER I%') AS aec_sem1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND class_name LIKE 'SEMESTER II%') AS aec_sem2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND class_name LIKE 'SEMESTER III%') AS aec_sem3,
                  MAX(subject_code) FILTER (WHERE subject_type_code IN ('IDC','MDC') AND class_name LIKE 'SEMESTER I%') AS idc_sem1,
                  MAX(subject_code) FILTER (WHERE subject_type_code IN ('IDC','MDC') AND class_name LIKE 'SEMESTER II%') AS idc_sem2,
                  MAX(subject_code) FILTER (WHERE subject_type_code IN ('IDC','MDC') AND class_name LIKE 'SEMESTER III%') AS idc_sem3,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND class_name LIKE 'SEMESTER I%') AS mdc_sem1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND class_name LIKE 'SEMESTER II%') AS mdc_sem2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND class_name LIKE 'SEMESTER III%') AS mdc_sem3,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND class_name LIKE 'SEMESTER I%') AS sec_sem1,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND class_name LIKE 'SEMESTER II%') AS sec_sem2,
                  MAX(subject_code) FILTER (WHERE subject_type_code = 'CVAC' AND class_name LIKE 'SEMESTER II%') AS cvac_sem2
              FROM program_papers_first
              GROUP BY program_course_id
          ),
          student_context AS (
              SELECT
                  cr.cu_registration_application_number AS form_number,
                  std.id AS student_id,
                  std.user_id_fk AS user_id,
                  std.program_course_id_fk AS program_course_id,
                  std.uid, std.apaar_id, std.belongs_to_ews, std.handicapped,
                  u.name AS student_name, u.phone AS mobile_number,
                  pd.id AS personal_details_id, pd.email, pd.aadhaar_card_number,
                  pd.date_of_birth, pd.gender, pd.disability,
                  rlg.name AS religion_name, ct.name AS category_name,
                  nl.code AS nationality_code, nl.name AS nationality_name,
                  dc.code AS disability_code,
                  promo.date_of_joining, promo.shift_id_fk AS shift_id,
                  promo.class_id_fk AS class_id, promo.promotion_status_id_fk,
                  sh.name AS shift_name,
                  sess.id AS session_id, sess.name AS session_name,
                  ay.year AS session_year,
                  aai.id AS academic_info_id, aai.board_id_fk,
                  bd.name AS board_name, bd.code AS board_code,
                  aai.other_board, aai.roll_number AS board_roll_number,
                  aai.year_of_passing, aai.subject_studied, aai.cu_registration_number,
                  pc.university_code, pc.duration, pc.name AS program_course_name,
                  crs.name AS course_name, str.name AS stream_name,
                  ps.name AS admission_mode
              FROM cu_registration_correction_requests AS cr
              JOIN students std ON std.id = cr.student_id_fk
              JOIN users u ON u.id = std.user_id_fk
              LEFT JOIN personal_details pd ON pd.user_id_fk = u.id
              LEFT JOIN religion rlg ON rlg.id = pd.religion_id_fk
              LEFT JOIN categories ct ON ct.id = pd.category_id_fk
              LEFT JOIN nationality nl ON nl.id = pd.nationality_id_fk
              LEFT JOIN disability_codes dc ON dc.id = pd.disablity_code_id_fk
              LEFT JOIN promotion_current promo ON promo.student_id_fk = std.id
              LEFT JOIN shifts sh ON sh.id = promo.shift_id_fk
              LEFT JOIN sessions sess ON sess.id = promo.session_id_fk
              LEFT JOIN academic_years ay ON ay.id = sess.academic_id_fk
              LEFT JOIN promotion_status ps ON ps.id = promo.promotion_status_id_fk
              LEFT JOIN academic_info_selected aai ON aai.student_id_fk = std.id
              LEFT JOIN boards bd ON bd.id = aai.board_id_fk
              LEFT JOIN program_courses pc ON pc.id = std.program_course_id_fk
              LEFT JOIN courses crs ON crs.id = pc.course_id_fk
              LEFT JOIN streams str ON str.id = pc.stream_id_fk
              WHERE cr.cu_registration_application_number IS NOT NULL
                  AND ay.id = $1
          ),
          combined_subjects AS (
              SELECT
                  sc.student_id,
                  sc.stream_name,
                  COALESCE(sp.dscc_core, pp.dscc_sem1, sc.course_name) AS core_major,
                  COALESCE(sp.minor1, pp.mn_sem1) AS minor1,
                  COALESCE(sp.minor2, pp.mn_sem2, pp.mn_sem3) AS minor2,
                  COALESCE(sp.minor3, pp.mn_sem3) AS minor3,
                  COALESCE(sp.cvac, pp.cvac_sem2) AS cvac,
                  COALESCE(sp.aec1, pp.aec_sem1) AS aec1,
                  COALESCE(sp.aec2, pp.aec_sem2) AS aec2,
                  sp.aec3 AS aec3,
                  COALESCE(sp.idc1, pp.idc_sem1) AS idc1,
                  COALESCE(sp.idc2, pp.idc_sem2) AS idc2,
                  COALESCE(sp.idc3, pp.idc_sem3) AS idc3,
                  CASE WHEN sc.stream_name ILIKE 'Commerce%' THEN pp.mdc_sem1 ELSE NULL END AS mdc1,
                  CASE WHEN sc.stream_name ILIKE 'Commerce%' THEN pp.mdc_sem2 ELSE NULL END AS mdc2,
                  CASE WHEN sc.stream_name ILIKE 'Commerce%' THEN pp.mdc_sem3 ELSE NULL END AS mdc3,
                  pp.sec_sem1 AS sec1,
                  pp.sec_sem2 AS sec2
              FROM student_context sc
              LEFT JOIN student_subjects_pivot sp ON sp.student_id = sc.student_id
              LEFT JOIN paper_pivot pp ON pp.program_course_id = sc.program_course_id
          ),
          marks_base AS (
              SELECT
                  sc.student_id,
                  COALESCE(NULLIF(TRIM(bsn.code), ''), bsn.name, '') AS display_subject,
                  CASE
                      WHEN COALESCE(bs.full_marks_theory, 0) + COALESCE(bs.full_marks_practical, 0) > 0
                          THEN COALESCE(bs.full_marks_theory, 0) + COALESCE(bs.full_marks_practical, 0)
                      WHEN sas.total_marks IS NOT NULL AND sas.total_marks > 0 THEN 100
                      WHEN COALESCE(sas.theory_marks, 0) + COALESCE(sas.practical_marks, 0) > 0
                          THEN COALESCE(sas.theory_marks, 0) + COALESCE(sas.practical_marks, 0)
                      ELSE NULL
                  END AS full_marks,
                  COALESCE(
                      sas.total_marks,
                      COALESCE(sas.theory_marks, 0) + COALESCE(sas.practical_marks, 0)
                  ) AS obtained_marks
              FROM student_context sc
              INNER JOIN academic_info_selected aai ON aai.student_id_fk = sc.student_id
              INNER JOIN student_academic_subjects sas ON sas.admission_academic_info_id_fk = aai.id
              LEFT JOIN board_subjects bs ON bs.id = sas.board_subject_id_fk
              LEFT JOIN board_subject_names bsn ON bsn.id = bs.board_subject_name_id_fk
              WHERE (
                      COALESCE(sas.theory_marks, 0) + COALESCE(sas.practical_marks, 0) > 0
                      OR sas.total_marks IS NOT NULL
                  )
                  AND COALESCE(
                      sas.total_marks,
                      COALESCE(sas.theory_marks, 0) + COALESCE(sas.practical_marks, 0)
                  ) IS NOT NULL
                  AND (
                      NULLIF(TRIM(bsn.code), '') IS NOT NULL
                      OR (bsn.name IS NOT NULL AND bsn.name != '')
                  )
          ),
          marks_ranked AS (
              SELECT
                  mb.*,
                  CASE
                      WHEN mb.full_marks > 0 AND mb.obtained_marks IS NOT NULL
                          THEN LEAST(
                              ROUND(((mb.obtained_marks * 100.0) / mb.full_marks)::numeric, 2),
                              100.00
                          )
                      ELSE NULL
                  END AS percentage,
                  ROW_NUMBER() OVER (
                      PARTITION BY mb.student_id
                      ORDER BY mb.obtained_marks DESC NULLS LAST, mb.full_marks DESC, mb.display_subject
                  ) AS seq
              FROM marks_base mb
              WHERE mb.full_marks IS NOT NULL AND mb.obtained_marks IS NOT NULL
          ),
          top_four_pivot AS (
              SELECT
                  student_id,
                  MAX(display_subject) FILTER (WHERE seq = 1) AS subject_1,
                  MAX(display_subject) FILTER (WHERE seq = 2) AS subject_2,
                  MAX(display_subject) FILTER (WHERE seq = 3) AS subject_3,
                  MAX(display_subject) FILTER (WHERE seq = 4) AS subject_4,
                  MAX(full_marks) FILTER (WHERE seq = 1) AS full_marks_1,
                  MAX(full_marks) FILTER (WHERE seq = 2) AS full_marks_2,
                  MAX(full_marks) FILTER (WHERE seq = 3) AS full_marks_3,
                  MAX(full_marks) FILTER (WHERE seq = 4) AS full_marks_4,
                  MAX(obtained_marks) FILTER (WHERE seq = 1) AS marks_obt_1,
                  MAX(obtained_marks) FILTER (WHERE seq = 2) AS marks_obt_2,
                  MAX(obtained_marks) FILTER (WHERE seq = 3) AS marks_obt_3,
                  MAX(obtained_marks) FILTER (WHERE seq = 4) AS marks_obt_4,
                  MAX(percentage) FILTER (WHERE seq = 1) AS pct_1,
                  MAX(percentage) FILTER (WHERE seq = 2) AS pct_2,
                  MAX(percentage) FILTER (WHERE seq = 3) AS pct_3,
                  MAX(percentage) FILTER (WHERE seq = 4) AS pct_4,
                  SUM(full_marks) FILTER (WHERE seq <= 4) AS total_full,
                  SUM(obtained_marks) FILTER (WHERE seq <= 4) AS total_obt,
                  CASE
                      WHEN SUM(full_marks) FILTER (WHERE seq <= 4) > 0
                          THEN LEAST(
                              ROUND(
                                  (
                                      (SUM(obtained_marks) FILTER (WHERE seq <= 4) * 100.0) /
                                      NULLIF(SUM(full_marks) FILTER (WHERE seq <= 4), 0)
                                  )::numeric,
                                  2
                              ),
                              100.00
                          )
                      ELSE NULL
                  END AS total_pct
              FROM marks_ranked
              GROUP BY student_id
          ),
          others_ranked AS (
              SELECT
                  mr.student_id,
                  mr.display_subject AS subject_name,
                  mr.full_marks,
                  mr.obtained_marks,
                  mr.percentage,
                  (mr.seq - 4) AS ord
              FROM marks_ranked mr
              WHERE mr.seq > 4 AND mr.seq <= 8
          ),
          others_pivot AS (
              SELECT
                  student_id,
                  MAX(subject_name) FILTER (WHERE ord = 1) AS subject_1,
                  MAX(subject_name) FILTER (WHERE ord = 2) AS subject_2,
                  MAX(subject_name) FILTER (WHERE ord = 3) AS subject_3,
                  MAX(subject_name) FILTER (WHERE ord = 4) AS subject_4,
                  MAX(full_marks) FILTER (WHERE ord = 1) AS full_marks_1,
                  MAX(full_marks) FILTER (WHERE ord = 2) AS full_marks_2,
                  MAX(full_marks) FILTER (WHERE ord = 3) AS full_marks_3,
                  MAX(full_marks) FILTER (WHERE ord = 4) AS full_marks_4,
                  MAX(obtained_marks) FILTER (WHERE ord = 1) AS marks_obt_1,
                  MAX(obtained_marks) FILTER (WHERE ord = 2) AS marks_obt_2,
                  MAX(obtained_marks) FILTER (WHERE ord = 3) AS marks_obt_3,
                  MAX(obtained_marks) FILTER (WHERE ord = 4) AS marks_obt_4,
                  MAX(percentage) FILTER (WHERE ord = 1) AS pct_1,
                  MAX(percentage) FILTER (WHERE ord = 2) AS pct_2,
                  MAX(percentage) FILTER (WHERE ord = 3) AS pct_3,
                  MAX(percentage) FILTER (WHERE ord = 4) AS pct_4
              FROM others_ranked
              GROUP BY student_id
          )
          SELECT
              sc.form_number AS "Form_Number",
              sc.aadhaar_card_number AS "Aadhar_Number",
              sc.cu_registration_number AS "CU_Reg_Number",
              '017' AS "College_Name",
              COALESCE(sc.university_code, sc.course_name) AS "Course_Name",
              TO_CHAR(sc.date_of_joining, 'DD/MM/YYYY') AS "Date_of_Admission",
              sc.session_year AS "Session_of_Admission",
              'No' AS "Non_Formal_Education",
              sc.student_name AS "Student_Name",
              fam.father_name AS "Father_Name",
              fam.mother_name AS "Mother_Name",
              fam.guardian_name AS "Guardian_Name",
              TO_CHAR(sc.date_of_birth, 'DD/MM/YYYY') AS "Date_of_Birth",
              CASE
                  WHEN sc.gender::text ILIKE 'MALE' THEN 'M'
                  WHEN sc.gender::text ILIKE 'FEMALE' THEN 'F'
                  WHEN sc.gender::text ILIKE 'OTHER' THEN 'O'
                  ELSE NULL
              END AS "Gender",
              sc.religion_name AS "Religion",
              sc.category_name AS "Category",
              COALESCE(sc.nationality_code::text, sc.nationality_name) AS "Nationality",
              CASE
                  WHEN sc.handicapped OR sc.disability IS NOT NULL THEN 'Y'
                  ELSE 'N'
              END AS "Differently_Abled",
              sc.disability_code AS "Disability_Code",
              NULL AS "Disability_Percentage",
              sc.mobile_number AS "Contact_Mobile_Number",
              sc.email AS "Email_Id",
              'N' AS "BPL",
              CASE
                  WHEN sc.belongs_to_ews IS TRUE THEN 'Y'
                  WHEN sc.belongs_to_ews IS FALSE THEN 'N'
                  ELSE NULL
              END AS "EWS",
              ai.range AS "Family_Income",
              res.locality_type AS "Locality_Type",
              res.address_line AS "Present_Address",
              res.pincode AS "Present_Pin",
              res.state_name AS "Present_State",
              res.country_name AS "Present_Country",
              mail.address_line AS "Permanent_Address",
              mail.pincode AS "Permanent_Pin",
              mail.state_name AS "Permanent_State",
              mail.country_name AS "Permanent_Country",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.core_major, sc.course_name, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_Core_Major_Subject",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.minor1, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_1st_Minor_Subject",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.minor2, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_2nd_Minor_Subject",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.cvac, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_CVAC",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.aec1, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_AEC",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.idc1, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_IDC_1",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.idc2, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_IDC_2",
              CASE
                  WHEN sc.program_course_name ILIKE 'B.Com (H)%'
                      OR sc.program_course_name ILIKE 'BBA (H)%'
                      OR sc.program_course_name ILIKE 'B.Com (G)%'
                  THEN ''
                  ELSE COALESCE(cs.idc3, '')
              END AS "BA_BSC_BMUS_CVOC_Hons_IDC_3",
              '' AS "BA_BSC_MDC_Core_Subject_1",
              '' AS "BA_BSC_MDC_Core_Subject_2",
              '' AS "BA_BSC_MDC_Minor_Subject",
              '' AS "BA_BSC_MDC_SEC_1",
              '' AS "BA_BSC_MDC_SEC_2",
              '' AS "BA_BSC_MDC_CVAC",
              '' AS "BA_BSC_MDC_AEC",
              '' AS "BA_BSC_MDC_IDC_1",
              '' AS "BA_BSC_MDC_IDC_2",
              '' AS "BA_BSC_MDC_IDC_3",
              COALESCE(
                  CASE
                      WHEN sc.program_course_name ILIKE '%B.Com (H)%'
                          OR sc.program_course_name ILIKE '%B.Com(H)%'
                          OR sc.program_course_name ILIKE '%BCOM (H)%'
                          OR sc.program_course_name ILIKE '%BCOM(H)%'
                      THEN cs.minor3
                  END,
                  ''
              ) AS "BCOM_Hons_Minor",
              '' AS "BCOM_Hons_CVAC",
              '' AS "BCOM_Hons_AEC",
              COALESCE(
                  CASE
                      WHEN sc.program_course_name ILIKE '%B.Com (G)%'
                          OR sc.program_course_name ILIKE '%B.Com(G)%'
                          OR sc.program_course_name ILIKE '%BCOM (G)%'
                          OR sc.program_course_name ILIKE '%BCOM(G)%'
                      THEN cs.minor3
                  END,
                  ''
              ) AS "BCOM_3_Year_Minor",
              '' AS "BCOM_3_Year_CVAC",
              '' AS "BCOM_3_Year_AEC",
              COALESCE(
                  CASE
                      WHEN sc.board_code IN ('WBCHSE','ICSE','CBSE','NIOS')
                          THEN COALESCE(sc.board_name, sc.other_board)
                      ELSE NULL
                  END,
                  ''
              ) AS "Non_Migrating_Board",
              COALESCE(
                  CASE
                      WHEN sc.board_code IS NULL THEN sc.other_board
                      WHEN sc.board_code NOT IN ('WBCHSE','ICSE','CBSE','NIOS') THEN sc.board_name
                      ELSE NULL
                  END,
                  ''
              ) AS "Migrating_Board",
              'Class XII' AS "Last_Exam_Name",
              COALESCE(sc.board_code, sc.other_board, '') AS "Last_Exam_Board",
              COALESCE(sc.board_roll_number, '') AS "Last_Exam_Roll",
              COALESCE(sc.year_of_passing::text, '') AS "Last_Exam_YOP",
              COALESCE(tf.subject_1, '') AS "Top_Four_Subject_1",
              COALESCE(tf.subject_2, '') AS "Top_Four_Subject_2",
              COALESCE(tf.subject_3, '') AS "Top_Four_Subject_3",
              COALESCE(tf.subject_4, '') AS "Top_Four_Subject_4",
              COALESCE(tf.full_marks_1::text, '') AS "Top_Four_Full_Marks_1",
              COALESCE(tf.full_marks_2::text, '') AS "Top_Four_Full_Marks_2",
              COALESCE(tf.full_marks_3::text, '') AS "Top_Four_Full_Marks_3",
              COALESCE(tf.full_marks_4::text, '') AS "Top_Four_Full_Marks_4",
              COALESCE(tf.marks_obt_1::text, '') AS "Top_Four_Marks_Obt_1",
              COALESCE(tf.marks_obt_2::text, '') AS "Top_Four_Marks_Obt_2",
              COALESCE(tf.marks_obt_3::text, '') AS "Top_Four_Marks_Obt_3",
              COALESCE(tf.marks_obt_4::text, '') AS "Top_Four_Marks_Obt_4",
              COALESCE(tf.pct_1::text, '') AS "Top_Four_Marks_Prcntg_1",
              COALESCE(tf.pct_2::text, '') AS "Top_Four_Marks_Prcntg_2",
              COALESCE(tf.pct_3::text, '') AS "Top_Four_Marks_Prcntg_3",
              COALESCE(tf.pct_4::text, '') AS "Top_Four_Marks_Prcntg_4",
              COALESCE(tf.total_full::text, '') AS "Total_of_Top_Four_Full_Marks",
              COALESCE(tf.total_obt::text, '') AS "Total_of_Top_Four_Marks_Obtained",
              COALESCE(tf.total_pct::text, '') AS "Total_of_Top_Four_Marks_Percentage",
              COALESCE(ot.subject_1, '') AS "Others_Subject_1",
              COALESCE(ot.subject_2, '') AS "Others_Subject_2",
              COALESCE(ot.subject_3, '') AS "Others_Subject_3",
              COALESCE(ot.subject_4, '') AS "Others_Subject_4",
              COALESCE(ot.full_marks_1::text, '') AS "Others_Full_Marks_1",
              COALESCE(ot.full_marks_2::text, '') AS "Others_Full_Marks_2",
              COALESCE(ot.full_marks_3::text, '') AS "Others_Full_Marks_3",
              COALESCE(ot.full_marks_4::text, '') AS "Others_Full_Marks_4",
              COALESCE(ot.marks_obt_1::text, '') AS "Others_Marks_Obt_1",
              COALESCE(ot.marks_obt_2::text, '') AS "Others_Marks_Obt_2",
              COALESCE(ot.marks_obt_3::text, '') AS "Others_Marks_Obt_3",
              COALESCE(ot.marks_obt_4::text, '') AS "Others_Marks_Obt_4",
              COALESCE(ot.pct_1::text, '') AS "Others_Marks_Prcntg_1",
              COALESCE(ot.pct_2::text, '') AS "Others_Marks_Prcntg_2",
              COALESCE(ot.pct_3::text, '') AS "Others_Marks_Prcntg_3",
              COALESCE(ot.pct_4::text, '') AS "Others_Marks_Prcntg_4",
              'CLP' AS "Admission_Mode",
              COALESCE(sc.apaar_id, '') AS "ABC_Id",
              COALESCE(sc.uid::text, '') AS "UID"
          FROM student_context sc
          LEFT JOIN family_with_names fam ON fam.user_id = sc.user_id
          LEFT JOIN annual_incomes ai ON ai.id = fam.annual_income_id
          LEFT JOIN address_residential res ON res.personal_details_id = sc.personal_details_id AND res.rn = 1
          LEFT JOIN address_mailing mail ON mail.personal_details_id = sc.personal_details_id AND mail.rn = 1
          LEFT JOIN combined_subjects cs ON cs.student_id = sc.student_id
          LEFT JOIN top_four_pivot tf ON tf.student_id = sc.student_id
          LEFT JOIN others_pivot ot ON ot.student_id = sc.student_id
          ORDER BY sc.form_number;
        `;

    // Trim the query to remove leading/trailing whitespace
    const trimmedQuery = queryText.trim();

    console.log("🔍 [CU-REG-EXPORT] Query text length:", trimmedQuery.length);
    console.log("🔍 [CU-REG-EXPORT] Query parameters:", [academicYearIdNum]);
    console.log(
      "🔍 [CU-REG-EXPORT] Query text (first 1000 chars):",
      trimmedQuery.substring(0, 1000),
    );
    console.log(
      "🔍 [CU-REG-EXPORT] Query text (last 1000 chars):",
      trimmedQuery.substring(trimmedQuery.length - 1000),
    );

    // Count parentheses to check for balance
    const openParens = (trimmedQuery.match(/\(/g) || []).length;
    const closeParens = (trimmedQuery.match(/\)/g) || []).length;
    console.log(
      "🔍 [CU-REG-EXPORT] Parentheses count - Open:",
      openParens,
      "Close:",
      closeParens,
    );

    // Log the query around position 18529 if it exists (where the error occurred)
    if (trimmedQuery.length > 18529) {
      const startPos = Math.max(0, 18529 - 300);
      const endPos = Math.min(trimmedQuery.length, 18529 + 300);
      console.log(
        "🔍 [CU-REG-EXPORT] Query text around error position (18529):",
      );
      console.log(trimmedQuery.substring(startPos, endPos));
    }

    let cuRegistrationReportRows: any[] = [];
    try {
      const result = await pool.query(trimmedQuery, [academicYearIdNum]);
      cuRegistrationReportRows = result.rows;
    } catch (queryError: any) {
      console.error("❌ [CU-REG-EXPORT] SQL Query Error Details:");
      console.error("Error code:", queryError.code);
      console.error("Error message:", queryError.message);
      console.error("Error position:", queryError.position);
      console.error("Error detail:", queryError.detail);
      console.error("Error hint:", queryError.hint);

      if (queryError.position) {
        const errorPos = queryError.position;
        const startPos = Math.max(0, errorPos - 200);
        const endPos = Math.min(trimmedQuery.length, errorPos + 200);
        console.error(
          "Query text around error position:",
          trimmedQuery.substring(startPos, endPos),
        );
        console.error(
          "Character at error position:",
          trimmedQuery[errorPos - 1],
          "|",
          trimmedQuery[errorPos],
          "|",
          trimmedQuery[errorPos + 1],
        );
        console.error("Full query length:", trimmedQuery.length);
      }

      throw queryError;
    }

    console.log(
      `🔍 [CU-REG-EXPORT] Retrieved ${cuRegistrationReportRows.length} rows for cu-reg-report`,
    );

    const cuRegWorksheet = workbook.addWorksheet("cu-reg-report");
    const cuRegHeaders = Object.keys(
      cuRegistrationReportRows[0] || {},
    ) as string[];

    if (cuRegHeaders.length > 0) {
      cuRegWorksheet.columns = cuRegHeaders.map((header) => ({
        header,
        key: header,
        width: 20,
      }));

      cuRegWorksheet.getRow(1).font = { bold: true };
      cuRegWorksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      cuRegistrationReportRows.forEach((row) => {
        cuRegWorksheet.addRow(row);
      });
    } else {
      cuRegWorksheet.addRow(["No data available"]);
    }

    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    console.log("✅ [CU-REG-EXPORT] Excel export completed successfully");
    return Buffer.from(excelBuffer);
  } catch (error) {
    console.error(
      "❌ [CU-REG-EXPORT] Error exporting CU registration correction requests:",
      error,
    );
    throw error;
  }
};

const formNumbers: string[] = [
  "0170547",
  "0170521",
  "0170522",
  "0170523",
  "0170524",
  "0170525",
  "0170526",
  "0170527",
  "0170528",
  "0170529",
  "0170530",
];

// Function to send the notifications to the students for adm-reg-form for those who have submitted the reg-form (has application number) but pdf is not present in the s3 bucket
export async function sendAdmRegFormToNotSendStudents() {
  const arr: string[] = [];
  // Step 1: Fetch the students for those adm-reg-form pdf was not generated for those who has done online-reg and generated application number and not got pdf notifications
  const BATCH_SIZE = 500;
  const [{ totalFormsCount }] = await db
    .select({ totalFormsCount: count() })
    .from(cuRegistrationCorrectionRequestModel)
    .where(
      and(
        eq(cuRegistrationCorrectionRequestModel.onlineRegistrationDone, true),
        isNotNull(
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
        ),
      ),
    );

  const totalBatches = Math.ceil(totalFormsCount / BATCH_SIZE);
  let processed = 0; // how many with application number we actually checked
  let okCount = 0; // how many returned 200
  let missingCount = 0; // how many returned non-200
  let skippedNoApp = 0; // how many had no application number
  let errorCount = 0; // network or unexpected errors

  for (let page = 0; page < totalBatches; page++) {
    const forms = await db
      .select()
      .from(cuRegistrationCorrectionRequestModel)
      .where(
        and(
          eq(cuRegistrationCorrectionRequestModel.onlineRegistrationDone, true),
          isNotNull(
            cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
          ),
        ),
      )
      .orderBy(desc(cuRegistrationCorrectionRequestModel.createdAt))
      .limit(BATCH_SIZE)
      .offset(page * BATCH_SIZE);
    for (const form of forms) {
      if (!form.cuRegistrationApplicationNumber) {
        console.log("no application number  for form id:", form.id);
        skippedNoApp += 1;
        continue;
      }
      processed += 1;
      const [foundStudent] = await db
        .select()
        .from(studentModel)
        .where(eq(studentModel.id, form.studentId));
      // Now based on the adm-form-no see whether the pdf exist
      const pdfPath = await getUrlForAdmRegForm(
        foundStudent.id!,
        foundStudent.uid!,
        form.cuRegistrationApplicationNumber!,
      );
      try {
        const response = await fetch(pdfPath, { method: "GET" });
        // Request for pdf url and see whether the pdf is present
        // console.log(`[Check PDF Exists] Response for ${form.cuRegistrationApplicationNumber}:`, response.status);
        if (response.status !== 200) {
          missingCount += 1;
          console.log("form not found", form.cuRegistrationApplicationNumber);
          arr.push(form.cuRegistrationApplicationNumber!);

          // Generate the pdf and save it to the s3 bucket and notify the student
          //   if (formNumbers.includes(form.cuRegistrationApplicationNumber)) {
          await tmptriggerNotif(form, foundStudent.uid!);
          console.log("notified student", form.cuRegistrationApplicationNumber);
          //   }
        } else if (response.status === 200) {
          okCount += 1;
        } else {
          console.log("other status", response.status);
        }
      } catch (e) {
        errorCount += 1;
        console.warn(
          "error fetching signed url for",
          form.cuRegistrationApplicationNumber,
          e,
        );
        // Treat as missing to be conservative
        missingCount += 1;
        arr.push(form.cuRegistrationApplicationNumber!);
      }
    }
  }

  console.log("total forms count", totalFormsCount);
  console.log("checked (with application number)", processed);
  console.log("ok (200)", okCount);
  console.log("skipped (no application number)", skippedNoApp);
  console.log("not found (404/non-200)", missingCount);
  console.log("errors while checking", errorCount);
  console.log("sanity total (checked + skipped)", processed + skippedNoApp);
  // Print the smallest form number
  console.log("smallest form number: ", arr.sort()[0]);
}
async function getUrlForAdmRegForm(
  studentId: number,
  studentUid: string,
  applicationNumber: string,
) {
  // Get dynamic year and regulation data
  const [promotionData] = await db
    .select({
      academicYear: academicYearModel.year,
      regulationShortName: regulationTypeModel.shortName,
    })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
    .innerJoin(
      academicYearModel,
      eq(sessionModel.academicYearId, academicYearModel.id),
    )
    .innerJoin(
      programCourseModel,
      eq(promotionModel.programCourseId, programCourseModel.id),
    )
    .innerJoin(
      regulationTypeModel,
      eq(programCourseModel.regulationTypeId, regulationTypeModel.id),
    )
    .where(eq(promotionModel.studentId, studentId))
    .limit(1);

  // Extract year from academic year string (e.g., "2025-2026" -> 2025)
  const yearMatch = promotionData.academicYear.match(/^(\d{4})/);
  const year = yearMatch
    ? parseInt(yearMatch[1], 10)
    : new Date().getFullYear();

  // Get PDF path configuration
  const pdfPathConfig = await getCuRegPdfPathDynamic(
    studentId,
    studentUid,
    applicationNumber,
    {
      year,
      course: promotionData.regulationShortName || "CCF",
    },
  );

  // console.info(`[CU-REG PDF] PDF path config:`, pdfPathConfig);

  // Get signed URL for the PDF
  const signedUrl = await getSignedUrlForFile(pdfPathConfig.fullPath, 3600); // 1 hour expiry

  return signedUrl;
}

async function tmptriggerNotif(
  cuRegReqCorrection: CuRegistrationCorrectionRequestInsertTypeT,
  uid: string,
) {
  // CRITICAL: Validate that application number exists before regenerating PDF
  if (!cuRegReqCorrection.cuRegistrationApplicationNumber) {
    console.error(
      "[CU-REG CORRECTION][UPDATE] Cannot regenerate PDF - application number is missing",
    );
    throw new Error("Application number is required for PDF regeneration");
  }

  // CRITICAL: Use EXISTING application number - NEVER generate or update it during regeneration
  const existingApplicationNumber =
    cuRegReqCorrection.cuRegistrationApplicationNumber;

  try {
    console.info(
      "[CU-REG CORRECTION][UPDATE] All declarations completed and data updated, regenerating PDF with latest data (application number unchanged)",
      {
        applicationNumber: existingApplicationNumber,
        note: "Using EXISTING application number - NOT generating new",
      },
    );

    // Import the PDF integration service
    const { CuRegistrationPdfIntegrationService } = await import(
      "@/services/cu-registration-pdf-integration.service.js"
    );

    // Regenerate PDF with latest student data but SAME application number
    // The PDF will contain updated student information but the form number stays the same
    const pdfResult =
      await CuRegistrationPdfIntegrationService.generateCuRegistrationPdfForFinalSubmission(
        cuRegReqCorrection.studentId,
        cuRegReqCorrection.id!,
        existingApplicationNumber, // CRITICAL: Use existing number - never change it
        uid!,
      );

    if (pdfResult.success) {
      console.info(
        "[CU-REG CORRECTION][UPDATE] PDF regenerated successfully with updated data",
        {
          pdfPath: pdfResult.pdfPath,
          s3Url: pdfResult.s3Url,
          applicationNumber: existingApplicationNumber,
          note: "Application number unchanged - PDF contains updated student data",
        },
      );

      // Send email notification with PDF attachment (same as student console)
      // Only send notifications if CU application number is not null
      if (pdfResult.pdfBuffer && existingApplicationNumber) {
        try {
          console.info(
            `[CU-REG CORRECTION][UPDATE] Sending admission registration email notification`,
            {
              studentId: cuRegReqCorrection.studentId,
              applicationNumber: existingApplicationNumber,
              pdfBufferSize: pdfResult.pdfBuffer.length,
              pdfUrl: pdfResult.s3Url,
              note: "Using existing application number for email",
            },
          );

          const notificationResult =
            await sendAdmissionRegistrationNotification(
              cuRegReqCorrection.studentId,
              existingApplicationNumber, // Use existing - never generate
              pdfResult.pdfBuffer,
              pdfResult.s3Url!,
            );

          if (notificationResult.success) {
            console.info(
              `[CU-REG CORRECTION][UPDATE] Email notification sent successfully`,
              { notificationId: notificationResult.notificationId },
            );
          } else {
            console.error(
              `[CU-REG CORRECTION][UPDATE] Failed to send email notification:`,
              notificationResult.error,
            );
          }
        } catch (notificationError) {
          console.error(
            `[CU-REG CORRECTION][UPDATE] Error sending email notification:`,
            notificationError,
          );
          // Don't fail the entire request if notification fails
        }
      } else {
        if (!pdfResult.pdfBuffer) {
          console.warn(
            `[CU-REG CORRECTION][UPDATE] PDF buffer not available for notification`,
          );
        }
        if (!cuRegReqCorrection.cuRegistrationApplicationNumber) {
          console.warn(
            `[CU-REG CORRECTION][UPDATE] CU application number is null - skipping notifications`,
          );
        }
      }
    } else {
      console.error("[CU-REG CORRECTION][UPDATE] PDF regeneration failed", {
        error: pdfResult.error,
        applicationNumber: existingApplicationNumber,
        note: "Application number was not changed during failed regeneration",
      });
    }
  } catch (error) {
    console.error("[CU-REG CORRECTION][UPDATE] Error regenerating PDF:", error);
    // Don't fail the update if PDF regeneration fails
  }
}
