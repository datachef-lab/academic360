import { ApiError } from "@/utils/ApiError.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FileSystemUploadResult {
  url: string;
  key: string; // file path relative to uploads directory
  fileName: string;
}

export async function uploadToFileSystem(
  file: Express.Multer.File,
  applicationNumber: string,
  documentType: string,
): Promise<FileSystemUploadResult> {
  try {
    // Use CU_REGISTRATION_APP_PATH from environment variables
    const cuRegAppPath = process.env.CU_REGISTRATION_APP_PATH;
    if (!cuRegAppPath) {
      throw new ApiError(
        500,
        "CU_REGISTRATION_APP_PATH environment variable is not set",
      );
    }

    // Create the base directory if it doesn't exist
    if (!fs.existsSync(cuRegAppPath)) {
      fs.mkdirSync(cuRegAppPath, { recursive: true });
    }

    // Create application-specific directory using CU registration application number
    const applicationDir = path.join(cuRegAppPath, applicationNumber);
    if (!fs.existsSync(applicationDir)) {
      fs.mkdirSync(applicationDir, { recursive: true });
    }

    // Generate unique filename with document type and timestamp
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const fileName = `${documentType}-${timestamp}${fileExtension}`;
    const filePath = path.join(applicationDir, fileName);

    // Write file to filesystem
    fs.writeFileSync(filePath, file.buffer);

    // Return result similar to S3 format
    const relativePath = path
      .relative(cuRegAppPath, filePath)
      .replace(/\\/g, "/");
    // Always normalize URL as /uploads/<applicationNumber>/<fileName>
    const url = `/uploads/${applicationNumber}/${fileName}`;

    console.info(`[FILESYSTEM UPLOAD] File saved: ${filePath}`);
    console.info(`[FILESYSTEM UPLOAD] URL: ${url}`);

    return {
      url,
      key: relativePath,
      fileName: file.originalname,
    };
  } catch (error) {
    console.error("[FILESYSTEM UPLOAD] Error:", error);
    throw new ApiError(500, `Failed to save file to filesystem: ${error}`);
  }
}

export async function deleteFromFileSystem(key: string): Promise<void> {
  try {
    // Use CU_REGISTRATION_APP_PATH from environment variables
    const cuRegAppPath = process.env.CU_REGISTRATION_APP_PATH;
    if (!cuRegAppPath) {
      throw new ApiError(
        500,
        "CU_REGISTRATION_APP_PATH environment variable is not set",
      );
    }

    const filePath = path.join(cuRegAppPath, key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.info(`[FILESYSTEM DELETE] File deleted: ${filePath}`);
    }
  } catch (error) {
    console.error("[FILESYSTEM DELETE] Error:", error);
    throw new ApiError(500, `Failed to delete file from filesystem: ${error}`);
  }
}
