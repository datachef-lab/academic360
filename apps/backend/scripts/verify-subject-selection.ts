// Verify per-student subject selections migration.
// Runs the user's UNION query (restricted to sessions 16,17 + classes 4,5,6,7)
// against legacy and compares to new student_subject_selections.
// Reports ERRORs for: legacy optional subject missing from new DB.
// Reports WARNs for: extra subjects in new DB not in legacy.
//
// Usage: pnpm tsx scripts/verify-subject-selection.ts [--uid=X]
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { resolveSubjectSelectionScope } from "./_subject-selection-scope.js";

const legacyPool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 60_000,
  connectionLimit: 4,
});

async function queryWithRetry(
  text: string,
  params: any[] = [],
  tries = 3,
): Promise<any> {
  let last: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await legacyPool.query(text, params);
    } catch (e) {
      last = e;
      console.warn(`legacy query attempt ${i + 1} failed: ${(e as any)?.code}`);
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw last;
}
import {
  studentModel,
  subjectModel,
  subjectTypeModel,
  subjectSelectionMetaModel,
  studentSubjectSelectionModel,
} from "@repo/db/schemas/models";

const UID_FILTER = process.argv
  .slice(2)
  .find((a) => a.startsWith("--uid="))
  ?.slice("--uid=".length);

function loadBridgeCsv(): Map<number, number> {
  const path = join(process.cwd(), "excel-data", "subject-bridge.csv");
  const text = readFileSync(path, "utf8");
  const m = new Map<number, number>();
  for (const line of text.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const cols = line.match(/"([^"]*)"/g)?.map((s) => s.slice(1, -1)) ?? [];
    if (cols.length < 5) continue;
    const [legacyId, , , bucket, newId] = cols;
    if (!newId) continue;
    if (bucket === "EXACT" || bucket === "FUZZY-AUTO" || bucket === "ALREADY") {
      m.set(Number(legacyId), Number(newId));
    }
  }
  return m;
}

type MismatchRow = {
  uid: string;
  severity: "ERROR" | "WARN" | "INFO";
  expected_in: string;
  legacy_subject?: string;
  legacy_meta?: string;
  new_subject?: string;
  new_meta?: string;
  note: string;
};

