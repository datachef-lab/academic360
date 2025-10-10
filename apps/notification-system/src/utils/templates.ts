/// <reference path="../types/ejs.d.ts" />
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function renderTemplateString(
  template: string,
  data: Record<string, unknown>,
) {
  return ejs.render(template, data);
}

export async function renderTemplateFile(
  relativePath: string,
  data: Record<string, unknown>,
) {
  // In dev, templates live under src/templates; in build, we copy them to dist/views
  const devBase = path.join(__dirname, "..", "templates");
  const prodBase = path.join(__dirname, "..", "..", "views");
  console.log("devBase:", devBase);
  const tryPaths = [
    path.join(devBase, relativePath),
    path.join(prodBase, relativePath),
  ];
  for (const full of tryPaths) {
    try {
      return await ejs.renderFile(full, data);
    } catch (e: any) {
      // Continue to next path on ENOENT; rethrow for other errors
      if (e && e.code !== "ENOENT") throw e;
    }
  }
  // If nothing worked, throw a clear error with attempted paths
  throw new Error(`Template not found. Tried: ${tryPaths.join(", ")}`);
}
