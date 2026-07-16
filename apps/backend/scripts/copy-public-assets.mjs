import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const distRoot = path.resolve(appRoot, "dist/apps/backend");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function copyFilesByExtension(srcDir, destDir, extension) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(extension)) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(path.join(appRoot, "views"), path.join(distRoot, "views"));
copyDir(path.join(appRoot, "public"), path.join(distRoot, "public"));
copyDir(
  path.join(appRoot, "src/templates"),
  path.join(distRoot, "src/templates"),
);

const seedSrcDir = path.join(
  appRoot,
  "src/features/notifications-console/seed",
);
const seedDestDir = path.join(
  distRoot,
  "src/features/notifications-console/seed",
);
const previewsSrcDir = path.join(seedSrcDir, "previews");
const previewsDestDir = path.join(seedDestDir, "previews");

ensureDir(seedDestDir);
ensureDir(previewsDestDir);
copyFilesByExtension(seedSrcDir, seedDestDir, ".json");
copyFilesByExtension(previewsSrcDir, previewsDestDir, ".png");
