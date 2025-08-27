import { promises as fs } from "fs";
import path from "path";

const DOCS_PATH = process.env.DOCS_PATH!;

type Stream = "BCOM" | "BA" | "BSC" | "MCOM" | "MA" | "BBA";
type Framework = "CBCS" | "CCF";

export type ScanDoc = {
    filePath: string;
    semester: number | null;
    year?: number;
    type: string;
    framework?: Framework;
};

export async function scanDocs(
    rollNumber: string,
    stream: Stream,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _registrationNumber: string = "", // Make registrationNumber optional with default empty string
    framework?: string
) {
    const docsArr: ScanDoc[] = [];
    let frameworks: Framework[] = ["CBCS", "CCF"];

    // If a specific framework is provided, only scan that one
    if (framework && (framework === "CBCS" || framework === "CCF")) {
        frameworks = [framework];
    }

    // Scan both curriculum frameworks
    for (const fw of frameworks) {
        try {
            // Check if the framework directory exists
            const frameworkPath = path.join(DOCS_PATH, fw);
            if (!await dirExists(frameworkPath)) continue;

            // Check if the stream directory exists
            const streamPath = path.join(frameworkPath, stream);
            if (!await dirExists(streamPath)) continue;

            // Get list of all years
            const yearDirs = await fs.readdir(streamPath);

            for (const yearDir of yearDirs) {
                // Skip non-directory items like .DS_Store
                const yearPath = path.join(streamPath, yearDir);
                if (!await dirExists(yearPath)) continue;

                const year = parseInt(yearDir);
                if (isNaN(year)) continue; // Skip if not a valid year

                // Scan for document types
                const docTypes = await fs.readdir(yearPath);

                for (const docType of docTypes) {
                    // Skip non-directory items
                    const docTypePath = path.join(yearPath, docType);
                    if (!await dirExists(docTypePath)) continue;

                    if (docType.toUpperCase() === "MARKSHEETS") {
                        // Marksheets have semester subfolders
                        const semesterDirs = await fs.readdir(docTypePath);

                        for (const semDir of semesterDirs) {
                            const semPath = path.join(docTypePath, semDir);
                            if (!await dirExists(semPath)) continue;

                            const semester = parseInt(semDir);
                            if (isNaN(semester)) continue;

                            // Check for student file
                            const filePath = path.join(semPath, `${rollNumber}.pdf`);
                            if (await fileExists(filePath)) {
                                docsArr.push({
                                    filePath,
                                    semester,
                                    year,
                                    type: "MARKSHEET",
                                    framework: fw
                                });
                            }
                        }
                    } else {
                        // Other document types don't have semester folders
                        const filePath = path.join(docTypePath, `${rollNumber}.pdf`);
                        if (await fileExists(filePath)) {
                            docsArr.push({
                                filePath,
                                semester: null,
                                year,
                                type: docType.replace('-', ' '),
                                framework: fw
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning ${fw}/${stream}:`, error);
        }
    }

    return docsArr;
}

// Utility function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Utility function to check if a directory exists
async function dirExists(dirPath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

export async function getFile(filePath: string) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        return fileBuffer;
    } catch (error) {
        console.log(error);
        // throw new Error("File not found or unreadable.");
        return null;
    }
}