import { db } from "@/db";
import { documentModel, DocumentT } from "@repo/db/schemas";
import "dotenv/config";
import { ilike } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";

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
  const basePath = `${process.env.DOCUMENTS_PATH}/marksheets/${framework}`;
  const fileItems: { year: number; filePath: string }[] = [];

  // Scan the directory for files
  for (let year = 2017; year <= new Date().getFullYear(); year++) {
    let filePath = `${basePath}/${year}/${stream}/${semester}/${rollNumber}.pdf`;
    console.log(filePath);

    try {
      await fs.access(filePath); // Check if the file exists
      fileItems.push({ year, filePath }); // Store the valid file path
    } catch (error) {
      // File doesn't exist, continue checking
    }
  }

  console.log(fileItems);

  return fileItems; // Return all found file paths
}

export async function getFile(filePath: string): Promise<Buffer | null> {
  try {
    console.log(`Reading file: ${filePath}`);
    const absolutePath = path.resolve(filePath);
    return await fs.readFile(absolutePath);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return null;
  }
}
