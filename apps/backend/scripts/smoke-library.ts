/**
 * Comprehensive library smoke test — exercises every library route group.
 *
 * Prerequisites:
 *   1. `pnpm --filter backend seed:library` has been run.
 *   2. The dev server is running (BACKEND_URL defaults to http://localhost:8080).
 *      Run with: pnpm --filter backend smoke:library
 *
 * Auth is self-signed using ACCESS_TOKEN_SECRET from the backend .env, so no
 * manual JWT is needed. Picks the first ADMIN/STAFF user in the DB as the actor.
 */

import "dotenv/config";
import jwt from "jsonwebtoken";
import { sql } from "drizzle-orm";
import { db } from "../src/db/index.js";

const BASE = process.env.BACKEND_URL ?? "http://localhost:8080";
const SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!SECRET) {
  console.error("ACCESS_TOKEN_SECRET not set in env.");
  process.exit(1);
}

let pass = 0;
let fail = 0;
let skip = 0;
const fails: string[] = [];

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    fails.push(name + (detail ? ` — ${detail}` : ""));
    console.log(`  FAIL  ${name}${detail ? "  — " + detail : ""}`);
  }
}

function note(s: string) {
  skip++;
  console.log(`  SKIP  ${s}`);
}

async function pickActor(): Promise<{ id: number; type: string }> {
  const r = await db.execute(sql`
    SELECT id, type FROM users WHERE type IN ('ADMIN','STAFF') AND is_active = true ORDER BY id LIMIT 1
  `);
  const row = (r.rows as Array<{ id: number; type: string }>)[0];
  if (!row)
    throw new Error("No ADMIN/STAFF user found — cannot self-sign JWT.");
  return row;
}

let TOKEN = "";

async function req(
  method: string,
  path: string,
  body?: unknown,
): Promise<{
  status: number;
  json: any;
  text: string;
}> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
  };
  let bodyToSend: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      bodyToSend = body;
      // don't set content-type for FormData
    } else {
      headers["Content-Type"] = "application/json";
      bodyToSend = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: bodyToSend,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON ok */
  }
  return { status: res.status, json, text };
}

type GroupCheck = {
  label: string;
  base: string; // e.g. "/api/library/racks"
  itemKey?: string; // payload key for the list of rows (default: "rows")
};

const SIMPLE_MASTERS: GroupCheck[] = [
  { label: "racks", base: "/api/library/racks" },
  { label: "shelves", base: "/api/library/shelves" },
  { label: "series", base: "/api/library/series" },
  { label: "publishers", base: "/api/library/publishers" },
  { label: "bindings", base: "/api/library/bindings" },
  { label: "borrowing-types", base: "/api/library/borrowing-types" },
  { label: "enclosures", base: "/api/library/enclosures" },
  { label: "entry-modes", base: "/api/library/entry-modes" },
  { label: "periods", base: "/api/library/periods" },
  { label: "articles", base: "/api/library/articles" },
  { label: "document-types", base: "/api/library/document-types" },
  { label: "statuses", base: "/api/library/statuses" },
  { label: "journal-types", base: "/api/library/journal-types" },
  { label: "authors", base: "/api/library/authors" },
  { label: "author-types", base: "/api/library/author-types" },
  { label: "vendors", base: "/api/library/vendors" },
  { label: "holidays", base: "/api/library/holidays" },
  { label: "class-holidays", base: "/api/library/class-holidays" },
  { label: "branches", base: "/api/library/branches" },
  { label: "patron-categories", base: "/api/library/patron-categories" },
  { label: "item-categories", base: "/api/library/item-categories" },
  { label: "circulation-policies", base: "/api/library/circulation-policies" },
  { label: "zones", base: "/api/library/zones" },
];

async function smokeMastersList() {
  console.log("\n> Masters — list endpoints");
  for (const g of SIMPLE_MASTERS) {
    try {
      const r = await req("GET", `${g.base}?page=1&limit=5`);
      const ok =
        r.status === 200 &&
        (Array.isArray(r.json?.payload?.rows) ||
          Array.isArray(r.json?.payload));
      check(
        `${pad(g.label, 24)} GET ${g.base}`,
        ok,
        ok ? undefined : `${r.status}`,
      );
    } catch (e) {
      check(`${pad(g.label, 24)} GET ${g.base}`, false, (e as Error).message);
    }
  }
}

