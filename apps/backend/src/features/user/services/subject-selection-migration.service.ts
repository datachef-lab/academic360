// Per-student subject-selection migration, called from the legacy student loader.
// Builds bridges (subject, subject-type, session, class, meta) lazily on first call
// and caches them in-memory for the lifetime of the process.
//
// For each legacy `studentpaperlinkingpaperlist` row where allstudents='0' and the
// student is in `studentpaperlinkingstudentlist`, this inserts one row in
// `student_subject_selections` per (student × meta × subject), idempotently.
//
// Scope is derived dynamically from the new-DB `papers` table (max class with rows).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq, and, sql } from "drizzle-orm";
import { db, mysqlConnection } from "@/db/index.js";
import {
  paperModel,
  classModel,
  subjectModel,
  subjectTypeModel,
  sessionModel,
  subjectSelectionMetaModel,
  subjectSelectionMetaClassModel,
  studentSubjectSelectionModel,
  userModel,
} from "@repo/db/schemas/models";
import type { Student } from "@repo/db/schemas/models";

type Bridges = {
  classMap: Map<number, number>; // legacy class id -> new class id
  legacyClassIds: number[]; // for SQL IN(...)
  subjectMap: Map<number, number>; // legacy subject id -> new subject id
  subjectTypeMap: Map<number, number>; // legacy subject type id -> new
  sessionMap: Map<number, { id: number; academicYearId: number | null }>;
  metasInDb: (typeof subjectSelectionMetaModel.$inferSelect)[];
  metaClassesByMeta: Map<number, Set<number>>;
  auditUserId: number;
};

let cached: Bridges | null = null;

function norm(s: any): string {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
function tokenize(s: any): string[] {
  return norm(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}
function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a),
    sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const uni = sa.size + sb.size - inter;
  return uni === 0 ? 0 : inter / uni;
}
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = tmp;
    }
  }
  return dp[b.length];
}
function similarity(a: string, b: string): number {
  const na = norm(a),
    nb = norm(b);
  if (!na || !nb) return 0;
  const lev = 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);
  const jac = jaccard(tokenize(a), tokenize(b));
  return 0.5 * lev + 0.5 * jac;
}

// Hand-picked aliases used during initial bridge build (kept in sync with build-subject-bridge.ts).
const MANUAL_SUBJECT_ALIASES: Record<number, string> = {
  580: "Computerized Accounting and Introduction to Data Science",
  533: "Financial Institutions and Markets",
  191: "Information Technology And Its Application In Business",
  432: "Information Technology And Its Application In Business",
  536: "Statistics for Business Decisions",
  531: "Principles of Management & Organisational Behaviour",
};

async function buildBridges(): Promise<Bridges> {
  // Scope: legacy class -> new class via name match, capped to max new class with paper rows
  const rowsMax = await db
    .select({ maxClassId: sql<number>`MAX(${paperModel.classId})` })
    .from(paperModel);
  const maxNewClassId = Number(rowsMax[0]?.maxClassId ?? 0);

  const newClasses = await db.select().from(classModel);
  const [legacyClasses]: any = await mysqlConnection.query(
    "SELECT id, className FROM classes",
  );
  const classMap = new Map<number, number>();
  for (const nc of newClasses) {
    if (nc.id! > maxNewClassId) continue;
    const ncN = norm(nc.name ?? "");
    const hit = legacyClasses.find(
      (lr: any) => norm(String(lr.className)) === ncN,
    );
    if (hit) classMap.set(Number(hit.id), nc.id!);
  }
  const legacyClassIds = [...classMap.keys()].sort((a, b) => a - b);

  // Subject bridge (legacy `subject` table -> new `subjects` table) via fuzzy matching.
  const [legacySubjects]: any = await mysqlConnection.query(
    "SELECT id, subjectName FROM subject",
  );
  const newSubjects = await db.select().from(subjectModel);
  const exactByName = new Map<string, (typeof newSubjects)[number]>();
  for (const s of newSubjects) exactByName.set(norm(s.name), s);
  const subjectMap = new Map<number, number>();
  const FUZZY_AUTO = 0.92;
  for (const l of legacySubjects) {
    const overrideName = MANUAL_SUBJECT_ALIASES[Number(l.id)];
    if (overrideName) {
      const t = exactByName.get(norm(overrideName));
      if (t) {
        subjectMap.set(Number(l.id), t.id!);
        continue;
      }
    }
    const exact = exactByName.get(norm(l.subjectName));
    if (exact) {
      subjectMap.set(Number(l.id), exact.id!);
      continue;
    }
    let best: { s: any; score: number } | null = null;
    for (const s of newSubjects) {
      const score = similarity(l.subjectName, s.name ?? "");
      if (!best || score > best.score) best = { s, score };
    }
    if (best && best.score >= FUZZY_AUTO)
      subjectMap.set(Number(l.id), best.s.id);
  }

  // Subject type bridge from new schema (legacy_subject_type_id is canonical)
  const subjectTypes = await db.select().from(subjectTypeModel);
  const subjectTypeMap = new Map<number, number>();
  for (const st of subjectTypes) {
    if (st.legacySubjectTypeId != null)
      subjectTypeMap.set(st.legacySubjectTypeId, st.id!);
  }

  // Sessions
  const sessions = await db.select().from(sessionModel);
  const sessionMap = new Map<
    number,
    { id: number; academicYearId: number | null }
  >();
  for (const s of sessions) {
    if (s.legacySessionId != null)
      sessionMap.set(s.legacySessionId, {
        id: s.id!,
        academicYearId: s.academicYearId ?? null,
      });
  }

  // Metas + class memberships
  const metasInDb = await db.select().from(subjectSelectionMetaModel);
  const metaClasses = await db.select().from(subjectSelectionMetaClassModel);
  const metaClassesByMeta = new Map<number, Set<number>>();
  for (const mc of metaClasses) {
    if (mc.subjectSelectionMetaId == null || mc.classId == null) continue;
    if (!metaClassesByMeta.has(mc.subjectSelectionMetaId))
      metaClassesByMeta.set(mc.subjectSelectionMetaId, new Set());
    metaClassesByMeta.get(mc.subjectSelectionMetaId)!.add(mc.classId);
  }

  // Audit user
  const [adminUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.type, "ADMIN"));
  if (!adminUser)
    throw new Error(
      "subject-selection-migration: no ADMIN user found for audit `created_by`",
    );

  return {
    classMap,
    legacyClassIds,
    subjectMap,
    subjectTypeMap,
    sessionMap,
    metasInDb,
    metaClassesByMeta,
    auditUserId: adminUser.id!,
  };
}

