import { db } from "@/db";
import { documentTypeModel, DocumentTypeT } from "@repo/db/schemas";
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

// `bgColor`/`textColor` are NOT NULL with no DB default on document_types, so
// every seeded row must carry a pair. These follow the same Tailwind-ish
// palette the certificate masters use (light bg + darker text of the same hue).
const defaultDocuments: DocumentTypeT[] = [
  {
    name: "Class XII Marksheet",
    description: "Class XII Marksheet",
    bgColor: "#DBEAFE",
    textColor: "#1D4ED8",
  },
  {
    name: "Aadhaar Card",
    description: "Aadhaar Card",
    bgColor: "#FEF3C7",
    textColor: "#B45309",
  },
  {
    name: "APAAR ID Card",
    description: "APAAR ID Card",
    bgColor: "#CCFBF1",
    textColor: "#0F766E",
  },
  {
    name: "Father Photo ID",
    description: "Father Photo ID",
    bgColor: "#EDE9FE",
    textColor: "#6D28D9",
  },
  {
    name: "Mother Photo ID",
    description: "Mother Photo ID",
    bgColor: "#FCE7F3",
    textColor: "#BE185D",
  },
  {
    name: "EWS Certificate",
    description: "EWS Certificate",
    bgColor: "#DCFCE7",
    textColor: "#15803D",
  },
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
      .from(documentTypeModel)
      .where(ilike(documentTypeModel.name, document.name));
    if (existingDocument.length === 0) {
      await db.insert(documentTypeModel).values(document);
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
