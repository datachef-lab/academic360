/**
 * Smoke: GET /api/idcard/templates/:id/image returns the bytes of the S3-stored
 * template JPEG/PNG so the frontend canvas can draw it without CORS taint.
 */

import "dotenv/config";
import { desc } from "drizzle-orm";

import { db } from "../src/db/index.js";
import { idCardTemplateModel } from "@repo/db/schemas/index.js";
import { getBufferFromS3 } from "../src/services/s3.service.js";

let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("[ template image proxy smoke ]");
  const [tpl] = await db
    .select({
      id: idCardTemplateModel.id,
      key: idCardTemplateModel.templateImageKey,
      name: idCardTemplateModel.name,
    })
    .from(idCardTemplateModel)
    .orderBy(desc(idCardTemplateModel.id))
    .limit(1);
  check("found a template", !!tpl);
  if (!tpl) process.exit(1);

  const buf = await getBufferFromS3(tpl.key);
  check("getBufferFromS3 returns a buffer", !!buf && buf.byteLength > 1000);

  // Check magic header to confirm it's a real JPEG or PNG, not an error blob.
  const head = buf!.subarray(0, 4);
  const isJpeg = head[0] === 0xff && head[1] === 0xd8;
  const isPng =
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47;
  check("returned bytes are a real JPEG or PNG", isJpeg || isPng);
  console.log(
    `  (template id=${tpl.id} name=${tpl.name} key=${tpl.key} size=${buf!.byteLength}B)`,
  );

  const [tplWithBack] = await db
    .select({
      id: idCardTemplateModel.id,
      back: idCardTemplateModel.backsideImageKey,
      w: idCardTemplateModel.canvasWidthPx,
      h: idCardTemplateModel.canvasHeightPx,
    })
    .from(idCardTemplateModel)
    .orderBy(desc(idCardTemplateModel.id))
    .limit(1);
  check(
    "canvas is 638x1004 (snapcard's physical card size)",
    tplWithBack?.w === 638 && tplWithBack?.h === 1004,
    `w=${tplWithBack?.w} h=${tplWithBack?.h}`,
  );
  check(
    "backside image key is set",
    !!tplWithBack?.back && tplWithBack.back.length > 5,
    tplWithBack?.back ?? "null",
  );
  if (tplWithBack?.back) {
    const backBuf = await getBufferFromS3(tplWithBack.back);
    const head = backBuf?.subarray(0, 4);
    const isJpeg = !!head && head[0] === 0xff && head[1] === 0xd8;
    check(
      "backside bytes load and look like JPEG",
      !!backBuf && backBuf.byteLength > 1000 && isJpeg,
      `size=${backBuf?.byteLength ?? 0}`,
    );
  }

  console.log(`\n[ summary ]  pass=${pass}  fail=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
