// Build a legacy_subject_id -> new subjects.id bridge.
// 1. Pulls every distinct subject referenced by studentpaperlinkingpaperlist (sessions 16,17, classes 4-7)
// 2. Matches by exact name first, then fuzzy
// 3. Emits a CSV report (EXACT/FUZZY-AUTO/FUZZY-LOW/UNMATCHED) for review
// 4. With --apply, backfills subjects.legacy_subject_id for EXACT + high-confidence FUZZY matches
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { subjectModel } from "@repo/db/schemas/models";

const APPLY = process.argv.includes("--apply");
const FUZZY_AUTO_THRESHOLD = 0.92;
const FUZZY_LOW_THRESHOLD = 0.7;

// Manual overrides: legacy_id -> new subjects.name (case-insensitive). Used when the
// fuzzy score is below FUZZY_AUTO_THRESHOLD but human review confirms the match.
const MANUAL_OVERRIDES: Record<number, string> = {
  580: "Computerized Accounting and Introduction to Data Science",
  533: "Financial Institutions and Markets",
  191: "Information Technology And Its Application In Business",
  432: "Information Technology And Its Application In Business",
  536: "Statistics for Business Decisions",
  531: "Principles of Management & Organisational Behaviour",
};

const pool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 30_000,
  connectionLimit: 4,
});

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

async function main() {
  console.log(
    "Loading legacy subjects in scope (sessions 16-17, classes 4-7)...",
  );
  const [legacy]: any = await pool.query(`
    SELECT DISTINCT sb.id, sb.subjectName, sb.subjectTypeId, st.subjectTypeName
    FROM studentpaperlinkingmain m
    JOIN studentpaperlinkingpaperlist p ON p.parent_id = m.id
    JOIN subject sb ON sb.id = p.subjectId
    JOIN subjecttype st ON st.id = sb.subjectTypeId
    WHERE m.sessionId IN (16, 17) AND m.classId IN (4, 5, 6, 7)
    ORDER BY sb.subjectName
  `);
  console.log(`Distinct legacy subjects in scope: ${legacy.length}`);

  console.log("Loading new DB subjects...");
  const newSubjects = await db.select().from(subjectModel);
  console.log(`New DB subjects: ${newSubjects.length}`);

  const exactByName = new Map<string, (typeof newSubjects)[number]>();
  for (const s of newSubjects) exactByName.set(norm(s.name), s);

  type Row = {
    legacy_id: number;
    legacy_name: string;
    legacy_type: string;
    bucket: "EXACT" | "FUZZY-AUTO" | "FUZZY-LOW" | "UNMATCHED" | "ALREADY";
    new_id: number | null;
    new_name: string | null;
    score: number | null;
    note: string;
  };
  const rows: Row[] = [];

  for (const l of legacy) {
    const already = newSubjects.find(
      (s: any) => s.legacySubjectId === Number(l.id),
    );
    if (already) {
      rows.push({
        legacy_id: l.id,
        legacy_name: l.subjectName,
        legacy_type: l.subjectTypeName,
        bucket: "ALREADY",
        new_id: already.id!,
        new_name: already.name ?? null,
        score: 1,
        note: "already bridged",
      });
      continue;
    }
    const overrideName = MANUAL_OVERRIDES[Number(l.id)];
    if (overrideName) {
      const target = exactByName.get(norm(overrideName));
      if (target) {
        rows.push({
          legacy_id: l.id,
          legacy_name: l.subjectName,
          legacy_type: l.subjectTypeName,
          bucket: "EXACT",
          new_id: target.id!,
          new_name: target.name ?? null,
          score: 1,
          note: "manual override",
        });
        continue;
      }
    }
    const exact = exactByName.get(norm(l.subjectName));
    if (exact) {
      rows.push({
        legacy_id: l.id,
        legacy_name: l.subjectName,
        legacy_type: l.subjectTypeName,
        bucket: "EXACT",
        new_id: exact.id!,
        new_name: exact.name ?? null,
        score: 1,
        note: "",
      });
      continue;
    }
    let best: { s: any; score: number } | null = null;
    for (const s of newSubjects) {
      const score = similarity(l.subjectName, s.name ?? "");
      if (!best || score > best.score) best = { s, score };
    }
    if (!best) {
      rows.push({
        legacy_id: l.id,
        legacy_name: l.subjectName,
        legacy_type: l.subjectTypeName,
        bucket: "UNMATCHED",
        new_id: null,
        new_name: null,
        score: 0,
        note: "no candidates",
      });
      continue;
    }
    if (best.score >= FUZZY_AUTO_THRESHOLD) {
      rows.push({
        legacy_id: l.id,
        legacy_name: l.subjectName,
        legacy_type: l.subjectTypeName,
        bucket: "FUZZY-AUTO",
        new_id: best.s.id,
        new_name: best.s.name,
        score: best.score,
        note: "",
      });
    } else if (best.score >= FUZZY_LOW_THRESHOLD) {
      rows.push({
        legacy_id: l.id,
        legacy_name: l.subjectName,
        legacy_type: l.subjectTypeName,
        bucket: "FUZZY-LOW",
        new_id: best.s.id,
        new_name: best.s.name,
        score: best.score,
        note: "review",
      });
    } else {
      rows.push({
        legacy_id: l.id,
        legacy_name: l.subjectName,
        legacy_type: l.subjectTypeName,
        bucket: "UNMATCHED",
        new_id: null,
        new_name: null,
        score: best.score,
        note: `best=${best.s.name} score=${best.score.toFixed(2)}`,
      });
    }
  }

  const tally = rows.reduce(
    (acc, r) => ((acc[r.bucket] = (acc[r.bucket] || 0) + 1), acc),
    {} as Record<string, number>,
  );
  console.log("Bucket tally:", tally);

  const outCsv =
    "legacy_id,legacy_name,legacy_type,bucket,new_id,new_name,score,note\n" +
    rows
      .map((r) =>
        [
          r.legacy_id,
          r.legacy_name,
          r.legacy_type,
          r.bucket,
          r.new_id ?? "",
          r.new_name ?? "",
          r.score?.toFixed(3) ?? "",
          r.note,
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
  const outPath = join(process.cwd(), "excel-data", "subject-bridge.csv");
  writeFileSync(outPath, outCsv);
  console.log(`Wrote ${outPath}`);

  if (APPLY) {
    let updated = 0;
    for (const r of rows) {
      if ((r.bucket === "EXACT" || r.bucket === "FUZZY-AUTO") && r.new_id) {
        await db
          .update(subjectModel)
          .set({ legacySubjectId: r.legacy_id })
          .where(eq(subjectModel.id, r.new_id));
        updated++;
      }
    }
    console.log(`Backfilled legacy_subject_id on ${updated} new subjects.`);
  } else {
    console.log(
      "\n(dry-run; re-run with --apply to backfill subjects.legacy_subject_id for EXACT and FUZZY-AUTO buckets)",
    );
  }

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
