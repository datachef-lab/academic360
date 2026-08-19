import { promises as fs, createReadStream } from "fs";
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
  framework?: string,
) {
  let frameworks: Framework[] = ["CBCS", "CCF"];

  // If a specific framework is provided, only scan that one
  if (framework && (framework === "CBCS" || framework === "CCF")) {
    frameworks = [framework];
  }

  // Scan both curriculum frameworks in parallel. Promise.all preserves the
  // order of `frameworks` in the resulting array regardless of resolution
  // order, so the flattened output keeps the original sequential ordering.
  const frameworkResults = await Promise.all(
    frameworks.map(async (fw): Promise<ScanDoc[]> => {
      try {
        // Check if the framework directory exists
        const frameworkPath = path.join(DOCS_PATH, fw);
        if (!(await dirExists(frameworkPath))) return [];

        // Check if the stream directory exists
        const streamPath = path.join(frameworkPath, stream);
        if (!(await dirExists(streamPath))) return [];

        // Get list of all years
        const yearDirs = await fs.readdir(streamPath);

        const yearResults = await Promise.all(
          yearDirs.map(async (yearDir): Promise<ScanDoc[]> => {
            // Skip non-directory items like .DS_Store
            const yearPath = path.join(streamPath, yearDir);
            if (!(await dirExists(yearPath))) return [];

            const year = parseInt(yearDir);
            if (isNaN(year)) return []; // Skip if not a valid year

            // Scan for document types
            const docTypes = await fs.readdir(yearPath);

            const docTypeResults = await Promise.all(
              docTypes.map(async (docType): Promise<ScanDoc[]> => {
                // Skip non-directory items
                const docTypePath = path.join(yearPath, docType);
                if (!(await dirExists(docTypePath))) return [];

                if (docType.toUpperCase() === "MARKSHEETS") {
                  // Marksheets have semester subfolders
                  const semesterDirs = await fs.readdir(docTypePath);

                  const semesterResults = await Promise.all(
                    semesterDirs.map(async (semDir): Promise<ScanDoc[]> => {
                      const semPath = path.join(docTypePath, semDir);
                      if (!(await dirExists(semPath))) return [];

                      const semester = parseInt(semDir);
                      if (isNaN(semester)) return [];

                      // Check for student file
                      const filePath = path.join(semPath, `${rollNumber}.pdf`);
                      if (await fileExists(filePath)) {
                        return [
                          {
                            filePath,
                            semester,
                            year,
                            type: "MARKSHEET",
                            framework: fw,
                          },
                        ];
                      }
                      return [];
                    }),
                  );
                  return semesterResults.flat();
                } else {
                  // Other document types don't have semester folders
                  const filePath = path.join(docTypePath, `${rollNumber}.pdf`);
                  if (await fileExists(filePath)) {
                    return [
                      {
                        filePath,
                        semester: null,
                        year,
                        type: docType.replace("-", " "),
                        framework: fw,
                      },
                    ];
                  }
                  return [];
                }
              }),
            );
            return docTypeResults.flat();
          }),
        );
        return yearResults.flat();
      } catch (error) {
        console.error(`Error scanning ${fw}/${stream}:`, error);
        return [];
      }
    }),
  );

  return frameworkResults.flat();
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

// Streaming variant of getFile: avoids buffering the whole file in memory
// before sending it to the client. Returns null under the same conditions
// getFile would (missing/unreadable file), so callers can preserve the
// existing 404 behavior.
export async function getFileStream(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return null;
    return { stream: createReadStream(filePath), size: stats.size };
  } catch (error) {
    console.log(error);
    return null;
  }
}
