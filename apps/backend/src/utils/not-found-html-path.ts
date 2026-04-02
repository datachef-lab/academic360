import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Resolved from `dist/utils/` → app `views/404.html` (same layout as `app.ts`). */
export const NOT_FOUND_HTML_PATH = path.join(
  __dirname,
  "..",
  "..",
  "views",
  "404.html",
);
