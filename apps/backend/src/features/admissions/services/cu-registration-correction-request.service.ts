import { db } from "@/db/index.js";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { studentModel } from "@repo/db/schemas/models/user";
import { userModel } from "@repo/db/schemas/models/user";
import {
  personalDetailsModel,
  addressModel,
} from "@repo/db/schemas/models/user";
import {
  documentModel,
  sessionModel,
  academicYearModel,
} from "@repo/db/schemas/models/academics";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model";
import { eq, and, desc, count, ilike, or, inArray } from "drizzle-orm";
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
  specializationModel,
} from "@repo/db/schemas/models/course-design";
import ExcelJS from "exceljs";

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

  // Don't generate application number initially - it will be generated only on final submission
  // when all declarations are completed
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

// UPDATE
export async function updateCuRegistrationCorrectionRequest(
  id: number,
  updateData: Partial<CuRegistrationCorrectionRequestInsertTypeT>,
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

  // Begin transactional update to keep data in sync
  const [updatedRequest] = await db.transaction(async (tx) => {
    // Note: derive flags first so we can log them safely
    const flags: any = (updateData as any)?.flags || {};
    console.info("[CU-REG BACKEND] Updating correction request", {
      id,
      flags,
      updateKeys: Object.keys(updateData as any),
    });
    // 1) Update the correction request record itself
    const setData: any = {
      updatedAt: new Date(),
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
    // Protect against updating application number if it already exists
    if (
      typeof (updateData as any).cuRegistrationApplicationNumber !== "undefined"
    ) {
      if (existing.cuRegistrationApplicationNumber) {
        console.warn(
          "[CU-REG CORRECTION][UPDATE] Attempted to update existing application number - ignoring",
          {
            existing: existing.cuRegistrationApplicationNumber,
            attempted: (updateData as any).cuRegistrationApplicationNumber,
          },
        );
        // Don't update the application number if it already exists
      } else {
        setData.cuRegistrationApplicationNumber = (
          updateData as any
        ).cuRegistrationApplicationNumber;
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

    // Check PDF generation conditions regardless of status setting
    const hasCorrectionFlags = Object.values(flags).some(Boolean);
    const isFinalSubmission =
      (updateData as any).onlineRegistrationDone === true;

    // Check if all declarations are completed
    const personalInfoDeclared =
      (updateData as any).personalInfoDeclaration === true;
    const addressInfoDeclared =
      (updateData as any).addressInfoDeclaration === true;
    const subjectsDeclared = (updateData as any).subjectsDeclaration === true;
    const documentsDeclared = (updateData as any).documentsDeclaration === true;

    const allDeclarationsCompleted =
      personalInfoDeclared &&
      addressInfoDeclared &&
      subjectsDeclared &&
      documentsDeclared;

    // Debug logging for PDF generation conditions
    console.info(
      "[CU-REG CORRECTION][UPDATE] PDF Generation Conditions Check:",
      {
        personalInfoDeclared,
        addressInfoDeclared,
        subjectsDeclared,
        documentsDeclared,
        allDeclarationsCompleted,
        isFinalSubmission,
        hasApplicationNumber: !!existing.cuRegistrationApplicationNumber,
        willGeneratePdf:
          allDeclarationsCompleted &&
          isFinalSubmission &&
          !existing.cuRegistrationApplicationNumber,
      },
    );

    // Generate PDF and application number if conditions are met
    if (
      allDeclarationsCompleted &&
      isFinalSubmission &&
      !existing.cuRegistrationApplicationNumber
    ) {
      // All declarations completed AND final submission done AND no application number yet
      const applicationNumber =
        await CuRegistrationNumberService.generateNextApplicationNumber();
      setData.cuRegistrationApplicationNumber = applicationNumber;
      console.info(
        "[CU-REG CORRECTION][UPDATE] Generated application number on final submission:",
        applicationNumber,
      );

      // Generate PDF after application number is assigned
      try {
        console.info(
          "[CU-REG CORRECTION][UPDATE] Generating PDF for final submission",
          {
            studentId: existing.studentId,
            correctionRequestId: id,
            applicationNumber,
          },
        );

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

        const pdfResult =
          await CuRegistrationPdfIntegrationService.generateCuRegistrationPdfForFinalSubmission(
            existing.studentId,
            id,
            applicationNumber, // Use the new application number directly
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
    console.info("[CU-REG CORRECTION][UPDATE] Processing payload", { payload });
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

        // Student APAAR/ABC update
        if (payload.personalInfo.apaarId) {
          // Format APAAR ID to 3-3-3-3 format before saving to database
          const digits = payload.personalInfo.apaarId.replace(/\D/g, "");
          const formattedApaarId =
            digits.length === 12
              ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1-$2-$3-$4")
              : payload.personalInfo.apaarId;
          await tx
            .update(studentModel)
            .set({ apaarId: formattedApaarId })
            .where(eq(studentModel.id, student.id));
          console.info("[CU-REG CORRECTION][UPDATE] Updated APAAR ID", {
            original: payload.personalInfo.apaarId,
            formatted: formattedApaarId,
          });
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

  if (!updatedRequest) return null;

  // Only regenerate PDF when all declarations are completed AND data was actually updated
  const allDeclarationsCompleted =
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

  if (allDeclarationsCompleted && dataFieldsUpdated) {
    try {
      console.info(
        "[CU-REG CORRECTION][UPDATE] All declarations completed and data updated, regenerating PDF with latest data",
      );

      // Import the PDF integration service
      const { CuRegistrationPdfIntegrationService } = await import(
        "@/services/cu-registration-pdf-integration.service.js"
      );

      // Regenerate PDF with latest data
      const pdfResult =
        await CuRegistrationPdfIntegrationService.generateCuRegistrationPdfForFinalSubmission(
          existing.studentId,
          id,
          updatedRequest.cuRegistrationApplicationNumber || "TEMP-APP-NUM", // Use the updated application number
          student.uid,
        );

      if (pdfResult.success) {
        console.info(
          "[CU-REG CORRECTION][UPDATE] PDF regenerated successfully",
          {
            pdfPath: pdfResult.pdfPath,
            s3Url: pdfResult.s3Url,
            applicationNumber: updatedRequest.cuRegistrationApplicationNumber,
          },
        );
      } else {
        console.error("[CU-REG CORRECTION][UPDATE] PDF regeneration failed", {
          error: pdfResult.error,
          applicationNumber: updatedRequest.cuRegistrationApplicationNumber,
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
    if (!allDeclarationsCompleted) {
      console.info(
        "[CU-REG CORRECTION][UPDATE] Not all declarations completed, skipping PDF regeneration",
        {
          personalInfoDeclaration: updatedRequest.personalInfoDeclaration,
          addressInfoDeclaration: updatedRequest.addressInfoDeclaration,
          subjectsDeclaration: updatedRequest.subjectsDeclaration,
          documentsDeclaration: updatedRequest.documentsDeclaration,
        },
      );
    } else if (!dataFieldsUpdated) {
      console.info(
        "[CU-REG CORRECTION][UPDATE] Only status changed, no data updates, skipping PDF regeneration",
      );
    }
  }

  console.info(
    "[CU-REG CORRECTION][UPDATE] Completed",
    JSON.stringify({ id: updatedRequest.id }),
  );
  return await modelToDto(updatedRequest);
}

// UPDATE - Approve request
export async function approveCuRegistrationCorrectionRequest(
  id: number,
  approvedBy: number,
  approvedRemarks?: string,
): Promise<CuRegistrationCorrectionRequestDto | null> {
  const [updatedRequest] = await db
    .update(cuRegistrationCorrectionRequestModel)
    .set({
      status: "APPROVED",
      approvedBy,
      approvedAt: new Date(),
      approvedRemarks,
      updatedAt: new Date(),
    })
    .where(eq(cuRegistrationCorrectionRequestModel.id, id))
    .returning();

  if (!updatedRequest) return null;

  return await modelToDto(updatedRequest);
}

// UPDATE - Reject request
export async function rejectCuRegistrationCorrectionRequest(
  id: number,
  rejectedBy: number,
  rejectedRemarks?: string,
): Promise<CuRegistrationCorrectionRequestDto | null> {
  const [updatedRequest] = await db
    .update(cuRegistrationCorrectionRequestModel)
    .set({
      status: "REJECTED",
      rejectedBy,
      rejectedAt: new Date(),
      rejectedRemarks,
      updatedAt: new Date(),
    })
    .where(eq(cuRegistrationCorrectionRequestModel.id, id))
    .returning();

  if (!updatedRequest) return null;

  return await modelToDto(updatedRequest);
}

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

    // Note: APAAR ID is not updated by students
    // Students can only request corrections via flags, but cannot provide new values
    // These corrections need to be handled by admin separately
    if (correctionFlags.apaarId) {
      console.info(
        "[CU-REG DB UPDATE] APAAR ID correction requested but not updated - requires admin approval",
      );
      updatedFields.push("apaarIdCorrectionRequested");
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

// Helper function to convert model to DTO
async function modelToDto(
  request: any,
): Promise<CuRegistrationCorrectionRequestDto> {
  // Get student details with user info
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
    .where(eq(studentModel.id, request.studentId));

  // Get approver details
  let approvedBy = null;
  if (request.approvedBy) {
    const [approver] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, request.approvedBy));
    approvedBy = approver;
  }

  // Get rejector details
  let rejectedBy = null;
  if (request.rejectedBy) {
    const [rejector] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, request.rejectedBy));
    rejectedBy = rejector;
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
    genderCorrectionRequest: request.genderCorrectionRequest,
    nationalityCorrectionRequest: request.nationalityCorrectionRequest,
    aadhaarCardNumberCorrectionRequest:
      request.aadhaarCardNumberCorrectionRequest,
    apaarIdCorrectionRequest: request.apaarIdCorrectionRequest,
    subjectsCorrectionRequest: request.subjectsCorrectionRequest,
    approvedAt: request.approvedAt,
    approvedRemarks: request.approvedRemarks,
    rejectedAt: request.rejectedAt,
    rejectedRemarks: request.rejectedRemarks,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    student: studentData!,
    approvedBy,
    rejectedBy,
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
      };
    } else {
      // Development/Staging: send to other users only
      notificationData = {
        userId: data.studentId, // Still need a userId for the notification record
        variant: "EMAIL" as const,
        type: "ADMISSION" as const,
        message: `Admission registration form submitted for testing. Application Number: ${data.applicationNumber}`,
        notificationMasterId: emailMaster.id,
        otherUsersEmails:
          otherUsersEmails.length > 0 ? otherUsersEmails : undefined,
        otherUsersWhatsAppNumbers:
          otherUsersWhatsAppNumbers.length > 0
            ? otherUsersWhatsAppNumbers
            : undefined,
        // Store PDF S3 URL for email worker to download
        emailAttachments: data.pdfUrl ? [{ pdfS3Url: data.pdfUrl }] : undefined,
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
 * Send admission registration notification with PDF attachment
 * This function should be called after successful PDF generation
 */
export const sendAdmissionRegistrationNotification = async (
  studentId: number,
  applicationNumber: string,
  pdfBuffer: Buffer, // PDF buffer directly from memory
  pdfUrl: string, // S3 URL for reference
): Promise<AdmissionRegistrationNotificationResult> => {
  try {
    console.log(
      "📧 [CU-REG-NOTIF] Starting admission registration notification process",
    );

    // Get student details with user info (studentId -> student -> user)
    const [studentData] = await db
      .select({
        studentId: studentModel.id,
        studentUid: studentModel.uid,
        userId: studentModel.userId,
        userName: userModel.name,
        userEmail: userModel.email,
      })
      .from(studentModel)
      .innerJoin(userModel, eq(studentModel.userId, userModel.id))
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
    };

    // Send the notification
    const result =
      await sendAdmissionRegistrationEmailNotification(notificationData);

    if (result.success) {
      console.log(
        "✅ [CU-REG-NOTIF] Admission registration notification sent successfully",
      );
    } else {
      console.error(
        "❌ [CU-REG-NOTIF] Failed to send admission registration notification:",
        result.error,
      );
    }

    return result;
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
  cuRegistrationApplicationNumber: string;
  status: string;
  onlineRegistrationDone: boolean;
  physicalRegistrationDone: boolean;
  remarks: string;
  approvedRemarks: string;
  rejectedRemarks: string;
  createdAt: string;
  updatedAt: string;

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

  // Mailing Address (from UI)
  mailingAddressLine: string;
  mailingCountry: string;
  mailingState: string;
  mailingDistrict: string;
  mailingCity: string;
  mailingPinCode: string;
  mailingPoliceStation: string;
  mailingPostOffice: string;

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
export const exportCuRegistrationCorrectionRequests =
  async (): Promise<Buffer> => {
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
          approvedRemarks: cuRegistrationCorrectionRequestModel.approvedRemarks,
          rejectedRemarks: cuRegistrationCorrectionRequestModel.rejectedRemarks,
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
          approvedBy: cuRegistrationCorrectionRequestModel.approvedBy,
          rejectedBy: cuRegistrationCorrectionRequestModel.rejectedBy,

          // Student data
          studentUserId: studentModel.userId,
          studentBelongsToEWS: studentModel.belongsToEWS,
          studentApaarId: studentModel.apaarId,

          // User data
          userName: userModel.name,

          // Personal details
          personalDetailsId: personalDetailsModel.id,
          gender: personalDetailsModel.gender,
          nationalityId: personalDetailsModel.nationalityId,
          aadhaarCardNumber: personalDetailsModel.aadhaarCardNumber,

          // Nationality name
          nationalityName: nationalityModel.name,

          // Address data (residential)
          residentialAddressLine: addressModel.addressLine,
          residentialCountryId: addressModel.countryId,
          residentialStateId: addressModel.stateId,
          residentialDistrictId: addressModel.districtId,
          residentialCityId: addressModel.cityId,
          residentialPinCode: addressModel.pincode,
          residentialPoliceStation: addressModel.otherPoliceStation,
          residentialPostOffice: addressModel.otherPostoffice,

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
          addressModel,
          and(
            eq(addressModel.personalDetailsId, personalDetailsModel.id),
            eq(addressModel.type, "RESIDENTIAL"),
          ),
        )
        .leftJoin(countryModel, eq(addressModel.countryId, countryModel.id))
        .leftJoin(stateModel, eq(addressModel.stateId, stateModel.id))
        .leftJoin(districtModel, eq(addressModel.districtId, districtModel.id))
        .leftJoin(cityModel, eq(addressModel.cityId, cityModel.id));

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

      // Get user names for approved/rejected by
      const userIds = [
        ...new Set([
          ...correctionRequests
            .map((r) => r.approvedBy)
            .filter((id): id is number => id !== null),
          ...correctionRequests
            .map((r) => r.rejectedBy)
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
          return digits.replace(
            /^(\d{3})(\d{3})(\d{3})(\d{3})$/,
            "$1-$2-$3-$4",
          );
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

      // Process data
      const exportData: CuRegistrationExportData[] = correctionRequests.map(
        (request) => {
          const mailingAddress = mailingAddressMap.get(
            request.personalDetailsId,
          );
          const documents = documentMap.get(request.id) || {};

          return {
            // Basic Info
            studentId: request.studentId,
            studentName: request.userName || "",
            cuRegistrationApplicationNumber:
              request.cuRegistrationApplicationNumber || "",
            status: request.status || "",
            onlineRegistrationDone: request.onlineRegistrationDone || false,
            physicalRegistrationDone: request.physicalRegistrationDone || false,
            remarks: request.remarks || "",
            approvedRemarks: request.approvedRemarks || "",
            rejectedRemarks: request.rejectedRemarks || "",
            createdAt: request.createdAt?.toISOString() || "",
            updatedAt: request.updatedAt?.toISOString() || "",

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

            // Mailing Address
            mailingAddressLine: mailingAddress?.addressLine || "",
            mailingCountry: mailingAddress?.countryName || "",
            mailingState: mailingAddress?.stateName || "",
            mailingDistrict: mailingAddress?.districtName || "",
            mailingCity: mailingAddress?.cityName || "",
            mailingPinCode: mailingAddress?.pincode || "",
            mailingPoliceStation: mailingAddress?.otherPoliceStation || "",
            mailingPostOffice: mailingAddress?.otherPostoffice || "",

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
            subjectsCorrectionRequest:
              request.subjectsCorrectionRequest || false,

            // Declarations
            personalInfoDeclaration: request.personalInfoDeclaration || false,
            addressInfoDeclaration: request.addressInfoDeclaration || false,
            subjectsDeclaration: request.subjectsDeclaration || false,
            documentsDeclaration: request.documentsDeclaration || false,

            // User info
            createdByUserName: request.approvedBy
              ? userMap.get(request.approvedBy) || ""
              : "",
            updatedByUserName: request.rejectedBy
              ? userMap.get(request.rejectedBy) || ""
              : "",
          };
        },
      );

      console.log(
        `🔍 [CU-REG-EXPORT] Processed ${exportData.length} records for export`,
      );

      // Create Excel workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("CU Registration Corrections");

      // Get column headers from the first record
      const headers = Object.keys(exportData[0] || {});

      // Add header row with styling
      worksheet.columns = headers.map((header) => ({
        header: header,
        key: header,
        width: 20,
      }));

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Find column indices for fields that need highlighting
      const genderColIndex = headers.indexOf("gender") + 1; // ExcelJS uses 1-based indexing
      const nationalityColIndex = headers.indexOf("nationality") + 1;
      const aadhaarColIndex = headers.indexOf("aadhaarNumber") + 1;
      const apaarColIndex = headers.indexOf("apaarId") + 1;

      let highlightedCount = 0;

      // Add data rows
      exportData.forEach((rowData, index) => {
        const row = worksheet.addRow(rowData);

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

      console.log(
        `🔍 [CU-REG-EXPORT] Total cells highlighted: ${highlightedCount}`,
      );

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
