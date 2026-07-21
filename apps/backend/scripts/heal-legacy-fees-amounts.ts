// CLI wrapper around the legacy-fees amount heal.
// Real logic lives in
// apps/backend/src/features/fees/services/legacy-fees-amount-heal.service.ts
// so the boot orchestrator and this script share one code path.
//
// Usage (from apps/backend):
//   npx tsx scripts/heal-legacy-fees-amounts.ts              # dry run
//   npx tsx scripts/heal-legacy-fees-amounts.ts --commit     # apply (guarded by marker)
//   npx tsx scripts/heal-legacy-fees-amounts.ts --commit --force  # re-run even after marker
//   npx tsx scripts/heal-legacy-fees-amounts.ts --report-unresolved <path>.xlsx
//                                                            # also write full unresolved list
import "dotenv/config";
import { runLegacyFeesAmountHeal } from "../src/features/fees/services/legacy-fees-amount-heal.service.js";

function argValue(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx < 0 || idx === process.argv.length - 1) return null;
  return process.argv[idx + 1];
}

async function main() {
  const commit = process.argv.includes("--commit");
  const force = process.argv.includes("--force");
  const unresolvedReportPath = argValue("--report-unresolved");

  console.log(
    `MODE: ${commit ? "COMMIT" : "DRY RUN"}${force ? " (FORCE — ignore marker)" : ""}${
      unresolvedReportPath ? ` (unresolved -> ${unresolvedReportPath})` : ""
    }`,
  );

  const started = Date.now();
  const result = await runLegacyFeesAmountHeal({
    commit,
    force,
    unresolvedReportPath: unresolvedReportPath ?? undefined,
    onProgress: (m) =>
      console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s] ${m}`),
  });
  const ms = Date.now() - started;

  if (result.skipped) {
    console.log(`SKIPPED: ${result.skipReason}`);
    console.log(`(pass --force to re-run against the current DB)`);
    process.exit(0);
  }

  console.log(`\nDone in ${ms}ms`);
  console.log(`  students in scope:     ${result.studentsInScope}`);
  console.log(`  IRP rows pulled:       ${result.irpRowsPulled}`);
  console.log(`  mappings checked:      ${result.mappingsChecked}`);
  console.log(`  matched (no-op):       ${result.mappingsMatched}`);
  console.log(`  mismatched:            ${result.mappingsMismatched}`);
  console.log(`    slab reassigned:     ${result.mappingsReassigned}`);
  console.log(`    unresolved:          ${result.mappingsUnresolved}`);
  console.log(`  payments updated:      ${result.paymentsUpdated}`);
  console.log(`  out-of-scope skipped:  ${result.skippedOutOfScope}`);
  if (result.sampleReassigned.length > 0) {
    console.log(
      `\nSample reassigned (first ${result.sampleReassigned.length}):`,
    );
    for (const s of result.sampleReassigned) {
      console.log(
        `  ${s.uid.padEnd(14)} ${s.year} ${s.class.padEnd(14)} ${s.receiptType.padEnd(18)} ${s.before} -> ${s.after}  [${s.slab} via ${s.resolvedBy}] [${s.mode}]`,
      );
    }
  }
  if (result.sampleUnresolved.length > 0) {
    console.log(
      `\nSample unresolved (first ${result.sampleUnresolved.length}) — need manual review:`,
    );
    for (const s of result.sampleUnresolved) {
      console.log(
        `  ${s.uid.padEnd(14)} ${s.year} ${s.class.padEnd(14)} ${s.receiptType.padEnd(18)} IRP=${s.irpAmount} current=${s.currentPayable}  (${s.reason})`,
      );
    }
  }
  if (result.unresolvedReportPath) {
    console.log(`\nFull unresolved report: ${result.unresolvedReportPath}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