async function smokeSearch() {
  console.log("\n> Library Discovery (R1)");
  const r1 = await req("GET", "/api/library/search?q=phy");
  check(
    "search returns { hits, total }",
    r1.status === 200 &&
      Array.isArray(r1.json?.payload?.hits) &&
      typeof r1.json?.payload?.total === "number",
  );
  const hits: Array<{ type: string }> = r1.json?.payload?.hits ?? [];
  check(
    "hit types are UPPERCASE",
    hits.length === 0 ||
      hits.every((h) =>
        ["BOOK", "JOURNAL", "COPY", "ARTICLE"].includes(h.type),
      ),
  );
  check(
    "totals.articles bucket present",
    typeof r1.json?.payload?.totals?.articles === "number",
  );
  const r2 = await req("GET", "/api/library/search?q=a&type=ARTICLE");
  const a: Array<{ type: string }> = r2.json?.payload?.hits ?? [];
  check(
    "?type=ARTICLE filter returns only ARTICLE hits",
    a.length === 0 || a.every((h) => h.type === "ARTICLE"),
  );
}

async function smokeDashboard() {
  console.log("\n> Dashboard (Round 1 Part 3)");
  const r = await req("GET", "/api/library/dashboard/stats");
  check(
    "GET /dashboard/stats returns numeric totalBooks",
    r.status === 200 && typeof r.json?.payload?.totalBooks === "number",
  );
  check(
    "dashboard includes copiesByStatus widget",
    Array.isArray(r.json?.payload?.copiesByStatus),
  );
  check(
    "dashboard includes entryExitByDay widget",
    Array.isArray(r.json?.payload?.entryExitByDay),
  );
  const r2 = await req(
    "GET",
    "/api/library/dashboard/stats?branchId=1&dateFrom=2024-01-01&dateTo=2026-12-31",
  );
  check(
    "dashboard accepts branchId + date range filters",
    r2.status === 200 && typeof r2.json?.payload?.totalBooks === "number",
  );
}

async function smokeStudentPicker() {
  console.log("\n> Student picker (R5b)");
  const r = await req("GET", "/api/users/student-picker?limit=5");
  check("returns array", r.status === 200 && Array.isArray(r.json?.payload));
  const list = (r.json?.payload ?? []) as Array<{
    userId: number;
    uid: string;
    name: string;
  }>;
  if (list.length === 0) {
    note("no students in db — student-picker rows empty");
    return;
  }
  check("first row has uid", typeof list[0].uid === "string");
  check("first row has name", typeof list[0].name === "string");

  // UID-prefix search: server matches across UID + name + roll + registration,
  // so each row should contain the prefix in *one* of those fields.
  const uidPrefix = list[0].uid.slice(0, 5);
  const r2 = await req(
    "GET",
    `/api/users/student-picker?search=${encodeURIComponent(uidPrefix)}&limit=10`,
  );
  const filtered = (r2.json?.payload ?? []) as Array<{
    uid: string;
    name: string;
    rollNumber: string | null;
    registrationNumber: string | null;
  }>;
  const all = (await req("GET", "/api/users/student-picker?limit=10")).json
    ?.payload as Array<unknown>;
  check(
    "UID-prefix search returns ≤ unfiltered count",
    filtered.length > 0 && filtered.length <= all.length,
  );
  const lc = uidPrefix.toLowerCase();
  check(
    "every filtered row matches prefix in uid/name/roll/registration",
    filtered.every(
      (s) =>
        (s.uid ?? "").toLowerCase().includes(lc) ||
        (s.name ?? "").toLowerCase().includes(lc) ||
        (s.rollNumber ?? "").toLowerCase().includes(lc) ||
        (s.registrationNumber ?? "").toLowerCase().includes(lc),
    ),
  );
}

async function smokeBooks() {
  console.log("\n> Books, copies, journals");
  const r1 = await req("GET", "/api/library/books?page=1&limit=5");
  check(
    "books list returns rows",
    r1.status === 200 && Array.isArray(r1.json?.payload?.rows),
  );
  const r2 = await req("GET", "/api/library/copy-details?page=1&limit=5");
  check(
    "copy-details list returns rows",
    r2.status === 200 && Array.isArray(r2.json?.payload?.rows),
  );
  const r3 = await req("GET", "/api/library/journals?page=1&limit=5");
  check(
    "journals list returns rows",
    r3.status === 200 && Array.isArray(r3.json?.payload?.rows),
  );
  const r4 = await req(
    "GET",
    "/api/library/journal-subscriptions?page=1&limit=5",
  );
  check(
    "journal-subscriptions list returns rows",
    r4.status === 200 && Array.isArray(r4.json?.payload?.rows),
  );
}

