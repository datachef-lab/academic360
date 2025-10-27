import { db } from "@/db/index.js";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { documentModel } from "@repo/db/schemas/models/academics";
import { eq, and, desc, count } from "drizzle-orm";
import { cuRegistrationDocumentUploadInsertTypeT } from "@repo/db/schemas/models/admissions/cu-registration-document-upload.model.js";
import { CuRegistrationDocumentUploadDto } from "@repo/db/dtos/admissions/index.js";
import {
  listFilesInFolder,
  getSignedUrlForFile,
} from "@/services/s3.service.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { ApiError } from "@/utils/index.js";
import JSZip from "jszip";

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

// Interface for download result
export interface CuRegistrationDownloadResult {
  pdfZipBuffer: Buffer;
  documentsZipBuffer: Buffer;
  pdfCount: number;
  documentsCount: number;
  year: number;
  regulationType: string;
}

// Interface for progress update
export interface DownloadProgressUpdate {
  sessionId: string;
  stage:
    | "listing"
    | "downloading_pdfs"
    | "downloading_documents"
    | "creating_zips"
    | "completed"
    | "error";
  progress: number; // 0-100
  message: string;
  pdfCount?: number;
  documentsCount?: number;
  currentFile?: string;
  error?: string;
}

/**
 * Download and zip all CU registration documents for a specific year and regulation type
 * Returns two ZIP files: one for generated PDFs and one for uploaded documents
 *
 * PDF Structure: {year}/{regulationType}/students/{studentUID}/adm-reg-forms/{applicationNumber}.pdf
 * Documents Structure: {year}/{regulationType}/adm-reg-docs/{subfolder}/{filename}
 *
 * Example:
 * - PDF: 2025/CCF/students/0804250001/adm-reg-forms/0170001.pdf
 * - Document: 2025/CCF/adm-reg-docs/Marksheet/M0170001.jpg
 */
