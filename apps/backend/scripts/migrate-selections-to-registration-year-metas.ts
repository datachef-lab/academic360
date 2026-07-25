// CLI wrapper around the AY-drift heal service.
// Real logic lives in
// apps/backend/src/features/subject-selection/services/registration-year-drift-migration.service.ts
// so the boot-migrations orchestrator and this script share one code path.
//
// Usage (from apps/backend):
//   npx tsx scripts/migrate-selections-to-registration-year-metas.ts             # dry run
//   npx tsx scripts/migrate-selections-to-registration-year-metas.ts --commit    # apply
import "dotenv/config";
import {
  planRegistrationYearDrift,
  runRegistrationYearDriftMigration,
} from "../src/features/subject-selection/services/registration-year-drift-migration.service.js";

async function main() {
  const commit = process.argv.includes("--commit");
  console.log(
    commit ? "MODE: COMMIT" : "MODE: DRY RUN (pass --commit to apply)",
  );

  const plan = await planRegistrationYearDrift();
  console.log(`plan rows: ${plan.length}`);
  if (plan.length === 0) {
    console.log("Nothing to migrate. Done.");
    return;
  }

  if (!commit) {
    console.log("DRY RUN complete. Re-run with --commit to apply.");
    return;
  }

  const result = await runRegistrationYearDriftMigration({ commit: true });
  console.log("result:", result);
  if (result.manualReview.length > 0) {
    console.log(
      `\n⚠️  ${result.manualReview.length} rows skipped (different-subject cross-meta convergence — needs manual review):`,
    );
    for (const r of result.manualReview.slice(0, 20)) {
      console.log(
        `  student=${r.student_id} sss_id=${r.sss_id} wrong_meta=${r.wrong_meta} subj=${r.wrong_subject} -> target=${r.target_meta}`,
      );
    }
  }
  console.log("\nDONE.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
