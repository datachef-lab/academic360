import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

/**
 * TESTING-ONLY local fallback for alumni ID-proof files when S3 is not
 * configured (e.g. local dev with empty AWS_* env). Files land under
 * apps/backend/public/... which app.ts already serves via
 * `app.use("/", express.static(public))`. Keys are prefixed `local:` so the
 * read path can distinguish them from real S3 keys. NOT for production use —
 * production must configure S3 (these files are world-readable under /public).
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(
  __dirname,
  "../../../public/service-requests/id-proofs",
);
const LOCAL_PREFIX = "local:";
const REL_DIR = "service-requests/id-proofs";

/** True when a real S3 bucket + credentials are configured. */
export function s3Configured(): boolean {
  return Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID);
}

export function isLocalKey(key: string): boolean {
  return key.startsWith(LOCAL_PREFIX);
}

/** Persists a multer file to the public dir; returns a `local:<relpath>` key. */
export async function saveIdProofLocally(
  file: Express.Multer.File,
): Promise<{ key: string }> {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const ext = path.extname(file.originalname) || "";
  const name = `idproof-${Date.now()}-${Math.floor(Math.random() * 1e6)}${ext}`;
  const dest = path.join(PUBLIC_DIR, name);

  if (file.buffer) {
    fs.writeFileSync(dest, file.buffer); // memoryStorage
  } else if ((file as { path?: string }).path) {
    fs.copyFileSync((file as { path: string }).path, dest); // diskStorage
  } else {
    throw new Error("No file buffer or path available for ID proof upload");
  }

  return { key: `${LOCAL_PREFIX}${REL_DIR}/${name}` };
}

/** Maps a `local:` key to a servable URL (public dir is mounted at "/"). */
export function localKeyToUrl(key: string): string {
  const base =
    process.env.BACKEND_PUBLIC_BASE ||
    `http://localhost:${process.env.PORT || 8080}`;
  return `${base}/${key.slice(LOCAL_PREFIX.length)}`;
}
