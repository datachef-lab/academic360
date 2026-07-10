/**
 * Local verification harness for the concurrent legacy UID import
 * (feat/concurrent-uid-import). Run from apps/backend:
 *
 *   npx tsx scripts/test-concurrent-import.ts overlap uidsFileA uidsFileB
 *   npx tsx scripts/test-concurrent-import.ts import uidsFile   # honors IMPORT_CONCURRENCY
 *
 * "overlap": simulates two users uploading near-simultaneously with
 * overlapping UIDs (+ one duplicate inside file B), runs the pre-check
 * mid-flight, and prints both summaries.
 * "import": one timed import of the given UIDs (for C=1 vs C=6 comparison).
 *
 * Exercises the exact production entry points (processStudentsFromExcelBuffer,
 * precheckStudentsFromExcelBuffer) including Excel parsing — the only thing
 * skipped is the HTTP/multer layer.
 */
import fs from "fs";
import ExcelJS from "exceljs";
import { connectRedis } from "@/config/redis.js";
import {
  processStudentsFromExcelBuffer,
  precheckStudentsFromExcelBuffer,
} from "@/features/user/services/refactor-old-migration.service.js";

async function buildXlsxBuffer(uids: string[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.addRow(["UID"]);
  for (const uid of uids) ws.addRow([uid]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

function readUids(path: string): string[] {
  return fs
    .readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

async function main() {
  const [mode, fileA, fileB] = process.argv.slice(2);
  await connectRedis();

  if (mode === "overlap") {
    const uidsA = readUids(fileA!);
    const uidsBRaw = readUids(fileB!);
    // Internal duplicate inside B: the first UID appears twice.
    const uidsB = [uidsBRaw[0]!, ...uidsBRaw];
    console.log(
      `[overlap] A=${uidsA.length} uids, B=${uidsB.length} rows (${new Set(uidsB).size} unique), overlap=${uidsA.filter((u) => uidsB.includes(u)).length}`,
    );

    const bufA = await buildXlsxBuffer(uidsA);
    const bufB = await buildXlsxBuffer(uidsB);

    const t0 = Date.now();
    const pA = processStudentsFromExcelBuffer(bufA, {
      uploaderName: "Tester A",
    });
    const pB = processStudentsFromExcelBuffer(bufB, {
      uploaderName: "Tester B",
    });

    // Pre-check mid-flight: B's UIDs should show as locked by Tester A/B.
    setTimeout(async () => {
      try {
        const pre = await precheckStudentsFromExcelBuffer(bufB);
        console.log(
          `[precheck @${Math.round((Date.now() - t0) / 1000)}s] inProgressByOthers=${pre.inProgressByOthers.length}:`,
          pre.inProgressByOthers
            .slice(0, 6)
            .map((x) => `${x.uid}<-${x.userName}`)
            .join(", "),
        );
      } catch (e) {
        console.error("[precheck] failed:", (e as Error).message);
      }
    }, 8000);

    const [ra, rb] = await Promise.all([pA, pB]);
    const secs = Math.round((Date.now() - t0) / 1000);
    console.log(`\n[overlap] done in ${secs}s`);
    for (const [label, r] of [
      ["A", ra],
      ["B", rb],
    ] as const) {
      console.log(
        `summary ${label}: processed=${r.processed} notFound=${r.notFound} errors=${r.errors.length}`,
      );
      for (const e of r.errors)
        console.log(`   [${label}] ${e.uid}: ${e.error}`);
    }
  } else if (mode === "import") {
    const uids = readUids(fileA!);
    const buf = await buildXlsxBuffer(uids);
    console.log(
      `[import] ${uids.length} uids, IMPORT_CONCURRENCY=${process.env.IMPORT_CONCURRENCY || "(default 4)"}`,
    );
    const t0 = Date.now();
    const r = await processStudentsFromExcelBuffer(buf, {
      uploaderName: "Timing Tester",
    });
    const secs = (Date.now() - t0) / 1000;
    console.log(
      `[import] done in ${secs.toFixed(1)}s (${(secs / uids.length).toFixed(1)}s/uid effective) processed=${r.processed} notFound=${r.notFound} errors=${r.errors.length}`,
    );
    for (const e of r.errors) console.log(`   ${e.uid}: ${e.error}`);
  } else if (mode === "precheck") {
    const uids = readUids(fileA!);
    const buf = await buildXlsxBuffer(uids);
    const pre = await precheckStudentsFromExcelBuffer(buf);
    console.log(
      `[precheck] totalUids=${pre.totalUids} existing=${pre.existingCount} new=${pre.newCount} inProgressByOthers=${pre.inProgressByOthers.length}`,
    );
    for (const l of pre.inProgressByOthers.slice(0, 10)) {
      console.log(`   locked: ${l.uid} <- ${l.userName} since ${l.startedAt}`);
    }
  } else {
    console.error(
      "usage: tsx scripts/test-concurrent-import.ts overlap A.txt B.txt | import A.txt | precheck A.txt",
    );
    process.exit(1);
  }

  // Give the fire-and-forget tracker broadcasts a moment, then exit.
  setTimeout(() => process.exit(0), 3000);
}

void main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