async function main() {
  const subjectBridge = loadBridgeCsv();

  const scope = await resolveSubjectSelectionScope(legacyPool);
  const legacyClassesIn = scope.legacyClassIds.join(",") || "0";
  // legacy session IDs we have bridged in new DB sessions table
  const sess = await db
    .select()
    .from((await import("@repo/db/schemas/models")).sessionModel);
  const legacySessionsIn =
    sess
      .filter((s) => s.legacySessionId != null)
      .map((s) => s.legacySessionId)
      .join(",") || "0";
  console.log(
    `scope: legacy classes [${legacyClassesIn}] sessions [${legacySessionsIn}]`,
  );

  // Build set of new subject-type IDs that have AT LEAST ONE meta. Anything outside
  // this set is "compulsory in new schema" → never appears in student_subject_selections.
  const metasInDb = await db.select().from(subjectSelectionMetaModel);
  const metaSubjectTypeIds = new Set(metasInDb.map((m) => m.subjectTypeId));
  const subjectTypes = await db.select().from(subjectTypeModel);
  const newToLegacySubjectType = new Map<number, number>();
  for (const st of subjectTypes) {
    if (st.legacySubjectTypeId != null)
      newToLegacySubjectType.set(st.id!, st.legacySubjectTypeId);
  }
  // Legacy subject-type IDs that bridge to a NEW type that has a meta
  const legacySubjectTypesWithMeta = new Set<number>();
  for (const st of subjectTypes) {
    if (
      st.id != null &&
      metaSubjectTypeIds.has(st.id) &&
      st.legacySubjectTypeId != null
    ) {
      legacySubjectTypesWithMeta.add(st.legacySubjectTypeId);
    }
  }

  // Restrict to students who actually have selections in new DB (those affected by migration).
  let students = await db
    .select()
    .from(studentModel)
    .where(
      sql`${studentModel.legacyStudentId} IS NOT NULL AND ${studentModel.id} IN (SELECT DISTINCT student_id_fk FROM student_subject_selections WHERE change_reason = 'legacy-migration')`,
    );
  // Use isNotNull import to satisfy linter
  void isNotNull;
  if (UID_FILTER)
    students = students.filter((s: any) => s.uid === UID_FILTER.toUpperCase());

  const mismatches: MismatchRow[] = [];
  let summaryErrors = 0,
    summaryWarns = 0,
    studentsClean = 0;

  for (const stu of students) {
    // Legacy: union of compulsory + optional in scope (sessions 16,17 + classes 4,5,6,7)
    const [legacyAllPapers]: any = await queryWithRetry(
      `
      (SELECT DISTINCT '1' AS source, p.subjectTypeId, p.subjectId, sb.subjectName, st.subjectTypeName, m.classId
        FROM studentpaperlinkingmain m
        JOIN studentpaperlinkingpaperlist p ON m.id = p.parent_id
        JOIN historicalrecord h            ON m.courseid=h.courseid AND m.classid=h.classid AND m.sectionid=h.sectionid AND m.shiftid=h.shiftid AND m.sessionid=h.sessionid
        JOIN studentpersonaldetails s      ON h.parent_id = s.id
        JOIN subject sb                    ON sb.id = p.subjectId
        JOIN subjecttype st                ON st.id = p.subjectTypeId
       WHERE m.sessionId IN (${legacySessionsIn}) AND m.classId IN (${legacyClassesIn})
         AND p.allstudents = '1' AND s.codeNumber = ?)
      UNION
      (SELECT DISTINCT '0' AS source, p.subjectTypeId, p.subjectId, sb.subjectName, st.subjectTypeName, m.classId
        FROM studentpaperlinkingmain m
        JOIN studentpaperlinkingpaperlist p ON m.id = p.parent_id
        JOIN studentpaperlinkingstudentlist ss ON p.id = ss.parent_id
        JOIN studentpersonaldetails s      ON ss.studentId = s.id
        JOIN subject sb                    ON sb.id = p.subjectId
        JOIN subjecttype st                ON st.id = p.subjectTypeId
       WHERE m.sessionId IN (${legacySessionsIn}) AND m.classId IN (${legacyClassesIn})
         AND p.allstudents = '0' AND s.codeNumber = ?)
      `,
      [stu.uid, stu.uid],
    );

    // Split legacy into compulsory and optional sets
    const legacyOptional = new Set<string>();
    const legacyCompulsory = new Set<string>();
    const skippedNoMeta: { subject: string; type: string; class: number }[] =
      [];
    for (const r of legacyAllPapers) {
      const newSubId = subjectBridge.get(Number(r.subjectId));
      if (!newSubId) continue; // unbridged subject — skip in expectation
      // If this legacy subject type has no corresponding meta in new DB, the
      // subject is "compulsory in new schema" — never in student_subject_selections.
      if (
        String(r.source) === "0" &&
        !legacySubjectTypesWithMeta.has(Number(r.subjectTypeId))
      ) {
        skippedNoMeta.push({
          subject: r.subjectName,
          type: r.subjectTypeName,
          class: r.classId,
        });
        continue;
      }
      const key = `${newSubId}|${r.subjectTypeName}|class:${r.classId}`;
      if (String(r.source) === "0") legacyOptional.add(key);
      else legacyCompulsory.add(key);
    }
    if (skippedNoMeta.length) {
      for (const s of skippedNoMeta) {
        mismatches.push({
          uid: stu.uid!,
          severity: "INFO",
          expected_in: "papers catalog (compulsory in new schema)",
          legacy_subject: s.subject,
          legacy_meta: `${s.type} (class ${s.class})`,
          note: "legacy optional, but subject type has no meta in new DB",
        });
      }
    }

    // New DB: actual selections for this student
    const newSelections = await db
      .select({
        subjectId: studentSubjectSelectionModel.subjectId,
        metaLabel: subjectSelectionMetaModel.label,
        metaSubjectTypeId: subjectSelectionMetaModel.subjectTypeId,
        subjectName: subjectModel.name,
      })
      .from(studentSubjectSelectionModel)
      .leftJoin(
        subjectSelectionMetaModel,
        eq(
          subjectSelectionMetaModel.id,
          studentSubjectSelectionModel.subjectSelectionMetaId,
        ),
      )
      .leftJoin(
        subjectModel,
        eq(subjectModel.id, studentSubjectSelectionModel.subjectId),
      )
      .where(eq(studentSubjectSelectionModel.studentId, stu.id!));

    // For each legacy optional, check it's in new DB (by subject_id match)
    const newSubjectIds = new Set<number>(
      newSelections
        .map((r) => r.subjectId)
        .filter((v): v is number => v != null),
    );

    let perStudentErrors = 0;
    for (const key of legacyOptional) {
      const subjectId = Number(key.split("|")[0]);
      if (!newSubjectIds.has(subjectId)) {
        const legSub = legacyAllPapers.find(
          (r: any) =>
            String(r.source) === "0" &&
            subjectBridge.get(Number(r.subjectId)) === subjectId,
        );
        mismatches.push({
          uid: stu.uid!,
          severity: "ERROR",
          expected_in: "new student_subject_selections",
          legacy_subject: legSub?.subjectName,
          legacy_meta: `${legSub?.subjectTypeName} (legacy class ${legSub?.classId})`,
          note: "legacy optional subject not in new DB",
        });
        perStudentErrors++;
        summaryErrors++;
      }
    }

    // Compulsory checks: any compulsory subject INCORRECTLY in student_subject_selections?
    for (const sel of newSelections) {
      if (!sel.subjectId) continue;
      // Was this subject explicitly chosen as optional in legacy?
      const wasOptional = [...legacyOptional].some(
        (k) => Number(k.split("|")[0]) === sel.subjectId,
      );
      const wasCompulsory = [...legacyCompulsory].some(
        (k) => Number(k.split("|")[0]) === sel.subjectId,
      );
      if (!wasOptional && wasCompulsory) {
        mismatches.push({
          uid: stu.uid!,
          severity: "ERROR",
          expected_in: "papers catalog (not student_subject_selections)",
          new_subject: sel.subjectName ?? undefined,
          new_meta: sel.metaLabel ?? undefined,
          note: "compulsory subject incorrectly in student_subject_selections",
        });
        perStudentErrors++;
        summaryErrors++;
      }
      if (!wasOptional && !wasCompulsory) {
        mismatches.push({
          uid: stu.uid!,
          severity: "WARN",
          expected_in: "(unexpected)",
          new_subject: sel.subjectName ?? undefined,
          new_meta: sel.metaLabel ?? undefined,
          note: "new DB has selection not present in legacy scope",
        });
        summaryWarns++;
      }
    }

    if (perStudentErrors === 0) studentsClean++;
    console.log(
      `  ${stu.uid}: legacy opt=${legacyOptional.size} new=${newSelections.length} errors=${perStudentErrors}`,
    );
  }

  // Write CSV
  const header =
    "uid,severity,expected_in,legacy_subject,legacy_meta,new_subject,new_meta,note\n";
  const body = mismatches
    .map((r) =>
      [
        r.uid,
        r.severity,
        r.expected_in,
        r.legacy_subject ?? "",
        r.legacy_meta ?? "",
        r.new_subject ?? "",
        r.new_meta ?? "",
        r.note,
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const outPath = join(
    process.cwd(),
    "excel-data",
    "subject-selection-mismatches.csv",
  );
  writeFileSync(outPath, header + body);
  console.log(`\nWrote ${outPath}`);
  console.log(
    `Summary: students=${students.length} clean=${studentsClean} ERROR=${summaryErrors} WARN=${summaryWarns}`,
  );

  await legacyPool.end();
  process.exit(summaryErrors > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
