// Runs the same code path as POST /api/students/import-legacy-students,
// calling processStudentsFromExcelBuffer directly to avoid JWT/HTTP overhead.
// Optional --limit=N takes only the first N UIDs from the Excel.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { processStudentsFromExcelBuffer } from "../src/features/user/services/refactor-old-migration.service.js";

function arg(name: string): string | undefined {
  const m = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return m ? m.split("=")[1] : undefined;
}

async function main() {
  const inputXlsx =
    arg("input") ??
    join(process.cwd(), "excel-data", "import-test-2023-2024.xlsx");
  const limit = arg("limit") ? Number(arg("limit")) : undefined;

  const original = readFileSync(inputXlsx);
  let bufferToImport: Buffer = original;

  if (limit !== undefined && Number.isFinite(limit)) {
    const wb = XLSX.read(original);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<{ UID: any }>(sheet, { defval: "" });
    const sliced = rows.slice(0, limit);
    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.json_to_sheet(sliced);
    XLSX.utils.book_append_sheet(newWb, newWs, "Students");
    bufferToImport = Buffer.from(
      XLSX.write(newWb, { type: "buffer", bookType: "xlsx" }),
    );
    console.log(`Limited input to ${sliced.length} UIDs`);
  }

  console.log(
    `Calling processStudentsFromExcelBuffer (${bufferToImport.length} bytes) ...`,
  );
  const t0 = Date.now();
  const summary = await processStudentsFromExcelBuffer(bufferToImport);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s`);
  console.log("Summary:", JSON.stringify(summary, null, 2));

  const outPath = join(
    process.cwd(),
    "excel-data",
    `import-summary-${Date.now()}.json`,
  );
  writeFileSync(
    outPath,
    JSON.stringify({ elapsed: `${elapsed}s`, summary }, null, 2),
  );
  console.log("Wrote:", outPath);

  process.exit(summary.errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(2);
});
