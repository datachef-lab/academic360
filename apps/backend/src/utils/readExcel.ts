// import XLSX from "xlsx";
// import fs from "fs";

// export function readExcelFile<T>(filePath: string): T[] {
//     console.log(filePath);
//     if (!fs.existsSync(filePath)) {
//         throw new Error(`File not found: ${filePath}`);
//     }

//     // Read the file
//     const workbook = XLSX.readFile(filePath);

//     // Get the first sheet name
//     const sheetName = workbook.SheetNames[0];

//     // Convert the first sheet to JSON
//     const sheet = workbook.Sheets[sheetName];
//     const data: T[] = XLSX.utils.sheet_to_json(sheet);

//     return data;
// }

import XLSX from "xlsx";
import fs from "fs/promises";

export async function readExcelFile<T>(filePath: string): Promise<T[]> {
  console.log(`Attempting to read file: ${filePath}`);

  // Check if file exists and is readable
  try {
    await fs.access(filePath, fs.constants.R_OK);
    console.log(`File is accessible: ${filePath}`);
  } catch (error) {
    console.error(`File access error: ${(error as Error).message}`);
    throw new Error(
      `Cannot access file ${filePath}: ${(error as Error).message}`,
    );
  }

  try {
    const workbook: XLSX.WorkBook = XLSX.readFile(filePath);
    const sheetName: string = workbook.SheetNames[0];
    const sheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
    const data: T[] = XLSX.utils.sheet_to_json<T>(sheet);
    return data;
  } catch (error) {
    console.error(`Error reading Excel file: ${(error as Error).message}`);
    throw new Error(
      `Failed to read Excel file ${filePath}: ${(error as Error).message}`,
    );
  }
}

// New function to read Excel from buffer (for memory storage)
export function readExcelFromBuffer<T>(buffer: Buffer): T[] {
  try {
    const workbook: XLSX.WorkBook = XLSX.read(buffer, { type: "buffer" });
    const sheetName: string = workbook.SheetNames[0];
    const sheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
    const data: T[] = XLSX.utils.sheet_to_json<T>(sheet);
    return data;
  } catch (error) {
    console.error(
      `Error reading Excel from buffer: ${(error as Error).message}`,
    );
    throw new Error(
      `Failed to read Excel from buffer: ${(error as Error).message}`,
    );
  }
}