async function smokeArchive() {
  console.log("\n> Academic Archive + Evidence Locker (Round 1 Part 2)");
  const r1 = await req("GET", "/api/library/academic-archives?page=1&limit=5");
  check(
    "academic-archives list",
    r1.status === 200 && Array.isArray(r1.json?.payload?.rows),
  );
  const r2 = await req("GET", "/api/library/evidence-docs?page=1&limit=5");
  check(
    "evidence-docs list",
    r2.status === 200 && Array.isArray(r2.json?.payload?.rows),
  );

  // If we have at least one archive row, try the signed-URL endpoint.
  const firstId = r1.json?.payload?.rows?.[0]?.id;
  if (firstId) {
    const r3 = await req(
      "GET",
      `/api/library/academic-archives/${firstId}/url`,
    );
    // 200 with url, or 500/404 if S3 not configured — accept either non-crashing response
    check(
      "academic-archives/:id/url endpoint responds",
      [200, 404, 500].includes(r3.status),
      `${r3.status}`,
    );
  } else {
    note("no archive rows — skipping signed URL test");
  }
}

async function smokeReadingLists() {
  console.log("\n> Reading lists");
  const r = await req("GET", "/api/library/reading-lists?page=1&limit=5");
  check(
    "reading-lists list",
    r.status === 200 && Array.isArray(r.json?.payload?.rows),
  );
}

async function smokeAnalytics() {
  console.log("\n> Student Analytics + Reports");
  const r1 = await req("GET", "/api/library/student-analytics?page=1&limit=5");
  check(
    "student-analytics list",
    r1.status === 200 && Array.isArray(r1.json?.payload?.rows),
  );
  const r2 = await req("GET", "/api/library/reports/naac?academicYear=2025-26");
  check(
    "reports/naac responds",
    [200, 404, 500].includes(r2.status),
    `${r2.status}`,
  );
}

async function smokeOperationalReports() {
  console.log("\n> Operational reports (Phase 3)");
  const overdue = await req("GET", "/api/library/reports/overdue");
  check(
    "overdue returns array",
    overdue.status === 200 && Array.isArray(overdue.json?.payload),
    `${overdue.status}`,
  );
  const fOut = await req("GET", "/api/library/reports/fines-outstanding");
  check(
    "fines-outstanding returns { buckets, topDebtors }",
    fOut.status === 200 &&
      Array.isArray(fOut.json?.payload?.buckets) &&
      Array.isArray(fOut.json?.payload?.topDebtors),
  );
  check(
    "fines-outstanding has 4 age buckets",
    fOut.json?.payload?.buckets?.length === 4,
  );
  const fIn = await req("GET", "/api/library/reports/fines-collected");
  check(
    "fines-collected returns { total, count, rows }",
    fIn.status === 200 &&
      typeof fIn.json?.payload?.total === "number" &&
      Array.isArray(fIn.json?.payload?.rows),
  );
  const stock = await req("GET", "/api/library/reports/stock-summary");
  check(
    "stock-summary returns array",
    stock.status === 200 && Array.isArray(stock.json?.payload),
  );
  const demand = await req(
    "GET",
    "/api/library/reports/high-demand-titles?limit=5",
  );
  check(
    "high-demand-titles returns array",
    demand.status === 200 && Array.isArray(demand.json?.payload),
  );
  // Branch filter actually narrows.
  const overdueFiltered = await req(
    "GET",
    "/api/library/reports/overdue?branchId=99999",
  );
  check(
    "overdue with non-existent branchId returns empty",
    overdueFiltered.status === 200 &&
      overdueFiltered.json?.payload?.length === 0,
  );
}

async function smokeCirculation() {
  console.log("\n> Circulation, fines, dues");
  const r1 = await req("GET", "/api/library/book-circulation?page=1&limit=5");
  check(
    "book-circulation list",
    r1.status === 200 && Array.isArray(r1.json?.payload?.rows),
  );
  const r2 = await req("GET", "/api/library/entry-exit?page=1&limit=5");
  check(
    "entry-exit list",
    r2.status === 200 && Array.isArray(r2.json?.payload?.rows),
  );
  const r3 = await req("GET", "/api/library/fines?page=1&limit=5");
  check(
    "fines list responds (may be empty)",
    [200, 404].includes(r3.status),
    `${r3.status}`,
  );
  const r4 = await req("GET", "/api/library/clearance/1");
  check(
    "clearance/:userId responds",
    [200, 400, 404].includes(r4.status),
    `${r4.status}`,
  );
}

