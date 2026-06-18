// Migrate per-student elective choices from legacy IRP into new student_subject_selections.
// Scope: legacy session IN (16,17), class IN (4,5,6,7) = Sem I-IV of 2023-24 / 2024-25.
// Idempotent. Read-only on legacy. Writes inserts only (no updates) to Postgres.
//
// Usage:
//   pnpm tsx scripts/migrate-subject-selection.ts            # dry-run (no inserts)
//   pnpm tsx scripts/migrate-subject-selection.ts --apply    # actually insert
//   pnpm tsx scripts/migrate-subject-selection.ts --uid=X    # restrict to one UID
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, and, isNotNull } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { resolveSubjectSelectionScope } from "./_subject-selection-scope.js";

const legacyPool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 60_000,
  waitForConnections: true,
  connectionLimit: 4,
});

async function queryWithRetry(
  sql: string,
  params: any[] = [],
  tries = 3,
): Promise<any> {
  let last: any;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await legacyPool.query(sql, params);
      return r;
    } catch (e) {
      last = e;
      console.warn(
        `legacy query attempt ${i + 1} failed: ${(e as any)?.code}; retrying...`,
      );
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw last;
}
import {
  studentModel,
  userModel,
  programCourseModel,
  subjectModel,
  subjectTypeModel,
  sessionModel,
  subjectSelectionMetaModel,
  subjectSelectionMetaClassModel,
  studentSubjectSelectionModel,
} from "@repo/db/schemas/models";

const APPLY = process.argv.includes("--apply");
const UID_FILTER = process.argv
  .slice(2)
  .find((a) => a.startsWith("--uid="))
  ?.slice("--uid=".length);

// Legacy class -> new class. Resolved at runtime from new-DB papers coverage.
let CLASS_MAP: Record<number, number> = {};
let LEGACY_CLASS_IDS: number[] = [];

