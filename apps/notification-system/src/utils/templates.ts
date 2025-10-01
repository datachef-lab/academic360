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
  const base = path.join(__dirname, "..", "templates");
  const full = path.join(base, relativePath);
  return ejs.renderFile(full, data);
}