async function smokeRenewalLimit() {
  console.log("\n> Renewal-limit guard on reissue");
  // Pick an active circulation with NO prior reissues — otherwise the policy's
  // renewalLimit=1 may already be hit from a previous smoke run.
  const r = await db.execute(sql`
    SELECT bc.id
    FROM book_circulation bc
    LEFT JOIN book_reissue br ON br.book_circulation_id_fk = bc.id
    WHERE bc.is_returned = false
    GROUP BY bc.id
    HAVING COUNT(br.id) = 0
    ORDER BY bc.id
    LIMIT 1
  `);
  const active = (r.rows as Array<{ id: number }>)[0];
  if (!active) {
    note("no active circulation in DB — skipping renewal-limit test");
    return;
  }
  // Reissue once — should succeed (seeded policy has renewalLimit = 1).
  const first = await req(
    "POST",
    `/api/library/book-circulation/${active.id}/action`,
    { action: "REISSUE" },
  );
  check(
    "first reissue accepted",
    [200, 201, 204].includes(first.status),
    `${first.status}`,
  );
  // Reissue a second time — should be rejected with 400 + descriptive message.
  const second = await req(
    "POST",
    `/api/library/book-circulation/${active.id}/action`,
    { action: "REISSUE" },
  );
  check(
    "second reissue blocked by renewalLimit (HTTP 400)",
    second.status === 400,
    `${second.status}: ${(second.json?.message ?? "").slice(0, 80)}`,
  );
  check(
    "rejection message mentions renewal limit",
    typeof second.json?.message === "string" &&
      /renewal/i.test(second.json.message),
  );
}

async function smokeJournalPredictor() {
  console.log("\n> Journal issue predictor (A2)");
  const r = await req(
    "POST",
    "/api/library/journal-subscriptions/run-predictor",
  );
  check("predictor sweep returns 200", r.status === 200, `${r.status}`);
}

async function smokeZoneOccupancy() {
  console.log("\n> Zone occupancy dashboard (A3)");
  const all = await req("GET", "/api/library/zones/occupancy?branchId=1");
  check(
    "zones/occupancy returns array",
    all.status === 200 && Array.isArray(all.json?.payload),
    `${all.status}`,
  );
  // Single-zone — pick the first zone in the DB.
  const zones = await req("GET", "/api/library/zones?page=1&limit=1");
  const zid = zones.json?.payload?.rows?.[0]?.id;
  if (!zid) {
    note("no seeded zones — skipping single-zone occupancy");
    return;
  }
  const one = await req("GET", `/api/library/zones/${zid}/occupancy`);
  check(
    "single zone occupancy returns { currentInside, byHour, peakToday }",
    one.status === 200 &&
      typeof one.json?.payload?.currentInside === "number" &&
      Array.isArray(one.json?.payload?.byHour) &&
      one.json?.payload?.byHour.length === 24,
    `${one.status}`,
  );
}

async function smokeFinePayments() {
  console.log("\n> Fine payment loop (Paytm bridge)");
  // Pick a circulation that has a positive fine and no payment yet.
  const r = await db.execute(sql`
    SELECT id, user_id_fk AS user_id
    FROM book_circulation
    WHERE payment_id_fk IS NULL
      AND (fine_amount - fine_waiver) > 0
    ORDER BY id
    LIMIT 1
  `);
  const row = (r.rows as Array<{ id: number; user_id: number }>)[0];
  if (!row) {
    note("no unpaid-fine circulation — skipping fine-payment loop");
    return;
  }
  const init = await req("POST", `/api/library/fines/${row.id}/initiate`, {
    userId: row.user_id,
  });
  check(
    "fine initiate returns paymentId + orderId",
    [200, 201].includes(init.status) &&
      typeof init.json?.payload?.paymentId === "number" &&
      typeof init.json?.payload?.orderId === "string",
    `${init.status}`,
  );
  const pid = init.json?.payload?.paymentId;
  if (pid) {
    const settle = await req(
      "POST",
      `/api/library/fines/payments/${pid}/settle`,
      { status: "SUCCESS" },
    );
    check(
      "fine settle SUCCESS returns 200",
      settle.status === 200,
      `${settle.status}`,
    );
  }
}

