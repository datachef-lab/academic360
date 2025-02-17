import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

// Function to dynamically find all schema files in a directory
const getSchemaFiles = (dir: string, baseDir: string): string[] => {
    const schemaFiles: string[] = [];
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            schemaFiles.push(...getSchemaFiles(fullPath, baseDir)); // Recursively search in subdirectories
        } else if (file.endsWith(".model.js") || file.endsWith(".model.js") || file.endsWith("helper.js")) {
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
            schemaFiles.push(`./${relativePath}`);
        }
    });

    return schemaFiles;
};

// Get all schema files from the `src/db` folder
export const schemaPaths = getSchemaFiles(
    path.resolve(directoryName, "..", "features"),
    path.resolve(directoryName, "..", ".."),
);

export default defineConfig({
    out: "./drizzle",
    schema: schemaPaths,
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});
