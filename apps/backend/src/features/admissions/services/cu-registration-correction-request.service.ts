import { db } from "@/db/index.js";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { studentModel } from "@repo/db/schemas/models/user";
import { userModel } from "@repo/db/schemas/models/user";
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
  const [updatedRequest] = await db
    .update(cuRegistrationCorrectionRequestModel)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(cuRegistrationCorrectionRequestModel.id, id))
    .returning();

  if (!updatedRequest) return null;

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
      abcId: studentModel.abcId,
      apprid: studentModel.apprid,
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
    genderCorrectionRequest: request.genderCorrectionRequest,
    nationalityCorrectionRequest: request.nationalityCorrectionRequest,
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
