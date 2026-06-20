/**
 * One-shot fixup:
 *   - Upload /tmp/snapcard-backside.jpeg to S3 under idcard/backsides/snapcard.jpeg
 *   - Patch every existing id_card_templates row to use that backside.
 *   - Bump canvas size from 600×900 to 638×1004 (snapcard's actual canvas) so
 *     imported coordinates land where they were authored.
 *
 * Run: pnpm --filter backend exec tsx scripts/import-snapcard-backside.ts
 */

import "dotenv/config";
import fs from "node:fs";
import { eq } from "drizzle-orm";

import { db } from "../src/db/index.js";
import { idCardTemplateModel } from "@repo/db/schemas/index.js";
import { uploadToS3 } from "../src/services/s3.service.js";

const BACKSIDE = "/tmp/snapcard-backside.jpeg";
const TARGET_W = 638;
const TARGET_H = 1004;

async function main() {
  if (!fs.existsSync(BACKSIDE)) {
    console.error(`Missing ${BACKSIDE}`);
    process.exit(1);
  }
  const buf = await fs.promises.readFile(BACKSIDE);

  const uploaded = await uploadToS3(
    {
      buffer: buf,
      mimetype: "image/jpeg",
      originalname: "snapcard-backside.jpeg",
      size: buf.byteLength,
      fieldname: "backsideImage",
      encoding: "7bit",
      destination: "",
      filename: "snapcard-backside.jpeg",
      path: "",
      stream: undefined as any,
    } as unknown as Express.Multer.File,
    {
      folder: "idcard/backsides",
      customFileName: "snapcard.jpeg",
      contentType: "image/jpeg",
      maxFileSizeMB: 20,
      allowedMimeTypes: ["image/jpeg", "image/png"],
    },
  );

  console.log(`Uploaded backside → ${uploaded.key}`);

  const rows = await db.select().from(idCardTemplateModel);
  for (const r of rows) {
    await db
      .update(idCardTemplateModel)
      .set({
        backsideImageKey: uploaded.key,
        backsideImageUrl: uploaded.url,
        canvasWidthPx: TARGET_W,
        canvasHeightPx: TARGET_H,
        updatedAt: new Date(),
      })
      .where(eq(idCardTemplateModel.id, r.id));
    console.log(
      `  patched template id=${r.id}: backside set, canvas → ${TARGET_W}×${TARGET_H}`,
    );
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
