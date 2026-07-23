// Top-up an academic year's structure (session + selection metas + related
// subjects + restricted groupings + subject groupings + papers + components +
// previous_paper chaining) by driving the SAME service the legacy uid import
// uses: ensureAcademicYearStructure(). No separate copy logic lives here, so
// the heal can never diverge from what the import would have done.
//
// Dry-run runs the REAL code inside a transaction and rolls back, so the
// printed delta is exactly what --apply would commit.
//
// Usage:
//   pnpm tsx scripts/ensure-ay-structure.ts --year=2024-25 [--year=2023-24]
//        [--source=2025-26] [--apply]
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { eq, count } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
  academicYearModel,
  paperModel,
  paperComponentModel,
  subjectSelectionMetaModel,
  relatedSubjectMainModel,
  restrictedGroupingMainModel,
  subjectGroupingMainModel,
} from "@repo/db/schemas/models";
import { ensureAcademicYearStructure } from "../src/features/academics/services/academic-year-structure.service.js";

const APPLY = process.argv.includes("--apply");
const YEARS = process.argv
  .slice(2)
  .filter((a) => a.startsWith("--year="))
  .map((a) => a.slice("--year=".length).trim())
  .filter(Boolean);
const SOURCE = process.argv
  .slice(2)
  .find((a) => a.startsWith("--source="))
  ?.slice("--source=".length)
  .trim();

class Rollback extends Error {
  constructor(public readonly payload: any) {
    super("dry-run rollback");
  }
}

async function countsFor(ayId: number) {
  const one = async (table: any, col: any) =>
    Number(
      (await db.select({ n: count() }).from(table).where(eq(col, ayId)))[0]
        ?.n ?? 0,
    );
  return {
    papers: await one(paperModel, paperModel.academicYearId),
    metas: await one(
      subjectSelectionMetaModel,
      subjectSelectionMetaModel.academicYearId,
    ),
    relatedSubjects: await one(
      relatedSubjectMainModel,
      relatedSubjectMainModel.academicYearId,
    ),
    restrictedGroupings: await one(
      restrictedGroupingMainModel,
      restrictedGroupingMainModel.academicYearId,
    ),
    subjectGroupings: await one(
      subjectGroupingMainModel,
      subjectGroupingMainModel.academicYearId,
    ),
  };
}

async function main() {
  if (!YEARS.length) {
    console.error(
      "Usage: pnpm tsx scripts/ensure-ay-structure.ts --year=2024-25 [--year=...] [--source=2025-26] [--apply]",
    );
    process.exit(1);
  }
  console.log(APPLY ? "[apply mode]" : "[dry run — tx rolled back]");

  const ays = await db.select().from(academicYearModel);
  const byLabel = new Map(ays.map((a) => [String(a.year), a]));

  const sourceAy = SOURCE ? byLabel.get(SOURCE) : undefined;
  if (SOURCE && !sourceAy) throw new Error(`--source year ${SOURCE} not found`);

  for (const label of YEARS) {
    const target = byLabel.get(label);
    if (!target) throw new Error(`--year ${label} not found in academic_years`);

    const before = await countsFor(target.id!);
    console.log(`\n=== AY ${label} (id=${target.id}) before:`, before);

    let result: any = null;
    try {
      await db.transaction(async (tx) => {
        result = await ensureAcademicYearStructure(tx, target.id!, {
          sourceYearId: sourceAy?.id ?? null,
        });
        if (!APPLY) throw new Rollback(result);
      });
    } catch (e) {
      if (!(e instanceof Rollback)) throw e;
      result = e.payload;
    }

    console.log(`ensure result (${APPLY ? "committed" : "rolled back"}):`, {
      sessionCreated: result.sessionCreated,
      metas: result.metas,
      relatedSubjects: result.relatedSubjects,
      restrictedGroupings: result.restrictedGroupings,
      subjectGroupings: result.subjectGroupings,
      papers: result.papers,
      paperComponents: result.paperComponents,
    });

    const after = await countsFor(target.id!);
    console.log(`AY ${label} after:`, after);
  }

  // components sanity: papers with zero components per requested year
  for (const label of YEARS) {
    const target = byLabel.get(label)!;
    const rows: any = await db.execute(
      `SELECT count(*)::int AS n
       FROM papers p
       WHERE p.academic_year_id_fk = ${Number(target.id)}
         AND NOT EXISTS (SELECT 1 FROM paper_components c WHERE c.paper_id_fk = p.id)`,
    );
    const n = ((rows as any).rows ?? (rows as any))[0]?.n;
    console.log(`AY ${label}: papers without components = ${n}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
