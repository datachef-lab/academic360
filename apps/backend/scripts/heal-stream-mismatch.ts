// CLI wrapper around the subject-selection stream-mismatch heal.
// Real logic: src/features/subject-selection/services/stream-mismatch-heal.service.ts
// (shared with the boot orchestrator).
//
// Usage (from apps/backend):
//   npx tsx scripts/heal-stream-mismatch.ts            # dry run
//   npx tsx scripts/heal-stream-mismatch.ts --commit   # apply
import "dotenv/config";
import { runStreamMismatchHeal } from "../src/features/subject-selection/services/stream-mismatch-heal.service.js";

async function main() {
  const commit = process.argv.includes("--commit");
  console.log(`MODE: ${commit ? "COMMIT" : "DRY RUN"}`);

  const started = Date.now();
  const result = await runStreamMismatchHeal({
    commit,
    onProgress: (m) =>
      console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s] ${m}`),
  });

  console.log(`\nDone in ${Date.now() - started}ms`);
  console.log(`  misfiled rows:      ${result.misfiledRows}`);
  console.log(`  rewired:            ${result.rewired}`);
  console.log(`  skipped ambiguous:  ${result.skippedAmbiguous}`);
  console.log(`  skipped duplicate:  ${result.skippedDuplicate}`);
  console.log(`  dup groups found:   ${result.duplicateGroupsFound}`);
  console.log(`  dup rows deactivated: ${result.duplicateRowsDeactivated}`);
  if (Object.keys(result.perMetaMoves).length > 0) {
    console.log(`\nMoves by meta:`);
    for (const [k, v] of Object.entries(result.perMetaMoves)) {
      console.log(`  meta ${k}: ${v} rows`);
    }
  }
  if (result.sampleRewired.length > 0) {
    console.log(`\nSample rewired (first ${result.sampleRewired.length}):`);
    for (const s of result.sampleRewired) {
      console.log(
        `  ${s.uid.padEnd(14)} sel=${s.selectionId} ${s.fromMeta} -> ${s.toMeta}  ${s.subject}`,
      );
    }
  }
  if (result.sampleSkipped.length > 0) {
    console.log(`\nSample skipped (first ${result.sampleSkipped.length}):`);
    for (const s of result.sampleSkipped) {
      console.log(
        `  ${s.uid.padEnd(14)} sel=${s.selectionId} meta=${s.meta}  (${s.reason})`,
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
