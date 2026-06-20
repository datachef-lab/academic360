/**
 * idcard module smoke test — exercises the new tables via the Drizzle `db`.
 *
 * Creates a template, fields, an issue; reads everything back; deletes cleanly.
 * Run with: pnpm --filter backend exec tsx scripts/smoke-idcard.ts
 */

import "dotenv/config";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../src/db/index.js";
import {
  academicYearModel,
  idCardIssueModel,
  idCardTemplateFieldModel,
  idCardTemplateModel,
  studentModel,
} from "@repo/db/schemas/index.js";
import {
  buildExcelReport,
  listIssuanceDates,
} from "../src/features/idcard/services/id-card-report.service.js";

let pass = 0;
let fail = 0;
const fails: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    fails.push(name + (detail ? ` — ${detail}` : ""));
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("\n[ idcard smoke ]");

  const [academicYear] = await db
    .select()
    .from(academicYearModel)
    .orderBy(desc(academicYearModel.id))
    .limit(1);
  check("found at least one academic year", !!academicYear);
  if (!academicYear) {
    console.log("Aborting — seed an academic year first.");
    process.exit(1);
  }

  const [student] = await db
    .select()
    .from(studentModel)
    .orderBy(desc(studentModel.id))
    .limit(1);
  check("found at least one student", !!student);
  if (!student) {
    console.log("Aborting — seed a student first.");
    process.exit(1);
  }

  console.log(
    `  using academic_year_id=${academicYear.id} student_id=${student.id} uid=${student.uid}`,
  );

  // --- Template ---
  const tplName = `SMOKE-IDCARD-${Date.now()}`;
  const [createdTpl] = await db
    .insert(idCardTemplateModel)
    .values({
      academicYearId: academicYear.id,
      name: tplName,
      description: "Smoke template",
      templateImageKey: "idcard/templates/smoke.jpg",
      templateImageUrl: "https://example.invalid/smoke.jpg",
      canvasWidthPx: 600,
      canvasHeightPx: 900,
      qrcodeSize: 80,
      validFrom: "2026-01-01",
      validTill: "2026-12-31",
      isDefault: false,
      disabled: false,
    })
    .returning({ id: idCardTemplateModel.id });
  check("insert template", !!createdTpl?.id);
  const templateId = createdTpl.id;

  const [readTpl] = await db
    .select()
    .from(idCardTemplateModel)
    .where(eq(idCardTemplateModel.id, templateId));
  check("read template", readTpl?.name === tplName);
  check(
    "template defaults applied",
    readTpl?.canvasWidthPx === 600 && readTpl?.qrcodeSize === 80,
  );

  // --- Fields ---
  const fieldRows = await db
    .insert(idCardTemplateFieldModel)
    .values([
      { templateId, fieldKey: "NAME", x: 320, y: 580 },
      { templateId, fieldKey: "UID", x: 215, y: 680 },
      {
        templateId,
        fieldKey: "PHOTO",
        x: 200,
        y: 100,
        width: 225,
        height: 250,
      },
      { templateId, fieldKey: "QRCODE", x: 470, y: 800 },
    ])
    .returning();
  check("insert 4 template fields", fieldRows.length === 4);

  // Unique (templateId, fieldKey) must prevent duplicates.
  let dupErr: unknown = null;
  try {
    await db
      .insert(idCardTemplateFieldModel)
      .values({ templateId, fieldKey: "NAME", x: 1, y: 2 });
  } catch (e) {
    dupErr = e;
  }
  check("unique constraint on (templateId, fieldKey)", !!dupErr);

  const allFields = await db
    .select()
    .from(idCardTemplateFieldModel)
    .where(eq(idCardTemplateFieldModel.templateId, templateId));
  check("read all 4 fields", allFields.length === 4);
  const photoField = allFields.find((f) => f.fieldKey === "PHOTO");
  check(
    "PHOTO field has width/height",
    photoField?.width === 225 && photoField?.height === 250,
  );

  // --- Issue ---
  const [createdIssue] = await db
    .insert(idCardIssueModel)
    .values({
      studentId: student.id,
      templateId,
      issueStatus: "ISSUED",
      rfidNumber: "SMOKE-RFID-001",
      validFrom: "2026-01-01",
      validTill: "2026-12-31",
      nameSnapshot: "Smoke Tester",
      courseSnapshot: "B.Sc. Smoke",
      bloodGroupSnapshot: "O+",
      mobileSnapshot: "9999999999",
      sectionSnapshot: "A",
      classRollNumberSnapshot: "42",
      quotaTypeSnapshot: "GENERAL",
      uidSnapshot: student.uid,
      remarks: "smoke run",
    })
    .returning({ id: idCardIssueModel.id });
  check("insert ISSUED row", !!createdIssue?.id);
  const issueId = createdIssue.id;

  // Patch image keys (simulating S3 upload completion).
  await db
    .update(idCardIssueModel)
    .set({
      frontImageKey: `idcard/issues/${issueId}/front.png`,
      photoImageKey: `idcard/issues/${issueId}/photo.png`,
    })
    .where(eq(idCardIssueModel.id, issueId));

  const [readIssue] = await db
    .select()
    .from(idCardIssueModel)
    .where(eq(idCardIssueModel.id, issueId));
  check(
    "issue persisted with image keys",
    readIssue?.frontImageKey?.includes(`${issueId}/front.png`) === true,
  );
  check("rfid snapshot stored", readIssue?.rfidNumber === "SMOKE-RFID-001");
  check(
    "section/class roll/quota snapshots stored",
    readIssue?.sectionSnapshot === "A" &&
      readIssue?.classRollNumberSnapshot === "42" &&
      readIssue?.quotaTypeSnapshot === "GENERAL",
  );
  check(
    "validity stored as date string",
    readIssue?.validFrom === "2026-01-01" &&
      readIssue?.validTill === "2026-12-31",
  );

  // Self-FK: a REISSUED row references the prior issue.
  const [reissue] = await db
    .insert(idCardIssueModel)
    .values({
      studentId: student.id,
      templateId,
      issueStatus: "REISSUED",
      renewedFromIssueId: issueId,
      rfidNumber: "SMOKE-RFID-002",
      uidSnapshot: student.uid,
      nameSnapshot: "Smoke Tester",
    })
    .returning({ id: idCardIssueModel.id });
  check("insert REISSUED row with renewedFromIssueId", !!reissue?.id);

  const studentIssues = await db
    .select()
    .from(idCardIssueModel)
    .where(eq(idCardIssueModel.studentId, student.id))
    .orderBy(desc(idCardIssueModel.issueDate));
  check(
    "student has >= 2 issues now",
    studentIssues.filter((i) => i.id === issueId || i.id === reissue.id)
      .length === 2,
  );

  // --- Reports service ---
  const dates = await listIssuanceDates();
  check("listIssuanceDates returns array", Array.isArray(dates));
  if (dates.length > 0) {
    const buf = await buildExcelReport(dates[0]);
    check(
      "buildExcelReport produces xlsx buffer",
      buf instanceof Buffer && buf.byteLength > 200,
    );
  }

  // --- Cascade delete: template fields go away with the template ---
  await db
    .delete(idCardIssueModel)
    .where(
      and(
        eq(idCardIssueModel.templateId, templateId),
        eq(idCardIssueModel.studentId, student.id),
      ),
    );

  await db
    .delete(idCardTemplateModel)
    .where(eq(idCardTemplateModel.id, templateId));
  const remainingFields = await db
    .select()
    .from(idCardTemplateFieldModel)
    .where(eq(idCardTemplateFieldModel.templateId, templateId));
  check("cascade deleted template fields", remainingFields.length === 0);

  console.log(`\n[ summary ]  pass=${pass}  fail=${fail}`);
  if (fail > 0) {
    fails.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
