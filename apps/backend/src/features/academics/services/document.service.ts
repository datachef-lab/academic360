import { db } from "@/db";
import { documentModel, DocumentT } from "@repo/db/schemas";
import "dotenv/config";
import { ilike } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import {
  extractS3KeyFromUrl,
  fileExistsInS3,
  getBufferFromS3,
} from "@/services/s3.service.js";

interface ScanExistingMarksheetFilesByRollNumbrProps {
  framework: "CCF" | "CBSE";
  stream: string;
  rollNumber: string;
  semester: number;
}

const defaultDocuments: DocumentT[] = [
  { name: "Class XII Marksheet", description: "Class XII Marksheet" },
  { name: "Aadhaar Card", description: "Aadhaar Card" },
  { name: "APAAR ID Card", description: "APAAR ID Card" },
  { name: "Father Photo ID", description: "Father Photo ID" },
  { name: "Mother Photo ID", description: "Mother Photo ID" },
  { name: "EWS Certificate", description: "EWS Certificate" },
];

function marksheetS3Key(
  framework: string,
  year: number,
  stream: string,
  semester: number,
  rollNumber: string,
): string {
  return `marksheets/${framework}/${year}/${stream}/${semester}/${rollNumber}.pdf`;
}

function marksheetLocalPath(
  framework: string,
  year: number,
  stream: string,
  semester: number,
  rollNumber: string,
): string | null {
  const documentsPath = process.env.DOCUMENTS_PATH;
  if (!documentsPath) return null;
  return path.join(
    documentsPath,
    "marksheets",
    framework,
    String(year),
    stream,
    String(semester),
    `${rollNumber}.pdf`,
  );
}

export async function loadDefaultDocuments() {
  for (const document of defaultDocuments) {
    const existingDocument = await db
      .select()
      .from(documentModel)
      .where(ilike(documentModel.name, document.name));
    if (existingDocument.length === 0) {
      await db.insert(documentModel).values(document);
    }
  }
}

export async function scanExistingMarksheetFilesByRollNumber({
  framework,
  stream,
  rollNumber,
  semester,
}: ScanExistingMarksheetFilesByRollNumbrProps): Promise<
  { year: number; filePath: string }[]
> {
  const fileItems: { year: number; filePath: string }[] = [];

  for (let year = 2017; year <= new Date().getFullYear(); year++) {
    const s3Key = marksheetS3Key(framework, year, stream, semester, rollNumber);
    const existsInS3 = await fileExistsInS3(s3Key);
    if (existsInS3) {
      fileItems.push({ year, filePath: s3Key });
      continue;
    }

    const localPath = marksheetLocalPath(
      framework,
      year,
      stream,
      semester,
      rollNumber,
    );
    if (!localPath) continue;

    try {
      await fs.access(localPath);
      fileItems.push({ year, filePath: localPath });
    } catch {
      // File doesn't exist locally either.
    }
  }

  return fileItems;
}

export async function getFile(filePath: string): Promise<Buffer | null> {
  try {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      const key = extractS3KeyFromUrl(filePath);
      if (!key) return null;
      return await getBufferFromS3(key);
    }

    if (filePath.startsWith("marksheets/")) {
      return await getBufferFromS3(filePath);
    }

    const absolutePath = path.resolve(filePath);
    return await fs.readFile(absolutePath);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return null;
  }
}
