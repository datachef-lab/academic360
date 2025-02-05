import XLSX from "xlsx";
import fs from "fs";

interface SubjectRow {
    "Stream": string;
    "Course": string;
    "Semester": number;
    "Specialization": string | null;
    "Subject Type": string;
    "Subject Name": string;
    "Credit": number;
    "TH": number | null;
    "TU": number | null;
    "PR": number | null;
    "IN": number | null;
    "Full Marks": number | null;
    "Total Subjects": number | null;
    "Category": string | null;
}

export function readExcelFile(filePath: string): SubjectRow[] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    // Read the file
    const workbook = XLSX.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Convert the first sheet to JSON
    const sheet = workbook.Sheets[sheetName];
    const data: SubjectRow[] = XLSX.utils.sheet_to_json(sheet);

    return data;
}
