import { db } from "@/db/index.js";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { studentModel } from "@repo/db/schemas/models/user";
import { userModel } from "@repo/db/schemas/models/user";
import {
  personalDetailsModel,
  addressModel,
} from "@repo/db/schemas/models/user";
import { documentModel } from "@repo/db/schemas/models/academics";
import { eq, and, desc, count, ilike, or } from "drizzle-orm";
import { CuRegistrationCorrectionRequestInsertTypeT } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { cuRegistrationDocumentUploadInsertTypeT } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import {
  CuRegistrationCorrectionRequestDto,
  CuRegistrationDocumentUploadDto,
} from "@repo/db/dtos/admissions/index.js";
import { CuRegistrationNumberService } from "@/services/cu-registration-number.service.js";

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
  // Generate CU Registration Application Number if not provided
  let cuRegistrationApplicationNumber =
    requestData.cuRegistrationApplicationNumber;

  if (!cuRegistrationApplicationNumber) {
    cuRegistrationApplicationNumber =
      await CuRegistrationNumberService.generateNextApplicationNumber();
  } else {
    // Validate the provided number format
    if (
      !CuRegistrationNumberService.isValidFormat(
        cuRegistrationApplicationNumber,
      )
    ) {
      throw new Error(
        "Invalid CU Registration Application Number format. Must be in format 017XXXX",
      );
    }

    // Check if the number is available
    const isAvailable =
      await CuRegistrationNumberService.isApplicationNumberAvailable(
        cuRegistrationApplicationNumber,
      );
    if (!isAvailable) {
      throw new Error("CU Registration Application Number is already in use");
    }
  }

  const requestDataWithNumber = {
    ...requestData,
    cuRegistrationApplicationNumber,
  };

  const [newRequest] = await db
    .insert(cuRegistrationCorrectionRequestModel)
    .values(requestDataWithNumber)
    .returning();

  console.info(
    "[CU-REG CORRECTION][CREATE] Created",
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

    // Handle declaration fields (monotonic: once true, never set to false)
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
    if (
      typeof (updateData as any).cuRegistrationApplicationNumber !== "undefined"
    )
      setData.cuRegistrationApplicationNumber = (
        updateData as any
      ).cuRegistrationApplicationNumber;

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

    // Determine status based on declaration completion and correction flags if status is not explicitly provided
    if (typeof (updateData as any).status === "undefined") {
      const hasCorrectionFlags = Object.values(flags).some(Boolean);
      const isFinalSubmission =
        (updateData as any).onlineRegistrationDone === true;

      // Check if all declarations are completed
      const personalInfoDeclared =
        (updateData as any).personalInfoDeclaration === true;
      const addressInfoDeclared =
        (updateData as any).addressInfoDeclaration === true;
      const subjectsDeclared = (updateData as any).subjectsDeclaration === true;
      const documentsDeclared =
        (updateData as any).documentsDeclaration === true;

      const allDeclarationsCompleted =
        personalInfoDeclared &&
        addressInfoDeclared &&
        subjectsDeclared &&
        documentsDeclared;

      if (allDeclarationsCompleted && isFinalSubmission) {
        // All declarations completed AND final submission done
        if (hasCorrectionFlags) {
          setData.status = "REQUEST_CORRECTION";
        } else {
          setData.status = "APPROVED";
        }
      } else {
        // Any declaration is still false OR final submission not done
        setData.status = "PENDING";
      }

      console.info(
        `[CU-REG CORRECTION][UPDATE] Auto-setting status to: ${setData.status} (allDeclarationsCompleted: ${allDeclarationsCompleted}, isFinalSubmission: ${isFinalSubmission}, hasCorrectionFlags: ${hasCorrectionFlags})`,
      );
    }

    console.info(
      "[CU-REG CORRECTION][UPDATE] Final setData before DB update:",
      setData,
    );

    const [req] = await tx
      .update(cuRegistrationCorrectionRequestModel)
      .set(setData)
      .where(eq(cuRegistrationCorrectionRequestModel.id, id))
      .returning();
    console.info("[CU-REG BACKEND] Correction request updated in DB", {
      id: req?.id,
      status: req?.status,
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
          // Strip formatting (remove dashes) before saving to database
          const cleanApaarId = payload.personalInfo.apaarId.replace(/-/g, "");
          await tx
            .update(studentModel)
            .set({ apaarId: cleanApaarId })
            .where(eq(studentModel.id, student.id));
          console.info("[CU-REG CORRECTION][UPDATE] Updated APAAR ID", {
            original: payload.personalInfo.apaarId,
            cleaned: cleanApaarId,
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
