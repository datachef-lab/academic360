// Historical import: CU admit-card Excel -> Sem V / Sem VI Minor 3/4
// selections. See apps/backend/data/imports/cu_admitcard_2023.xlsx.
//
// Column mapping (per Harsh):
//   "MN-3 (Sem V)"   -> meta labelled "Minor 3 (Semester V)"
//   "MN-4 (Sem VI)"  -> meta labelled "Minor 4 (Semester VI)"
// Cell values look like "PSYCHOLOGY (MN-3)" — the "(MN-x)" suffix is stripped
// and the remainder matched against subjects.name case-insensitively, trimmed.
//
// The meta is resolved against the student's REGISTRATION academic year
// (first promotion -> session -> academic year), the same rule enforced
// everywhere else in subject-selection now. The inserted row's sessionId is
// the student's LATEST promotion session (the session in which Sem V/VI
// actually runs), matching how earlier selections were stored.
//
// Idempotency contract (this is why the loader is safe to run every boot):
// if a (student, meta) row already exists in student_subject_selections in
// ANY state (active OR deprecated), the loader SKIPS it entirely — no
// insert, no update, no reactivation. That protects any admin/staff edit
// made after a prior load: even if a subject was changed or a row was
// deprecated on purpose, a subsequent boot will not undo it.
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYearModel,
  promotionModel,
  sessionModel,
  studentModel,
  studentSubjectSelectionModel,
  subjectModel,
  subjectSelectionMetaModel,
  userModel,
} from "@repo/db/schemas/models";

// xlsx is CJS; a namespace import under our ESM/tsx runtime yields a module
// object without the readFile helper. createRequire gives us the real thing.
const XLSX = createRequire(import.meta.url)("xlsx");

const META_LABELS = {
  sem5: "Minor 3 (Semester V)",
  sem6: "Minor 4 (Semester VI)",
} as const;

const CHANGE_REASON = "Bulk-loaded from CU admit-card Excel (Sem V/VI minors)";
const DEFAULT_CREATED_BY = 784; // Test Account admin (used by other bulk loads)

const norm = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase();
const normHeader = (s: unknown) => norm(s).replace(/[\s-]+/g, "");
/** "PSYCHOLOGY (MN-3)" -> "PSYCHOLOGY" */
const stripMnSuffix = (v: unknown) =>
  String(v ?? "")
    .replace(/\s*\(MN\s*-?\s*\d\)\s*$/i, "")
    .trim();

export type CuAdmitCardLoaderOptions = {
  /** Absolute path to the .xlsx file. */
  filePath: string;
  /** If false, does everything but the final INSERT — reports what would run. */
  commit?: boolean;
  /** userModel.id credited as createdBy for each inserted row. */
  createdBy?: number;
  /** Optional directory for the unmatched-data report; disables the file write if omitted. */
  reportDir?: string;
};

export type UnmatchedEntry = {
  rowNo: number;
  roll: string;
  code: string;
  issue: string;
};

export type CuAdmitCardLoaderResult = {
  excelRows: number;
  planned: number;
  inserted: number;
  skippedExistingPairs: number;
  problems: number;
  unmatched: UnmatchedEntry[];
  perMetaCount: Record<string, number>;
  reportPath: string | null;
};

type ExcelRow = {
  rowNo: number;
  roll: string;
  code: string;
  sem5: string;
  sem6: string;
};

function readExcel(filePath: string): ExcelRow[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  }) as any[][];
  const header = (raw[0] ?? []).map(normHeader);
  const col = (want: string) => {
    const i = header.indexOf(want);
    if (i < 0) {
      throw new Error(
        `[cu-admitcard-loader] column "${want}" missing from header: ${JSON.stringify(raw[0])}`,
      );
    }
    return i;
  };
  const iRoll = col("rollno");
  const iCode = col("code");
  const iSem5 = col("mn3(semv)");
  const iSem6 = col("mn4(semvi)");
  return raw
    .slice(1)
    .filter((r: any[]) =>
      r?.some((c: unknown) => c != null && String(c).trim() !== ""),
    )
    .map((r: any[], idx: number) => ({
      rowNo: idx + 2,
      roll: String(r[iRoll] ?? "").trim(),
      code: String(r[iCode] ?? "").trim(),
      sem5: stripMnSuffix(r[iSem5]),
      sem6: stripMnSuffix(r[iSem6]),
    }));
}