// Use the build-subject-bridge.csv as the canonical legacy_subject_id -> new subject_id map.
function loadBridgeCsv(): Map<number, number> {
  const path = join(process.cwd(), "excel-data", "subject-bridge.csv");
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n").slice(1);
  const m = new Map<number, number>();
  for (const line of lines) {
    if (!line.trim()) continue;
    // crude CSV split — fine for our quoted strings
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

async function main() {
  console.log(
    APPLY ? "[apply mode]" : "[dry run]",
    UID_FILTER ? `uid=${UID_FILTER}` : "all imported",
  );

  const scope = await resolveSubjectSelectionScope(legacyPool);
  CLASS_MAP = scope.classMap;
  LEGACY_CLASS_IDS = scope.legacyClassIds;
  console.log(
    `scope: legacy classes [${LEGACY_CLASS_IDS.join(",")}] → new classes [${scope.newClassIds.join(",")}], maxNewClass=${scope.maxNewClassId}`,
  );
  if (LEGACY_CLASS_IDS.length === 0)
    throw new Error("No class scope resolved from papers catalog");

  const subjectBridge = loadBridgeCsv();
  console.log(`subject bridge entries: ${subjectBridge.size}`);

  // Build legacy_subject_type_id -> new id
  const subjectTypes = await db.select().from(subjectTypeModel);
  const subjectTypeBridge = new Map<number, number>();
  for (const st of subjectTypes) {
    if (st.legacySubjectTypeId != null)
      subjectTypeBridge.set(st.legacySubjectTypeId, st.id!);
  }

  // legacy_session_id -> new session row
  const sessions = await db.select().from(sessionModel);
  const sessionBridge = new Map<
    number,
    { id: number; academicYearId: number | null }
  >();
  for (const s of sessions) {
    if (s.legacySessionId != null) {
      sessionBridge.set(s.legacySessionId, {
        id: s.id!,
        academicYearId: s.academicYearId ?? null,
      });
    }
  }

  // Load metas + class associations for resolution
  const metas = await db.select().from(subjectSelectionMetaModel);
  const metaClasses = await db.select().from(subjectSelectionMetaClassModel);
  const metaClassesByMeta = new Map<number, Set<number>>();
  for (const mc of metaClasses) {
    if (mc.subjectSelectionMetaId == null || mc.classId == null) continue;
    if (!metaClassesByMeta.has(mc.subjectSelectionMetaId))
      metaClassesByMeta.set(mc.subjectSelectionMetaId, new Set());
    metaClassesByMeta.get(mc.subjectSelectionMetaId)!.add(mc.classId);
  }

  function resolveMeta(
    academicYearId: number,
    subjectTypeId: number,
    classId: number,
  ): number | null {
    const candidates = metas.filter(
      (m: any) =>
        m.academicYearId === academicYearId &&
        m.subjectTypeId === subjectTypeId,
    );
    for (const m of candidates) {
      const classes = metaClassesByMeta.get(m.id!);
      if (classes?.has(classId)) return m.id!;
    }
    return null;
  }

  // Pick the migration user (any ADMIN) for created_by audit
  const [adminUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.type, "ADMIN"));
  if (!adminUser)
    throw new Error("No ADMIN user found in new DB; can't set created_by");
  console.log(`audit user: id=${adminUser.id} name=${adminUser.name}`);

  // Imported students
  let students = await db
    .select()
    .from(studentModel)
    .where(isNotNull(studentModel.legacyStudentId));
  if (UID_FILTER)
    students = students.filter((s: any) => s.uid === UID_FILTER.toUpperCase());
  console.log(`imported students in scope: ${students.length}`);

  const studentsByLegacyId = new Map<number, any>();
  for (const s of students) {
    if (s.legacyStudentId != null)
      studentsByLegacyId.set(Number(s.legacyStudentId), s);
  }

  // Bulk-fetch all legacy linking rows in scope once
  console.log("bulk-fetching legacy linking rows...");
  const [allLegacyRows]: any = await queryWithRetry(
    `
    SELECT ss.studentId AS legacy_student_id, m.sessionId, m.classId,
           p.subjectTypeId, p.subjectId
    FROM studentpaperlinkingstudentlist ss
    JOIN studentpaperlinkingpaperlist p ON p.id = ss.parent_id
    JOIN studentpaperlinkingmain m      ON m.id = p.parent_id
    WHERE p.allstudents = '0'
      AND m.sessionId IN (${[...sessionBridge.keys()].join(",")})
      AND m.classId IN (${LEGACY_CLASS_IDS.join(",")})
    `,
  );
  console.log(`fetched ${allLegacyRows.length} legacy linking rows`);

  // Group by legacy student
  const byStudent = new Map<number, any[]>();
  for (const r of allLegacyRows) {
    const lid = Number(r.legacy_student_id);
    if (!studentsByLegacyId.has(lid)) continue;
    if (!byStudent.has(lid)) byStudent.set(lid, []);
    byStudent.get(lid)!.push(r);
  }
  console.log(`students with linking rows: ${byStudent.size}`);

  let totalLegacyRows = 0,
    totalResolved = 0,
    totalInserted = 0,
    totalSkipMeta = 0,
    totalSkipSubject = 0,
    totalSkipDup = 0,
    totalSkipSession = 0,
    totalSkipClass = 0,
    totalSkipExisting = 0;
  const errors: any[] = [];

  for (const stu of students) {
    const legacyRows: any[] = byStudent.get(Number(stu.legacyStudentId!)) ?? [];
    if (legacyRows.length === 0) continue;

    const seen = new Set<string>();
    let perStudentInserted = 0,
      perStudentDup = 0,
      perStudentSkipMeta = 0,
      perStudentSkipSubject = 0;

    for (const row of legacyRows) {
      totalLegacyRows++;
      const sess = sessionBridge.get(Number(row.sessionId));
      if (!sess || !sess.academicYearId) {
        totalSkipSession++;
        continue;
      }
      const newClassId = CLASS_MAP[Number(row.classId)];
      if (!newClassId) {
        totalSkipClass++;
        continue;
      }
      const newSubjectTypeId = subjectTypeBridge.get(Number(row.subjectTypeId));
      if (!newSubjectTypeId) {
        totalSkipMeta++;
        errors.push({
          uid: stu.uid,
          row,
          why: "subject_type not bridged",
          legacySubjectTypeId: row.subjectTypeId,
        });
        continue;
      }
      const newSubjectId = subjectBridge.get(Number(row.subjectId));
      if (!newSubjectId) {
        totalSkipSubject++;
        errors.push({
          uid: stu.uid,
          row,
          why: "subject not in bridge",
          legacySubjectId: row.subjectId,
        });
        continue;
      }
      const metaId = resolveMeta(
        sess.academicYearId,
        newSubjectTypeId,
        newClassId,
      );
      if (!metaId) {
        totalSkipMeta++;
        errors.push({
          uid: stu.uid,
          row,
          why: "no meta",
          academicYearId: sess.academicYearId,
          newSubjectTypeId,
          newClassId,
        });
        continue;
      }
      totalResolved++;
      const dedupeKey = `${sess.id}|${metaId}|${newSubjectId}`;
      if (seen.has(dedupeKey)) {
        perStudentDup++;
        totalSkipDup++;
        continue;
      }
      seen.add(dedupeKey);

      // idempotency check against DB
      const [exists] = await db
        .select()
        .from(studentSubjectSelectionModel)
        .where(
          and(
            eq(studentSubjectSelectionModel.studentId, stu.id!),
            eq(studentSubjectSelectionModel.sessionId, sess.id),
            eq(studentSubjectSelectionModel.subjectSelectionMetaId, metaId),
            eq(studentSubjectSelectionModel.subjectId, newSubjectId),
          ),
        );
      if (exists) {
        totalSkipExisting++;
        continue;
      }

      if (APPLY) {
        await db.insert(studentSubjectSelectionModel).values({
          studentId: stu.id!,
          sessionId: sess.id,
          subjectSelectionMetaId: metaId,
          subjectId: newSubjectId,
          version: 1,
          isActive: true,
          createdBy: adminUser.id,
          changeReason: "legacy-migration",
        });
      }
      perStudentInserted++;
      totalInserted++;
    }

    console.log(
      `  ${stu.uid}: legacy=${legacyRows.length} resolved=${perStudentInserted + perStudentDup} inserted=${perStudentInserted} dup=${perStudentDup}`,
    );
  }

  console.log("\n=== summary ===");
  console.log({
    students: students.length,
    totalLegacyRows,
    totalResolved,
    totalInserted,
    totalSkipExisting,
    totalSkipDup,
    totalSkipMeta,
    totalSkipSubject,
    totalSkipSession,
    totalSkipClass,
    errors: errors.length,
  });
  if (errors.length) {
    const slice = errors.slice(0, 10);
    console.log("first errors (up to 10):");
    for (const e of slice) console.log(" -", e);
  }

  await legacyPool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