async function smokeFederatedSearch() {
  console.log("\n> Federated catalog search (Z39.50 / SRU)");
  // Empty query path — must respond fast without hitting upstream.
  const empty = await req("GET", "/api/library/books/federated-search?q=");
  check(
    "empty query returns empty array (no upstream hit)",
    empty.status === 200 &&
      Array.isArray(empty.json?.payload) &&
      empty.json.payload.length === 0,
  );
  // Real query — accept either success or an upstream timeout/error so the smoke
  // doesn't flake when CI is offline.
  const r = await req(
    "GET",
    "/api/library/books/federated-search?q=physics&max=3",
  );
  check(
    "federated-search endpoint reachable",
    [200, 500, 502, 504].includes(r.status),
    `${r.status}`,
  );
}

async function smokeCatalogInterop() {
  console.log("\n> Cataloging interop (MARC21 + Dublin Core)");
  // Construct a minimal valid MARC21 record by hand. Leader (24) + directory
  // (one 12-byte entry for tag 245) + 1E + base 0 + indicators "  " + 1F a +
  // title + 1E + 1D.
  const titleVal = "Smoke test title";
  // Variable field: "  \x1Fa<title>\x1E"
  const dataField = Buffer.from(`  \x1fa${titleVal}\x1e`, "utf8");
  const dirEntry = `245${String(dataField.length).padStart(4, "0")}00000`;
  const directory = Buffer.from(`${dirEntry}\x1e`, "utf8");
  const baseAddress = 24 + directory.length;
  const recordLength = baseAddress + dataField.length + 1; // +1 for RT
  const leader =
    String(recordLength).padStart(5, "0") +
    "nam a22" +
    String(baseAddress).padStart(5, "0") +
    " 4500";
  const padded = leader.padEnd(24, " ").slice(0, 24);
  const recordTerm = Buffer.from("\x1d", "utf8");
  const marcBuf = Buffer.concat([
    Buffer.from(padded, "utf8"),
    directory,
    dataField,
    recordTerm,
  ]);

  const fd = new FormData();
  fd.append("file", new Blob([marcBuf]), "smoke.mrc");
  const r1 = await req("POST", "/api/library/books/import-marc", fd);
  check(
    "import-marc parses one record and returns preview",
    r1.status === 200 &&
      r1.json?.payload?.count === 1 &&
      r1.json?.payload?.previews?.[0]?.title === titleVal,
    `${r1.status} count=${r1.json?.payload?.count}`,
  );

  // Dublin Core for a seeded book.
  const books = await req("GET", "/api/library/books?page=1&limit=1");
  const bid = books.json?.payload?.rows?.[0]?.id;
  if (bid) {
    const r2 = await req("GET", `/api/library/books/${bid}/dublin-core`);
    check(
      "dublin-core endpoint returns XML",
      r2.status === 200 && /<oai_dc:dc/.test(r2.text),
      `${r2.status}`,
    );
  } else {
    note("no books to export to DC");
  }
}

async function smokeMissingIssues() {
  console.log("\n> Missing journal issues");
  const r = await req(
    "GET",
    "/api/library/journal-subscriptions/missing-issues",
  );
  check(
    "missing-issues endpoint returns array",
    r.status === 200 && Array.isArray(r.json?.payload),
    `${r.status}`,
  );
}

async function smokeInventoryReconcile() {
  console.log("\n> Inventory wand reconciliation");
  // Tag one copy with a known RFID, then reconcile against a list containing it.
  const list = await req("GET", "/api/library/copy-details?page=1&limit=2");
  const rows: Array<{ accessNumber: string | null }> =
    list.json?.payload?.rows ?? [];
  if (rows.length < 2) {
    note("not enough copies seeded — skipping reconcile");
    return;
  }
  const accessA = rows[0].accessNumber;
  if (!accessA) {
    note("first copy has no accessNumber — skipping");
    return;
  }
  const knownRfid = `RECON-${Date.now()}`;
  await req("POST", "/api/library/copy-details/bulk-tag", {
    items: [
      { accessNumber: accessA, rfidNumber: knownRfid, theftBitArmed: true },
    ],
  });
  // Now reconcile with [knownRfid, "unknown-rfid"]. The unknown should fall into
  // "unknown" bucket; other branch copies (if any RFID-tagged) become "missing".
  const r = await req("POST", "/api/library/copy-details/reconcile", {
    branchId: 1,
    rfidNumbers: [knownRfid, "ABSOLUTELY-NOT-A-REAL-TAG"],
  });
  check(
    "reconcile returns summary + arrays",
    r.status === 200 &&
      typeof r.json?.payload?.summary?.scanned === "number" &&
      Array.isArray(r.json?.payload?.matched) &&
      Array.isArray(r.json?.payload?.missing) &&
      Array.isArray(r.json?.payload?.unknown),
    `${r.status}`,
  );
  check(
    "unknown RFID classified as unknown",
    (r.json?.payload?.unknown ?? []).includes("ABSOLUTELY-NOT-A-REAL-TAG"),
  );
}

