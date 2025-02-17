import XLSX from "xlsx";
import fs from "fs";

export function readExcelFile<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    // Read the file
    const workbook = XLSX.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Convert the first sheet to JSON
    const sheet = workbook.Sheets[sheetName];
    const data: T[] = XLSX.utils.sheet_to_json(sheet);

    return data;
}
