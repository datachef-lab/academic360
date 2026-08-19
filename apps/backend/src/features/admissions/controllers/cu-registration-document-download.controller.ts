import { Request, Response, NextFunction } from "express";
import { ZipArchive } from "archiver";
import { ApiError, handleError } from "@/utils/index.js";
import {
  streamCuRegistrationDocumentsZip,
  type CuRegistrationZipContentType,
} from "../services/cu-registration-document-upload.service.js";
import { socketService } from "@/services/socketService.js";

/**
 * Streams a single CU registration document archive (PDFs or documents) to
 * `res` as it's built, instead of buffering the whole ZIP (via JSZip) in
 * memory first. Shared by all three download routes below — they only
 * differ in `contentType`, the 404 message, and the response filename.
 */
async function streamCuRegistrationZipResponse(
  req: Request,
  res: Response,
  next: NextFunction,
  contentType: CuRegistrationZipContentType,
  filenameFor: (year: string, regulationType: string) => string,
  notFoundMessage: string,
): Promise<void> {
  try {
    const { year, regulationType } = req.params;

    if (!year || !regulationType) {
      res
        .status(400)
        .json(new ApiError(400, "Year and regulation type are required"));
      return;
    }

    const yearNum = parseInt(year as string);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 3000) {
      res.status(400).json(new ApiError(400, "Invalid year format"));
      return;
    }

    console.info(
      `[CU-REG-DOWNLOAD] Starting ${contentType} download for year ${yearNum}, regulation ${regulationType}`,
    );

    const io = socketService.getIO();
    const uploadSessionId =
      (req.body?.uploadSessionId as string | undefined) ||
      (req.query.uploadSessionId as string | undefined) ||
      `download-${Date.now()}`;
    const userId = (req as any).user?.id?.toString();

    const archive = new ZipArchive({ zlib: { level: 6 } });
    let headersSent = false;
    let notFound = false;

    archive.on("warning", (err: Error) => {
      console.warn("[CU-REG-DOWNLOAD] archive warning:", err);
    });
    archive.on("error", (err: Error) => {
      console.error("[CU-REG-DOWNLOAD] archive error:", err);
      if (!headersSent) {
        handleError(err, res, next);
      } else {
        res.destroy(err);
      }
    });

    const result = await streamCuRegistrationDocumentsZip(
      yearNum,
      regulationType as string,
      contentType,
      {
        io,
        userId,
        uploadSessionId,
        onListed: ({ fileCount }) => {
          if (fileCount === 0) {
            notFound = true;
            return;
          }
          const filename = filenameFor(String(year), String(regulationType));
          res.setHeader("Content-Type", "application/zip");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename.replace(/"/g, "%22")}"`,
          );
          headersSent = true;
          archive.pipe(res);
        },
        append: (entryName, buffer) => {
          archive.append(buffer, { name: entryName });
        },
      },
    );

    if (notFound || result.fileCount === 0) {
      res.status(404).json(new ApiError(404, notFoundMessage));
      return;
    }

    console.info(`[CU-REG-DOWNLOAD] ${contentType} download completed`, {
      fileCount: result.fileCount,
    });

    await archive.finalize();
  } catch (error) {
    console.error(`[CU-REG-DOWNLOAD] Error downloading ${contentType}:`, error);
    handleError(error, res, next);
  }
}

/**
 * Download CU registration documents as a ZIP for a specific year and
 * regulation type.
 *
 * @description
 * The original implementation built two separate ZIPs (PDFs and uploaded
 * documents) with JSZip, sent the PDF ZIP with `res.send()`, and then
 * — unreachably, since the response was already complete — tried to build
 * and send a THIRD "combined" ZIP containing both as sub-files. That second
 * `res.send()` could never reach the client (Express has already ended the
 * response after the first `send()`); the documents ZIP was fetched, built,
 * and thrown away for nothing. The client-side caller
 * (`apps/main-console/src/services/exportService.ts`,
 * `downloadCuRegistrationDocuments`) just reads whatever single ZIP blob
 * comes back — so what was actually being observed here was always the
 * PDFs-only archive. This keeps that exact observed behavior (same file
 * set, same effective content) while removing the dead second
 * build-and-send and streaming the (now single) archive to the client
 * instead of buffering it — the uploaded-documents fetch/zip that was being
 * silently discarded is no longer attempted at all here.
 *
 * @usage
 * GET /api/admissions/cu-registration-documents/download/:year/:regulationType
 */
export const downloadCuRegistrationDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await streamCuRegistrationZipResponse(
    req,
    res,
    next,
    "pdfs",
    (year, regulationType) =>
      `cu-registration-${year}-${regulationType}-pdfs.zip`,
    "No documents found for the specified year and regulation type",
  );
};

/**
 * Download only PDFs as ZIP
 */
export const downloadCuRegistrationPdfsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await streamCuRegistrationZipResponse(
    req,
    res,
    next,
    "pdfs",
    (year, regulationType) =>
      `cu-registration-pdfs-${year}-${regulationType}.zip`,
    "No PDFs found for the specified year and regulation type",
  );
};

/**
 * Download only uploaded documents as ZIP
 */
export const downloadDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await streamCuRegistrationZipResponse(
    req,
    res,
    next,
    "documents",
    (year, regulationType) =>
      `cu-registration-documents-${year}-${regulationType}.zip`,
    "No documents found for the specified year and regulation type",
  );
};
