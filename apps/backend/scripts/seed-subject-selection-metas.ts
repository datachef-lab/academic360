// Clone the 8 subject_selection_meta rows (currently only for AY 2025-26) onto
// AY 2023-24 (id=5) and AY 2024-25 (id=2) so per-session metas exist for our
// migration target sessions. Idempotent.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaClassModel,
  subjectSelectionMetaStreamModel,
} from "@repo/db/schemas/models";

const SOURCE_AY = 1; // 2025-26 has the canonical 8 metas
const TARGET_AYS = [2, 5]; // 2024-25, 2023-24

async function main() {
  const src = await db
    .select()
    .from(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.academicYearId, SOURCE_AY));
  console.log(`Source metas (AY=${SOURCE_AY}): ${src.length}`);

  for (const targetAy of TARGET_AYS) {
    console.log(`\n=== seeding AY ${targetAy} ===`);
    for (const m of src) {
      const [existing] = await db
        .select()
        .from(subjectSelectionMetaModel)
        .where(
          and(
            eq(subjectSelectionMetaModel.academicYearId, targetAy),
            eq(subjectSelectionMetaModel.subjectTypeId, m.subjectTypeId!),
            eq(subjectSelectionMetaModel.label, m.label!),
          ),
        );
      let targetId: number;
      if (existing) {
        console.log(`  skip (exists): ${m.label} -> meta_id=${existing.id}`);
        targetId = existing.id!;
      } else {
        const [inserted] = await db
          .insert(subjectSelectionMetaModel)
          .values({
            academicYearId: targetAy,
            subjectTypeId: m.subjectTypeId!,
            label: m.label!,
            sequence: m.sequence ?? undefined,
            isActive: m.isActive ?? true,
          })
          .returning();
        targetId = inserted.id!;
        console.log(`  inserted: ${m.label} -> meta_id=${targetId}`);
      }

      const classes = await db
        .select()
        .from(subjectSelectionMetaClassModel)
        .where(
          eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, m.id!),
        );
      for (const c of classes) {
        const [exC] = await db
          .select()
          .from(subjectSelectionMetaClassModel)
          .where(
            and(
              eq(
                subjectSelectionMetaClassModel.subjectSelectionMetaId,
                targetId,
              ),
              eq(subjectSelectionMetaClassModel.classId, c.classId!),
            ),
          );
        if (!exC) {
          await db.insert(subjectSelectionMetaClassModel).values({
            subjectSelectionMetaId: targetId,
            classId: c.classId!,
          });
        }
      }
      const streams = await db
        .select()
        .from(subjectSelectionMetaStreamModel)
        .where(
          eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, m.id!),
        );
      for (const s of streams) {
        const [exS] = await db
          .select()
          .from(subjectSelectionMetaStreamModel)
          .where(
            and(
              eq(
                subjectSelectionMetaStreamModel.subjectSelectionMetaId,
                targetId,
              ),
              eq(subjectSelectionMetaStreamModel.streamId, s.streamId!),
            ),
          );
        if (!exS) {
          await db.insert(subjectSelectionMetaStreamModel).values({
            subjectSelectionMetaId: targetId,
            streamId: s.streamId!,
          });
        }
      }
    }
  }
  console.log("\ndone.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
