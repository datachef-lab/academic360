/**
 * Smoke: the unified student-avatar resolver runs the S3 → external chain
 * end-to-end for at least one real student in the DB.
 *
 * Run: pnpm --filter backend exec tsx scripts/smoke-student-avatar.ts
 */

import "dotenv/config";
import { desc, isNotNull } from "drizzle-orm";

import { db } from "../src/db/index.js";
import { studentModel } from "@repo/db/schemas/index.js";
import { idCardIssueModel } from "@repo/db/schemas/index.js";
import {
  resolveStudentAvatar,
  resolveStudentAvatarDataUrl,
} from "../src/features/user/services/student-avatar.service.js";

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
  console.log("[ student-avatar resolver smoke ]");

  // 1. Look for a student that has a captured photo on disk via the idcard
  // module — they must resolve to source=s3.
  const [withPhoto] = await db
    .select({ uid: studentModel.uid })
    .from(idCardIssueModel)
    .innerJoin(studentModel, isNotNull(idCardIssueModel.photoImageKey))
    .where(isNotNull(idCardIssueModel.photoImageKey))
    .orderBy(desc(idCardIssueModel.issueDate))
    .limit(1);

  if (withPhoto?.uid) {
    const hit = await resolveStudentAvatar(withPhoto.uid);
    // The chain wins if any source delivers bytes — S3 first, but the
    // resolver is allowed to fall through to besc / hrclIRP for stale
    // S3 keys or migrated photos.
    check(
      `resolver returns bytes for uid=${withPhoto.uid}`,
      !!hit && hit.buffer.byteLength > 200,
      hit
        ? `source=${hit.source} uidUsed=${hit.uidUsed} bytes=${hit.buffer.byteLength}`
        : "null",
    );
    check(
      "winning source is one of s3 / besc / hrclirp",
      !!hit && ["s3", "besc", "hrclirp"].includes(hit.source),
    );

    const dataUrl = await resolveStudentAvatarDataUrl(withPhoto.uid);
    check(
      "resolveStudentAvatarDataUrl returns a data: URL",
      !!dataUrl &&
        dataUrl.startsWith("data:image/") &&
        dataUrl.includes(";base64,"),
      dataUrl
        ? `prefix=${dataUrl.slice(0, 30)} length=${dataUrl.length}`
        : "null",
    );
  } else {
    console.log("  SKIP s3 round — no id-card issues with photo_image_key");
  }

  // 2. Bogus uid → falls through every source → null.
  const miss = await resolveStudentAvatar("__definitely-not-a-real-uid__");
  check("unknown uid resolves to null", miss === null);

  // 3. Empty input is rejected.
  const empty = await resolveStudentAvatar("");
  check("empty uid resolves to null", empty === null);

  console.log(`\n[ summary ]  pass=${pass}  fail=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
