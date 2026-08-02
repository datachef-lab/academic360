const base =
  "/Users/harsh/Developer/tech-sahyogi-innoventures/academic360/apps/backend/dist/apps/backend/src";
const { loadLibrary } = await import(
  `${base}/features/library/old-irp-data.js`
);
for (const [table, n] of [
  ["copydetailsub", 300],
  ["bookentry", 300],
  ["issuereturn", 200],
]) {
  const t0 = Date.now();
  const r = await loadLibrary({ limitPerTable: n, onlyTables: [table] });
  const secs = (Date.now() - t0) / 1000;
  const row = r.tables[0];
  console.log(
    `${table}: ${row.selected} rows in ${secs.toFixed(1)}s = ${(row.selected / secs).toFixed(1)} rows/s (loaded ${row.loaded}, skipped ${row.failed})`,
  );
}
process.exit(0);
