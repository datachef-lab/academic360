// Backfill papers across academic years + set previous_paper linkage chain.
//
// Current state: papers exist only for the HEAD academic year (2025-26).
// This copies each HEAD paper into the older CCF academic years and links the
// chain so that  <oldest> .. 2023-24 <- 2024-25 <- 2025-26 (HEAD), where
// each year's paper.previous_paper_id points to the SAME paper in the prior year.
//
// Idempotent: re-run safe. Matches an existing copy by
// (academic_year, programCourse, class, subject, subjectType, code) before inserting.
//
// Usage: pnpm tsx scripts/backfill-papers-ay.ts            # dry run (counts only)
//        pnpm tsx scripts/backfill-papers-ay.ts --apply
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { paperModel, academicYearModel } from "@repo/db/schemas/models";

const APPLY = process.argv.includes("--apply");

async function main() {
  // Resolve academic years by label.
  const ays = await db.select().from(academicYearModel);
  const ayByYear = new Map<string, number>();
  for (const a of ays) ayByYear.set(String(a.year), a.id!);

  const HEAD = "2025-26"; // existing papers live here
  // Oldest -> newest (excluding HEAD). Only CCF years.
  const OLDER_CHAIN = ["2023-24", "2024-25"];

  const headAyId = ayByYear.get(HEAD);
  if (!headAyId) throw new Error(`HEAD academic year ${HEAD} not found`);
  for (const y of OLDER_CHAIN)
    if (!ayByYear.get(y)) throw new Error(`AY ${y} not found`);

  const headPapers = await db
    .select()
    .from(paperModel)
    .where(eq(paperModel.academicYearId, headAyId));
  console.log(`HEAD (${HEAD}) papers: ${headPapers.length}`);
  for (const y of [...OLDER_CHAIN, HEAD]) {
    const cnt = await db
      .select()
      .from(paperModel)
      .where(eq(paperModel.academicYearId, ayByYear.get(y)!));
    console.log(`  AY ${y} currently has ${cnt.length} papers`);
  }
  if (!APPLY) {
    console.log(
      `\n(dry run) would create ${headPapers.length} papers in each of [${OLDER_CHAIN.join(", ")}] and chain previous_paper.`,
    );
    console.log("re-run with --apply");
    process.exit(0);
  }

  // find-or-create a copy of `tpl` in academic year `ayId`, with previous = prevId
  async function ensureCopy(
    tpl: any,
    ayId: number,
    prevId: number | null,
  ): Promise<number> {
    const [existing] = await db
      .select()
      .from(paperModel)
      .where(
        and(
          eq(paperModel.academicYearId, ayId),
          eq(paperModel.programCourseId, tpl.programCourseId),
          eq(paperModel.classId, tpl.classId),
          eq(paperModel.subjectId, tpl.subjectId),
          eq(paperModel.subjectTypeId, tpl.subjectTypeId),
          eq(paperModel.code, tpl.code),
        ),
      );
    if (existing) {
      // ensure linkage is correct
      if ((existing.previousPaperId ?? null) !== prevId) {
        await db
          .update(paperModel)
          .set({ previousPaperId: prevId })
          .where(eq(paperModel.id, existing.id!));
      }
      return existing.id!;
    }
    const [ins] = await db
      .insert(paperModel)
      .values({
        subjectId: tpl.subjectId,
        affiliationId: tpl.affiliationId,
        regulationTypeId: tpl.regulationTypeId,
        academicYearId: ayId,
        subjectTypeId: tpl.subjectTypeId,
        programCourseId: tpl.programCourseId,
        classId: tpl.classId,
        name: tpl.name,
        code: tpl.code,
        isOptional: tpl.isOptional,
        sequence: tpl.sequence,
        isActive: tpl.isActive,
        autoAssign: tpl.autoAssign,
        previousPaperId: prevId,
      })
      .returning();
    return ins.id!;
  }

  let created = 0,
    linkedHead = 0;
  for (const tpl of headPapers) {
    let prevId: number | null = null;
    // oldest -> newest
    for (const y of OLDER_CHAIN) {
      const before = prevId;
      const id = await ensureCopy(tpl, ayByYear.get(y)!, before);
      prevId = id;
      created++;
    }
    // link HEAD paper's previous to the newest older copy (2024-25)
    if ((tpl.previousPaperId ?? null) !== prevId) {
      await db
        .update(paperModel)
        .set({ previousPaperId: prevId })
        .where(eq(paperModel.id, tpl.id!));
      linkedHead++;
    }
  }

  console.log(
    `ensured ${created} older-AY paper copies; linked ${linkedHead} HEAD papers to prior year.`,
  );

  // report
  for (const y of [...OLDER_CHAIN, HEAD]) {
    const ayId = ayByYear.get(y)!;
    const rows = await db
      .select()
      .from(paperModel)
      .where(eq(paperModel.academicYearId, ayId));
    const withPrev = rows.filter((r) => r.previousPaperId != null).length;
    const nullPrev = rows.length - withPrev;
    console.log(
      `AY ${y}: ${rows.length} papers, withPrev=${withPrev}, nullPrev=${nullPrev}`,
    );
  }
  void isNull;
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
