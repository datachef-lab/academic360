import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";

interface ScanExistingMarksheetFilesByRollNumbrProps {
    framework: "CCF" | "CBSE";
    stream: string;
    rollNumber: string;
    semester: number;
}

export async function scanExistingMarksheetFilesByRollNumber({
    framework,
    stream,
    rollNumber,
    semester,
}: ScanExistingMarksheetFilesByRollNumbrProps): Promise<{ year: number; filePath: string }[]> {
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

    console.log(fileItems)

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
