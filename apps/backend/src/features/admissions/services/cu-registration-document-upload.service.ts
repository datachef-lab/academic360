import { db } from "@/db/index.js";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { documentModel } from "@repo/db/schemas/models/academics";
import { eq, and, desc, count } from "drizzle-orm";
import { cuRegistrationDocumentUploadInsertTypeT } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { CuRegistrationDocumentUploadDto } from "@repo/db/dtos/admissions/index.js";

// CREATE
export async function createCuRegistrationDocumentUpload(
  documentData: cuRegistrationDocumentUploadInsertTypeT,
): Promise<CuRegistrationDocumentUploadDto | null> {
  const [newDocument] = await db
    .insert(cuRegistrationDocumentUploadModel)
    .values(documentData)
    .returning();

  return await modelToDto(newDocument);
}

// READ - Get by ID
export async function findCuRegistrationDocumentUploadById(
  id: number,
): Promise<CuRegistrationDocumentUploadDto | null> {
  const [document] = await db
    .select()
    .from(cuRegistrationDocumentUploadModel)
    .where(eq(cuRegistrationDocumentUploadModel.id, id));

  if (!document) return null;

  return await modelToDto(document);
}

// READ - Get all documents for a correction request
export async function findCuRegistrationDocumentUploadsByRequestId(
  requestId: number,
): Promise<CuRegistrationDocumentUploadDto[]> {
  const documents = await db
    .select()
    .from(cuRegistrationDocumentUploadModel)
    .where(
      eq(
        cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
        requestId,
      ),
    )
    .orderBy(desc(cuRegistrationDocumentUploadModel.createdAt));

  const documentDtos = await Promise.all(
    documents.map((doc) => modelToDto(doc)),
  );

  return documentDtos;
}

// READ - Get all with pagination
export async function findAllCuRegistrationDocumentUploads(
  page: number = 1,
  limit: number = 10,
  requestId?: number,
): Promise<{
  documents: CuRegistrationDocumentUploadDto[];
  total: number;
  totalPages: number;
}> {
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (requestId) {
    whereConditions.push(
      eq(
        cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
        requestId,
      ),
    );
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(cuRegistrationDocumentUploadModel)
    .where(whereClause);

  // Get paginated results
  const documents = await db
    .select()
    .from(cuRegistrationDocumentUploadModel)
    .where(whereClause)
    .orderBy(desc(cuRegistrationDocumentUploadModel.createdAt))
    .limit(limit)
    .offset(offset);

  const documentDtos = await Promise.all(
    documents.map((doc) => modelToDto(doc)),
  );

  const totalPages = Math.ceil(total / limit);

  return {
    documents: documentDtos,
    total,
    totalPages,
  };
}

// UPDATE
export async function updateCuRegistrationDocumentUpload(
  id: number,
  updateData: Partial<cuRegistrationDocumentUploadInsertTypeT>,
): Promise<CuRegistrationDocumentUploadDto | null> {
  const [updatedDocument] = await db
    .update(cuRegistrationDocumentUploadModel)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(cuRegistrationDocumentUploadModel.id, id))
    .returning();

  if (!updatedDocument) return null;

  return await modelToDto(updatedDocument);
}

// DELETE
export async function deleteCuRegistrationDocumentUpload(
  id: number,
): Promise<boolean> {
  const result = await db
    .delete(cuRegistrationDocumentUploadModel)
    .where(eq(cuRegistrationDocumentUploadModel.id, id));

  return (result.rowCount ?? 0) > 0;
}

// DELETE - Delete all documents for a correction request
export async function deleteCuRegistrationDocumentUploadsByRequestId(
  requestId: number,
): Promise<boolean> {
  const result = await db
    .delete(cuRegistrationDocumentUploadModel)
    .where(
      eq(
        cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
        requestId,
      ),
    );

  return (result.rowCount ?? 0) > 0;
}

// Helper function to convert model to DTO
async function modelToDto(
  document: any,
): Promise<CuRegistrationDocumentUploadDto> {
  // Get document details
  const [documentDetails] = await db
    .select()
    .from(documentModel)
    .where(eq(documentModel.id, document.documentId));

  return {
    id: document.id,
    documentUrl: document.documentUrl,
    path: document.path,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    remarks: document.remarks,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    document: {
      id: documentDetails!.id,
      name: documentDetails!.name,
      description: documentDetails!.description,
      sequence: documentDetails!.sequence,
      isActive: documentDetails!.isActive,
      createdAt: documentDetails!.createdAt,
      updatedAt: documentDetails!.updatedAt,
    },
    file: null as any, // This will be handled in the controller for file uploads
  };
}
