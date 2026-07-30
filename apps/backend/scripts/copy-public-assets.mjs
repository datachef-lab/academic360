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

// The email previews (notification masters + declaration masters) render the
// notification-system app's EJS templates. In production the backend is its own
// Docker image built from `turbo prune --scope=backend`, which does NOT include
// apps/notification-system — so a monorepo-relative lookup resolves to nothing
// and every preview degrades to "no preview". Bundle the templates into the
// backend's own dist so resolution never depends on a sibling app's filesystem.
// (In the Docker build the sibling source is absent here; apps/backend/Dockerfile
// copies the same directory into the same dist location from the pruner stage.)
const notificationTemplatesDest = path.join(distRoot, "notification-templates");
for (const candidate of [
  // Docker: staged into the backend app dir before the build.
  path.join(appRoot, "notification-templates"),
  // Monorepo checkout (local, dev, staging).
  path.resolve(appRoot, "../notification-system/src/templates"),
]) {
  if (fs.existsSync(candidate)) {
    copyDir(candidate, notificationTemplatesDest);
    break;
  }
}

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