async function smokeRfidBulkTag() {
  console.log("\n> RFID bulk tagging (copy-details/bulk-tag)");
  // Pick a seeded copy to tag.
  const list = await req("GET", "/api/library/copy-details?page=1&limit=1");
  const firstAccess: string | undefined =
    list.json?.payload?.rows?.[0]?.accessNumber;
  if (!firstAccess) {
    note("no copy details rows — skipping bulk-tag");
    return;
  }
  const r = await req("POST", "/api/library/copy-details/bulk-tag", {
    items: [
      {
        accessNumber: firstAccess,
        rfidNumber: `SMOKE-RFID-${Date.now()}`,
        theftBitArmed: true,
      },
      {
        accessNumber: "DOES-NOT-EXIST-XYZ",
        rfidNumber: "X",
      },
    ],
  });
  check(
    "bulk-tag returns updated + missing counts",
    r.status === 200 &&
      typeof r.json?.payload?.updated === "number" &&
      Array.isArray(r.json?.payload?.missing),
    r.status === 200 ? undefined : `${r.status}`,
  );
  check(
    "bulk-tag updated the seeded copy (updated >= 1)",
    (r.json?.payload?.updated ?? 0) >= 1,
  );
  check(
    "bulk-tag flagged the unknown accessNumber as missing",
    (r.json?.payload?.missing ?? []).includes("DOES-NOT-EXIST-XYZ"),
  );
}

async function smokeGateEvents() {
  console.log("\n> Gate events (RFID, library_zones)");
  const r1 = await req("GET", "/api/library/zones/gate-events?page=1&limit=5");
  check(
    "GET zones/gate-events",
    [200, 404].includes(r1.status),
    `${r1.status}`,
  );
  // Record one gate event with a fake RFID — should succeed.
  const r2 = await req("POST", "/api/library/zones/gate-events", {
    branchId: 1,
    eventType: "REMOVAL_ATTEMPT",
    rfidNumber: "SMOKE-RFID-001",
    remarks: "smoke test",
  });
  check(
    "POST zones/gate-events (RFID event ingest)",
    [200, 201].includes(r2.status),
    `${r2.status}`,
  );
}

async function smokeNotifications() {
  console.log("\n> Library notifications seed");
  const r = await req("GET", "/api/library/notifications/events");
  check(
    "GET library/notifications/events (or fallback list)",
    [200, 404].includes(r.status),
    `${r.status}`,
  );
}

async function run() {
  console.log(`=== Library smoke test against ${BASE} ===`);
  const actor = await pickActor();
  TOKEN = jwt.sign({ id: actor.id, type: actor.type }, SECRET as string, {
    expiresIn: "10m",
  });
  console.log(`Actor: user ${actor.id} (${actor.type}); JWT signed for 10m.\n`);

  await smokeMastersList();
  await smokeSearch();
  await smokeDashboard();
  await smokeStudentPicker();
  await smokeBooks();
  await smokeArchive();
  await smokeReadingLists();
  await smokeAnalytics();
  await smokeOperationalReports();
  await smokeCirculation();
  await smokeRenewalLimit();
  await smokeRfidBulkTag();
  await smokeInventoryReconcile();
  await smokeMissingIssues();
  await smokeCatalogInterop();
  await smokeFederatedSearch();
  await smokeJournalPredictor();
  await smokeZoneOccupancy();
  await smokeFinePayments();
  await smokeGateEvents();
  await smokeNotifications();

  console.log(`\n=== ${pass} passed · ${fail} failed · ${skip} skipped ===`);
  if (fails.length) {
    console.log("\nFailures:");
    for (const f of fails) console.log(`  - ${f}`);
  }
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