export async function downloadCuRegistrationDocumentsAsZip(
  year: number,
  regulationType: string,
  io?: any,
  uploadSessionId?: string,
  userId?: string,
  downloadType: "combined" | "pdfs" | "documents" = "combined",
): Promise<CuRegistrationDownloadResult> {
  try {
    console.info("[CU-REG-DOWNLOAD] Starting document download", {
      year,
      regulationType,
    });

    // Debug Socket.IO parameters
    console.log("[CU-REG-DOWNLOAD] Socket.IO Debug:", {
      io: !!io,
      ioType: typeof io,
      userId: userId,
      userIdType: typeof userId,
      uploadSessionId: uploadSessionId,
      uploadSessionIdType: typeof uploadSessionId,
    });

    // Emit initial progress
    if (io && userId) {
      console.log(
        "[CU-REG-DOWNLOAD] Emitting initial progress to user:",
        userId,
      );
      io.to(`user:${userId}`).emit("download_progress", {
        id: uploadSessionId || `download-${Date.now()}`,
        userId: userId,
        type: "download_progress",
        message: "Starting document download...",
        progress: 0,
        status: "started",
        createdAt: new Date(),
        sessionId: uploadSessionId,
        stage: "listing",
      });
      console.log("[CU-REG-DOWNLOAD] Initial progress emitted successfully");
    } else {
      console.log(
        "[CU-REG-DOWNLOAD] Skipping initial progress emit - io:",
        !!io,
        "userId:",
        userId,
      );
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucket = process.env.AWS_S3_BUCKET!;
    const rootFolder = process.env.AWS_ROOT_FOLDER || "";

    // Construct base paths
    const basePath = rootFolder
      ? `${rootFolder}/${year}/${regulationType}`
      : `${year}/${regulationType}`;
    const pdfBasePath = `${basePath}/students`;
    const documentsBasePath = `${basePath}/adm-reg-docs`;

    console.info("[CU-REG-DOWNLOAD] Base paths", {
      basePath,
      pdfBasePath,
      documentsBasePath,
      expectedPdfStructure: `${pdfBasePath}/[studentUID]/adm-reg-forms/[applicationNumber].pdf`,
      expectedDocStructure: `${documentsBasePath}/[subfolder]/[filename]`,
    });

    // Create ZIP instances
    const pdfZip = new JSZip();
    const documentsZip = new JSZip();

    let pdfCount = 0;
    let documentsCount = 0;

    // Download PDFs (generated forms) - only if not documents-only
    if (downloadType === "combined" || downloadType === "pdfs") {
      try {
        console.info("[CU-REG-DOWNLOAD] Listing all PDF files recursively...");

        // Emit progress for PDF listing
        if (io && userId) {
          io.to(`user:${userId}`).emit("download_progress", {
            id: uploadSessionId || `download-${Date.now()}`,
            userId: userId,
            type: "download_progress",
            message: "Listing PDF files...",
            progress: 10,
            status: "in_progress",
            createdAt: new Date(),
            sessionId: uploadSessionId,
            stage: "downloading_pdfs",
          });
        }

        // List all files under the students directory recursively
        const allFiles = await listFilesInFolder(pdfBasePath);

        console.info(
          `[CU-REG-DOWNLOAD] Found ${allFiles.length} total files in students folder`,
        );

        // Filter for PDF files in adm-reg-forms folders
        const pdfFiles = allFiles.filter(
          (fileKey) =>
            fileKey.endsWith(".pdf") && fileKey.includes("/adm-reg-forms/"),
        );

        console.info(
          `[CU-REG-DOWNLOAD] Found ${pdfFiles.length} PDF files in adm-reg-forms folders`,
        );

        // Emit progress for PDF count found
        if (io && userId) {
          io.to(`user:${userId}`).emit("download_progress", {
            id: uploadSessionId || `download-${Date.now()}`,
            userId: userId,
            type: "download_progress",
            message: `Found ${pdfFiles.length} PDF files to download`,
            progress: 20,
            status: "in_progress",
            createdAt: new Date(),
            sessionId: uploadSessionId,
            stage: "downloading_pdfs",
            pdfCount: pdfFiles.length, // Total PDFs that will be downloaded
          });
        }

        for (const pdfKey of pdfFiles) {
          try {
            // Emit progress for current file
            if (io && userId) {
              const progress = 20 + (pdfCount / pdfFiles.length) * 30; // 20-50% for PDFs
              io.to(`user:${userId}`).emit("download_progress", {
                id: uploadSessionId || `download-${Date.now()}`,
                userId: userId,
                type: "download_progress",
                message: `Downloading PDF ${pdfCount + 1}/${pdfFiles.length}`,
                progress: Math.round(progress),
                status: "in_progress",
                createdAt: new Date(),
                sessionId: uploadSessionId,
                stage: "downloading_pdfs",
                currentFile: pdfKey.split("/").pop(),
                pdfCount: pdfCount + 1, // Show current count being processed
                pdfTotal: pdfFiles.length, // Show total count that will be downloaded
              });
            }

            // Download file from S3
            const command = new GetObjectCommand({
              Bucket: bucket,
              Key: pdfKey,
            });

            const response = await s3Client.send(command);
            const fileBuffer = await response.Body!.transformToByteArray();

            // Extract filename from path
            // Path format: year/regulation/students/UID/adm-reg-forms/APP_NUM.pdf
            const pathParts = pdfKey.split("/");
            const fileName = pathParts[pathParts.length - 1]; // filename is last part

            // Add to ZIP with flat structure (all PDFs in root)
            pdfZip.file(fileName, fileBuffer);
            pdfCount++;

            console.info(
              `[CU-REG-DOWNLOAD] Added PDF: ${fileName} (from ${pdfKey})`,
            );
          } catch (error) {
            console.error(
              `[CU-REG-DOWNLOAD] Error downloading PDF ${pdfKey}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error("[CU-REG-DOWNLOAD] Error listing PDF files:", error);
      }
    }

    // Download uploaded documents - only if not PDFs-only
    if (downloadType === "combined" || downloadType === "documents") {
      try {
        console.info("[CU-REG-DOWNLOAD] Listing uploaded documents...");

        // Emit progress for document listing
        if (io && userId) {
          io.to(`user:${userId}`).emit("download_progress", {
            id: uploadSessionId || `download-${Date.now()}`,
            userId: userId,
            type: "download_progress",
            message: "Listing uploaded documents...",
            progress: 50,
            status: "in_progress",
            createdAt: new Date(),
            sessionId: uploadSessionId,
            stage: "downloading_documents",
          });
        }

        const documentFiles = await listFilesInFolder(documentsBasePath);

        console.info(
          `[CU-REG-DOWNLOAD] Found ${documentFiles.length} document files`,
        );

        // Emit progress for document count found
        if (io && userId) {
          io.to(`user:${userId}`).emit("download_progress", {
            id: uploadSessionId || `download-${Date.now()}`,
            userId: userId,
            type: "download_progress",
            message: `Found ${documentFiles.length} documents to download`,
            progress: 60,
            status: "in_progress",
            createdAt: new Date(),
            sessionId: uploadSessionId,
            stage: "downloading_documents",
            documentsTotal: documentFiles.length, // Total documents that will be downloaded
          });
        }

        for (const fileKey of documentFiles) {
          try {
            // Emit progress for current file
            if (io && userId) {
              const progress =
                60 + (documentsCount / documentFiles.length) * 20; // 60-80% for documents
              io.to(`user:${userId}`).emit("download_progress", {
                id: uploadSessionId || `download-${Date.now()}`,
                userId: userId,
                type: "download_progress",
                message: `Downloading document ${documentsCount + 1}/${documentFiles.length}`,
                progress: Math.round(progress),
                status: "in_progress",
                createdAt: new Date(),
                sessionId: uploadSessionId,
                stage: "downloading_documents",
                currentFile: fileKey.split("/").pop(),
                documentsCount: documentsCount + 1, // Show current count being processed
                documentsTotal: documentFiles.length, // Show total count that will be downloaded
              });
            }

            // Download file from S3
            const command = new GetObjectCommand({
              Bucket: bucket,
              Key: fileKey,
            });

            const response = await s3Client.send(command);
            const fileBuffer = await response.Body!.transformToByteArray();

            // Extract folder structure from path
            // Path format: year/regulation/adm-reg-docs/SubFolder/Filename
            const pathParts = fileKey.split("/");
            const subFolder = pathParts[pathParts.length - 2]; // subfolder is 2nd from end
            const fileName = pathParts[pathParts.length - 1]; // filename is last part

            // Add to ZIP with organized folder structure
            const zipPath = `${subFolder}/${fileName}`;
            documentsZip.file(zipPath, fileBuffer);
            documentsCount++;

            console.info(`[CU-REG-DOWNLOAD] Added document: ${zipPath}`);
          } catch (error) {
            console.error(
              `[CU-REG-DOWNLOAD] Error downloading document ${fileKey}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error("[CU-REG-DOWNLOAD] Error listing document files:", error);
      }
    }

    // Generate ZIP buffers
    console.info("[CU-REG-DOWNLOAD] Generating ZIP files...");

    // Emit progress for ZIP creation
    if (io && userId) {
      io.to(`user:${userId}`).emit("download_progress", {
        id: uploadSessionId || `download-${Date.now()}`,
        userId: userId,
        type: "download_progress",
        message: "Creating ZIP files...",
        progress: 80,
        status: "in_progress",
        createdAt: new Date(),
        sessionId: uploadSessionId,
        stage: "creating_zips",
        pdfCount,
        documentsCount,
      });
    }

    const pdfZipBuffer = await pdfZip.generateAsync({ type: "nodebuffer" });
    const documentsZipBuffer = await documentsZip.generateAsync({
      type: "nodebuffer",
    });

    console.info("[CU-REG-DOWNLOAD] Download completed", {
      pdfCount,
      documentsCount,
      pdfZipSize: pdfZipBuffer.length,
      documentsZipSize: documentsZipBuffer.length,
    });

    // Emit completion progress
    if (io && userId) {
      io.to(`user:${userId}`).emit("download_progress", {
        id: uploadSessionId || `download-${Date.now()}`,
        userId: userId,
        type: "download_progress",
        message: `Download completed! ${pdfCount} PDFs and ${documentsCount} documents processed`,
        progress: 100,
        status: "completed",
        createdAt: new Date(),
        sessionId: uploadSessionId,
        stage: "completed",
        pdfCount,
        documentsCount,
      });
    }

    return {
      pdfZipBuffer,
      documentsZipBuffer,
      pdfCount,
      documentsCount,
      year,
      regulationType,
    };
  } catch (error) {
    console.error("[CU-REG-DOWNLOAD] Error downloading documents:", error);

    // Emit error progress
    if (io && userId) {
      io.to(`user:${userId}`).emit("download_progress", {
        id: uploadSessionId || `download-${Date.now()}`,
        userId: userId,
        type: "download_progress",
        message: "Download failed",
        progress: 0,
        status: "error",
        error: (error as Error).message,
        createdAt: new Date(),
        sessionId: uploadSessionId,
        stage: "error",
      });
    }

    throw new ApiError(
      500,
      `Failed to download documents: ${(error as Error).message}`,
    );
  }
}
