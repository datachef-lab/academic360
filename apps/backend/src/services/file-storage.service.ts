import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FileStorageOptions {
  baseDirectory?: string;
  createSubdirectories?: boolean;
  maxFileSize?: number; // in bytes
  allowedExtensions?: string[];
}

export class FileStorageService {
  private baseDirectory: string;
  private createSubdirectories: boolean;
  private maxFileSize: number;
  private allowedExtensions: string[];

  constructor(options: FileStorageOptions = {}) {
    this.baseDirectory =
      options.baseDirectory || path.join(__dirname, "../../uploads");
    this.createSubdirectories = options.createSubdirectories ?? true;
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB default
    this.allowedExtensions = options.allowedExtensions || [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".doc",
      ".docx",
    ];
  }

  public async saveFile(
    fileName: string,
    fileBuffer: Buffer,
    subdirectory?: string,
  ): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      // Validate file size
      if (fileBuffer.length > this.maxFileSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`,
        };
      }

      // Validate file extension
      const fileExtension = path.extname(fileName).toLowerCase();
      if (!this.allowedExtensions.includes(fileExtension)) {
        return {
          success: false,
          error: `File extension ${fileExtension} is not allowed. Allowed extensions: ${this.allowedExtensions.join(", ")}`,
        };
      }

      // Create file path
      const targetDirectory = subdirectory
        ? path.join(this.baseDirectory, subdirectory)
        : this.baseDirectory;

      // Ensure directory exists
      if (this.createSubdirectories) {
        await fs.mkdir(targetDirectory, { recursive: true });
      }

      const filePath = path.join(targetDirectory, fileName);

      // Write file
      await fs.writeFile(filePath, fileBuffer);

      console.info("[FILE STORAGE] File saved successfully", {
        fileName,
        filePath,
        fileSize: fileBuffer.length,
      });

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      console.error("[FILE STORAGE] Error saving file:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while saving file",
      };
    }
  }

  public async getFile(filePath: string): Promise<{
    success: boolean;
    fileBuffer?: Buffer;
    error?: string;
  }> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.baseDirectory, filePath);

      const fileBuffer = await fs.readFile(fullPath);

      return {
        success: true,
        fileBuffer,
      };
    } catch (error) {
      console.error("[FILE STORAGE] Error reading file:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while reading file",
      };
    }
  }

  public async deleteFile(filePath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.baseDirectory, filePath);

      await fs.unlink(fullPath);

      console.info("[FILE STORAGE] File deleted successfully", { filePath });

      return {
        success: true,
      };
    } catch (error) {
      console.error("[FILE STORAGE] Error deleting file:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while deleting file",
      };
    }
  }

  public async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.baseDirectory, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  public async getFileStats(filePath: string): Promise<{
    success: boolean;
    stats?: {
      size: number;
      created: Date;
      modified: Date;
    };
    error?: string;
  }> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.baseDirectory, filePath);
      const stats = await fs.stat(fullPath);

      return {
        success: true,
        stats: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        },
      };
    } catch (error) {
      console.error("[FILE STORAGE] Error getting file stats:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while getting file stats",
      };
    }
  }

  public async listFiles(directory?: string): Promise<{
    success: boolean;
    files?: string[];
    error?: string;
  }> {
    try {
      const targetDirectory = directory
        ? path.join(this.baseDirectory, directory)
        : this.baseDirectory;

      const files = await fs.readdir(targetDirectory);

      return {
        success: true,
        files,
      };
    } catch (error) {
      console.error("[FILE STORAGE] Error listing files:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while listing files",
      };
    }
  }

  public async cleanupOldFiles(
    directory?: string,
    maxAgeDays: number = 30,
  ): Promise<{
    success: boolean;
    deletedCount?: number;
    totalSizeFreed?: number;
    error?: string;
  }> {
    try {
      const targetDirectory = directory
        ? path.join(this.baseDirectory, directory)
        : this.baseDirectory;

      const files = await fs.readdir(targetDirectory);
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      let deletedCount = 0;
      let totalSizeFreed = 0;

      for (const file of files) {
        const filePath = path.join(targetDirectory, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          totalSizeFreed += stats.size;
          console.info("[FILE STORAGE] Deleted old file", {
            file,
            size: stats.size,
          });
        }
      }

      return {
        success: true,
        deletedCount,
        totalSizeFreed,
      };
    } catch (error) {
      console.error("[FILE STORAGE] Error during cleanup:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred during cleanup",
      };
    }
  }
}

// Export singleton instance for CU registration PDFs
export const cuRegistrationFileStorage = new FileStorageService({
  baseDirectory: "./uploads/cu-registration-pdfs",
  createSubdirectories: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB for PDFs
  allowedExtensions: [".pdf"],
});
