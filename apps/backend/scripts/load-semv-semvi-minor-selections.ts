// CLI wrapper around the Sem V/VI Minor 3/4 loader service.
// Real logic lives in
// apps/backend/src/features/subject-selection/services/cu-admitcard-loader.service.ts
// so the boot-migrations orchestrator and this script share one code path.
//
// Usage (from apps/backend):
//   npx tsx scripts/load-semv-semvi-minor-selections.ts                     # dry run, repo Excel
//   npx tsx scripts/load-semv-semvi-minor-selections.ts --commit            # insert, repo Excel
//   npx tsx scripts/load-semv-semvi-minor-selections.ts --file /abs/path    # override Excel path
//   optional: --created-by <userId>   (defaults to 784)
import "dotenv/config";
import path from "path";
import { runCuAdmitCardSemVSemVILoader } from "../src/features/subject-selection/services/cu-admitcard-loader.service.js";

const args = process.argv.slice(2);
const getArg = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DEFAULT_FILE = path.resolve(
  new URL(".", import.meta.url).pathname,
  "..",
  "data",
  "imports",
  "cu_admitcard_2023.xlsx",
);
const DEFAULT_REPORT_DIR = path.resolve(
  new URL(".", import.meta.url).pathname,
  "..",
  "data",
  "imports",
  "reports",
);

async function main() {
  const filePath = getArg("--file") ?? DEFAULT_FILE;
  const commit = args.includes("--commit");
  const createdBy = getArg("--created-by")
    ? Number(getArg("--created-by"))
    : undefined;

  console.log(`file: ${filePath}`);
  console.log(
    `mode: ${commit ? "COMMIT" : "DRY RUN (pass --commit to insert)"}`,
  );

  const result = await runCuAdmitCardSemVSemVILoader({
    filePath,
    commit,
    createdBy,
    reportDir: DEFAULT_REPORT_DIR,
  });

  console.log(`\nexcel rows: ${result.excelRows}`);
  console.log(`planned inserts: ${result.planned}`);
  for (const [k, v] of Object.entries(result.perMetaCount).sort()) {
    console.log(`  ${k}: ${v}`);
  }
  console.log(
    `skipped (existing student+meta): ${result.skippedExistingPairs}`,
  );
  console.log(`problems: ${result.problems}`);
  if (result.reportPath) console.log(`report: ${result.reportPath}`);
  if (result.unmatched.length > 0) {
    for (const p of result.unmatched.slice(0, 25)) {
      console.log(`  row ${p.rowNo} (${p.roll}/${p.code}): ${p.issue}`);
    }
    if (result.unmatched.length > 25) {
      console.log(
        `  ... and ${result.unmatched.length - 25} more (see report file)`,
      );
    }
  }

  if (!commit) {
    console.log("\nDRY RUN — nothing written.");
  } else {
    console.log(`\nDONE. inserted ${result.inserted}.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
