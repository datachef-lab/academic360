/**
 * Post-import verification — exercises the exact paths the UI uses.
 *
 *   - Lists templates via listTemplatesPaginated (resolves presigned URL).
 *   - Reads the imported template via getTemplateById (returns fields[]).
 *   - Simulates an Issue submission carrying a new RFID, confirms
 *     students.rfid_number was updated, then rolls back.
 *
 * Run: pnpm --filter backend exec tsx scripts/verify-snapcard-import.ts
 */

import "dotenv/config";
import { desc, eq } from "drizzle-orm";

import { db } from "../src/db/index.js";
import {
  idCardIssueModel,
  idCardTemplateModel,
  studentModel,
} from "@repo/db/schemas/index.js";
import {
  getTemplateById,
  listTemplatesPaginated,
} from "../src/features/idcard/services/id-card-template.service.js";
import { createIssue } from "../src/features/idcard/services/id-card-issue.service.js";

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
  console.log("[ snapcard import verification ]");

  // 1. Template listing returns at least one row with a presigned URL.
  const [tpl] = await db
    .select()
    .from(idCardTemplateModel)
    .orderBy(desc(idCardTemplateModel.id))
    .limit(1);
  check("imported template exists in DB", !!tpl);
  if (!tpl) process.exit(1);

  const list = await listTemplatesPaginated({
    page: 1,
    limit: 20,
    academicYearId: tpl.academicYearId,
    includeDisabled: true,
  });
  check(
    "listTemplatesPaginated returns the imported template",
    list.rows.some((r) => r.id === tpl.id),
  );
  const listed = list.rows.find((r) => r.id === tpl.id);
  check(
    "list row carries a presigned templateImageUrl",
    typeof listed?.templateImageUrl === "string" &&
      (listed!.templateImageUrl as string).startsWith("http"),
    listed?.templateImageUrl?.slice(0, 80),
  );

  // 2. Detail endpoint hydrates fields[].
  const detail = await getTemplateById(tpl.id);
  check("getTemplateById returns 9 fields", detail?.fields?.length === 9);
  const photo = detail?.fields?.find((f) => f.fieldKey === "PHOTO");
  check(
    "PHOTO field has width+height (from snapcard photo_dimensions)",
    !!photo?.width && !!photo?.height,
    `w=${photo?.width} h=${photo?.height}`,
  );
  const qrcode = detail?.fields?.find((f) => f.fieldKey === "QRCODE");
  check(
    "QRCODE coordinate imported",
    typeof qrcode?.x === "number" && typeof qrcode?.y === "number",
    `(${qrcode?.x}, ${qrcode?.y})`,
  );

  // 3. RFID save flow — simulate issue creation that carries a new RFID.
  const [student] = await db
    .select()
    .from(studentModel)
    .orderBy(desc(studentModel.id))
    .limit(1);
  if (!student) {
    console.log("  SKIP RFID flow — no students in DB.");
  } else {
    const originalRfid = student.rfidNumber;
    const fakeRfid = `VERIFY-RFID-${Date.now()}`;
    const issueId = await createIssue(
      {
        studentId: student.id,
        templateId: tpl.id,
        issueStatus: "ISSUED",
        rfidNumber: fakeRfid,
        uidSnapshot: student.uid,
        nameSnapshot: "Verify Tester",
      },
      {},
    );

    const [refreshed] = await db
      .select({ rfidNumber: studentModel.rfidNumber })
      .from(studentModel)
      .where(eq(studentModel.id, student.id));
    check(
      "createIssue updates students.rfid_number to the submitted value",
      refreshed?.rfidNumber === fakeRfid,
      `before=${originalRfid ?? "null"} after=${refreshed?.rfidNumber}`,
    );

    // Cleanup
    await db.delete(idCardIssueModel).where(eq(idCardIssueModel.id, issueId));
    await db
      .update(studentModel)
      .set({ rfidNumber: originalRfid ?? null, updatedAt: new Date() })
      .where(eq(studentModel.id, student.id));
    console.log(
      `  (cleaned up issue id=${issueId}, restored rfid=${originalRfid ?? "null"})`,
    );
  }

  console.log(`\n[ summary ]  pass=${pass}  fail=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
