import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to dynamically find all schema files in a directory
const getSchemaFiles = (dir: string, baseDir: string): string[] => {
  const schemaFiles: string[] = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      schemaFiles.push(...getSchemaFiles(fullPath, baseDir)); // Recursively search in subdirectories
    } else if (file.endsWith(".ts")) {
      // Make the path relative to the baseDir
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/"); // Ensure cross-platform compatibility
      schemaFiles.push(`./${relativePath}`); // Add relative path starting from ./src
    }
  });
  return schemaFiles;
};

// Get all schema files from the `src/db` folder
export const schemaPaths = getSchemaFiles(
  path.resolve(__dirname, "..", "features"),
  path.resolve(__dirname, "..", ".."),
);