/** Case-insensitive/trimmed exact-match map; keep the ACTIVE subject when duplicate names exist. */
function addSubjectToMap(map: Map<string, any>, s: any) {
  const key = norm(s.name);
  if (!key) return;
  const prev = map.get(key);
  if (!prev || (s.isActive && !prev.isActive)) map.set(key, s);
}

export async function runCuAdmitCardSemVSemVILoader(
  options: CuAdmitCardLoaderOptions,
): Promise<CuAdmitCardLoaderResult> {
  const commit = options.commit !== false;
  const createdBy = options.createdBy ?? DEFAULT_CREATED_BY;

  const [creator] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.id, createdBy));
  if (!creator)
    throw new Error(
      `[cu-admitcard-loader] createdBy user ${createdBy} not found`,
    );

  const rows = readExcel(options.filePath);

  // ---- preload lookups ----------------------------------------------------
  const subjects = await db.select().from(subjectModel);
  const subjectByName = new Map<string, (typeof subjects)[number]>();
  for (const s of subjects) addSubjectToMap(subjectByName, s);

  const metaRows = await db
    .select({
      id: subjectSelectionMetaModel.id,
      label: subjectSelectionMetaModel.label,
      academicYearId: subjectSelectionMetaModel.academicYearId,
      year: academicYearModel.year,
    })
    .from(subjectSelectionMetaModel)
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, subjectSelectionMetaModel.academicYearId),
    );
  const metaByYearLabel = new Map<string, (typeof metaRows)[number]>();
  for (const m of metaRows)
    metaByYearLabel.set(`${m.academicYearId}|${norm(m.label)}`, m);

  const students = await db
    .select()
    .from(studentModel)
    .where(
      inArray(
        studentModel.uid,
        rows.map((r) => r.code).filter((c) => c.length > 0),
      ),
    );
  const studentByUid = new Map(students.map((s) => [String(s.uid).trim(), s]));

  const studentIds = students
    .map((s) => s.id!)
    .filter((id): id is number => typeof id === "number");
  const promotions =
    studentIds.length === 0
      ? []
      : await db
          .select({
            id: promotionModel.id,
            studentId: promotionModel.studentId,
            sessionId: promotionModel.sessionId,
            academicYearId: sessionModel.academicYearId,
          })
          .from(promotionModel)
          .innerJoin(
            sessionModel,
            eq(sessionModel.id, promotionModel.sessionId),
          )
          .where(inArray(promotionModel.studentId, studentIds));
  const promosByStudent = new Map<number, typeof promotions>();
  for (const p of promotions) {
    const list = promosByStudent.get(p.studentId) ?? [];
    list.push(p);
    promosByStudent.set(p.studentId, list);
  }

  // ANY-state existence check for the idempotency guard. If a row already
  // exists for (student, meta) — active or deprecated — the loader does
  // not touch it. That preserves post-load admin edits across restarts.
  const existing =
    studentIds.length === 0
      ? []
      : await db
          .select({
            id: studentSubjectSelectionModel.id,
            studentId: studentSubjectSelectionModel.studentId,
            subjectSelectionMetaId:
              studentSubjectSelectionModel.subjectSelectionMetaId,
            subjectId: studentSubjectSelectionModel.subjectId,
            isActive: studentSubjectSelectionModel.isActive,
            isDeprecated: studentSubjectSelectionModel.isDeprecated,
          })
          .from(studentSubjectSelectionModel)
          .where(inArray(studentSubjectSelectionModel.studentId, studentIds));
  const existsByStudentMeta = new Set<string>();
  for (const e of existing)
    existsByStudentMeta.add(`${e.studentId}|${e.subjectSelectionMetaId}`);

  // ---- build inserts ------------------------------------------------------
  const problems: UnmatchedEntry[] = [];
  let skippedExistingPairs = 0;
  const inserts: (typeof studentSubjectSelectionModel.$inferInsert)[] = [];
  const perMetaCount = new Map<string, number>();

  for (const r of rows) {
    if (!r.code) {
      problems.push({ ...r, issue: "empty code cell" });
      continue;
    }
    const student = studentByUid.get(r.code);
    if (!student) {
      problems.push({ ...r, issue: `no student with uid=${r.code}` });
      continue;
    }
    if (norm(student.rollNumber) !== norm(r.roll)) {
      problems.push({
        ...r,
        issue: `roll mismatch: excel=${r.roll} db=${student.rollNumber} (uid matched)`,
      });
      continue;
    }
    const promos = (promosByStudent.get(student.id!) ?? []).sort(
      (a, b) => a.id - b.id,
    );
    if (!promos.length) {
      problems.push({ ...r, issue: "student has no promotions" });
      continue;
    }
    const regAyId = promos[0].academicYearId;
    const currentSessionId = promos[promos.length - 1].sessionId;

    for (const [slot, label] of Object.entries(META_LABELS) as [
      "sem5" | "sem6",
      string,
    ][]) {
      const subjectName = r[slot];
      if (!subjectName) {
        problems.push({ ...r, issue: `${label}: empty subject cell` });
        continue;
      }
      const meta = metaByYearLabel.get(`${regAyId}|${norm(label)}`);
      if (!meta) {
        problems.push({
          ...r,
          issue: `${label}: no meta configured for registration AY id=${regAyId}`,
        });
        continue;
      }
      const subject = subjectByName.get(norm(subjectName));
      if (!subject) {
        problems.push({
          ...r,
          issue: `${label}: no subject named "${subjectName}"`,
        });
        continue;
      }
      if (existsByStudentMeta.has(`${student.id}|${meta.id}`)) {
        // Deliberate: don't second-guess post-load edits or previous imports.
        skippedExistingPairs += 1;
        continue;
      }
      inserts.push({
        sessionId: currentSessionId,
        subjectSelectionMetaId: meta.id,
        studentId: student.id!,
        subjectId: subject.id!,
        version: 1,
        parentId: null,
        isDeprecated: false,
        isActive: true,
        createdBy,
        changeReason: CHANGE_REASON,
      });
      const key = `${meta.label} [AY ${meta.year}]`;
      perMetaCount.set(key, (perMetaCount.get(key) ?? 0) + 1);
    }
  }

  let reportPath: string | null = null;
  if (options.reportDir && problems.length > 0) {
    fs.mkdirSync(options.reportDir, { recursive: true });
    const timestampSql = await db.execute(`SELECT now()::text AS ts`);
    const ts = String(
      ((timestampSql as any).rows ?? (timestampSql as any))[0]?.ts ?? "unknown",
    )
      .replace(/[^0-9]/g, "-")
      .replace(/-+$/, "");
    const src = path.basename(options.filePath, path.extname(options.filePath));
    reportPath = path.join(options.reportDir, `${src}_unmatched_${ts}.json`);
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          source: options.filePath,
          generatedAt: ts,
          summary: {
            excelRows: rows.length,
            planned: inserts.length,
            skippedExistingPairs,
            problems: problems.length,
          },
          problems,
        },
        null,
        2,
      ),
    );
  }

  if (commit && inserts.length > 0) {
    await db.transaction(async (tx) => {
      const CHUNK = 500;
      for (let i = 0; i < inserts.length; i += CHUNK) {
        await tx
          .insert(studentSubjectSelectionModel)
          .values(inserts.slice(i, i + CHUNK));
      }
    });
  }

  return {
    excelRows: rows.length,
    planned: inserts.length,
    inserted: commit ? inserts.length : 0,
    skippedExistingPairs,
    problems: problems.length,
    unmatched: problems,
    perMetaCount: Object.fromEntries(perMetaCount),
    reportPath,
  };
}