async function getBridges(): Promise<Bridges> {
  if (!cached) cached = await buildBridges();
  return cached;
}

function resolveMeta(
  b: Bridges,
  academicYearId: number,
  subjectTypeId: number,
  classId: number,
): number | null {
  const candidates = b.metasInDb.filter(
    (m: any) =>
      m.academicYearId === academicYearId && m.subjectTypeId === subjectTypeId,
  );
  for (const m of candidates) {
    const classes = b.metaClassesByMeta.get(m.id!);
    if (classes?.has(classId)) return m.id!;
  }
  return null;
}

export type SubjectSelectionResult = {
  legacyRows: number;
  resolved: number;
  inserted: number;
  skippedDup: number;
  skippedExisting: number;
  skippedMeta: number;
  skippedSubject: number;
  skippedSession: number;
  skippedClass: number;
};

/**
 * For one already-imported student (must have `student.legacyStudentId` set),
 * fetch their legacy optional paper links and write `student_subject_selections`
 * rows. Idempotent and safe to re-run.
 */
export async function migrateSubjectSelectionForStudent(
  student: Student,
): Promise<SubjectSelectionResult> {
  const result: SubjectSelectionResult = {
    legacyRows: 0,
    resolved: 0,
    inserted: 0,
    skippedDup: 0,
    skippedExisting: 0,
    skippedMeta: 0,
    skippedSubject: 0,
    skippedSession: 0,
    skippedClass: 0,
  };
  if (!student.legacyStudentId) return result;

  const b = await getBridges();
  if (!b.legacyClassIds.length) return result;

  // Restrict to sessions whose legacy id has a sessionMap entry (i.e. exists in new DB sessions table)
  const knownLegacySessions = [...b.sessionMap.keys()];
  if (!knownLegacySessions.length) return result;

  const [legacyRows]: any = await mysqlConnection.query(
    `
    SELECT m.sessionId, m.classId, p.subjectTypeId, p.subjectId
    FROM studentpaperlinkingstudentlist ss
    JOIN studentpaperlinkingpaperlist p ON p.id = ss.parent_id
    JOIN studentpaperlinkingmain m      ON m.id = p.parent_id
    WHERE p.allstudents = '0'
      AND ss.studentId = ?
      AND m.sessionId IN (${knownLegacySessions.join(",")})
      AND m.classId  IN (${b.legacyClassIds.join(",")})
    `,
    [student.legacyStudentId],
  );
  result.legacyRows = legacyRows.length;

  const seen = new Set<string>();

  for (const row of legacyRows) {
    const sess = b.sessionMap.get(Number(row.sessionId));
    if (!sess || !sess.academicYearId) {
      result.skippedSession++;
      continue;
    }
    const newClassId = b.classMap.get(Number(row.classId));
    if (!newClassId) {
      result.skippedClass++;
      continue;
    }
    const newSubjectTypeId = b.subjectTypeMap.get(Number(row.subjectTypeId));
    if (!newSubjectTypeId) {
      result.skippedMeta++;
      continue;
    }
    const newSubjectId = b.subjectMap.get(Number(row.subjectId));
    if (!newSubjectId) {
      result.skippedSubject++;
      continue;
    }
    const metaId = resolveMeta(
      b,
      sess.academicYearId,
      newSubjectTypeId,
      newClassId,
    );
    if (!metaId) {
      result.skippedMeta++;
      continue;
    }
    result.resolved++;

    const key = `${sess.id}|${metaId}|${newSubjectId}`;
    if (seen.has(key)) {
      result.skippedDup++;
      continue;
    }
    seen.add(key);

    const [exists] = await db
      .select()
      .from(studentSubjectSelectionModel)
      .where(
        and(
          eq(studentSubjectSelectionModel.studentId, student.id!),
          eq(studentSubjectSelectionModel.sessionId, sess.id),
          eq(studentSubjectSelectionModel.subjectSelectionMetaId, metaId),
          eq(studentSubjectSelectionModel.subjectId, newSubjectId),
        ),
      );
    if (exists) {
      result.skippedExisting++;
      continue;
    }

    await db.insert(studentSubjectSelectionModel).values({
      studentId: student.id!,
      sessionId: sess.id,
      subjectSelectionMetaId: metaId,
      subjectId: newSubjectId,
      version: 1,
      isActive: true,
      createdBy: b.auditUserId,
      changeReason: "legacy-migration",
    });
    result.inserted++;
  }

  return result;
}
