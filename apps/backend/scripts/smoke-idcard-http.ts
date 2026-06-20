/**
 * idcard HTTP smoke — hits the live /api/idcard endpoints with a self-signed JWT.
 * Run with:
 *   pnpm --filter backend dev   (in another shell)
 *   pnpm --filter backend smoke:idcard:http
 */

import "dotenv/config";
import { Blob } from "node:buffer";
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
const fails: string[] = [];
let TOKEN = "";

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    fails.push(name + (detail ? ` — ${detail}` : ""));
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function req(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
    ...extraHeaders,
  };
  let bodyToSend: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      bodyToSend = body as unknown as BodyInit;
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
    /* non-JSON */
  }
  return { status: res.status, json, text };
}

async function pickActor() {
  const r = await db.execute(sql`
    SELECT id, type FROM users WHERE type IN ('ADMIN','STAFF') AND is_active = true ORDER BY id LIMIT 1
  `);
  const row = (r.rows as Array<{ id: number; type: string }>)[0];
  if (!row)
    throw new Error("No ADMIN/STAFF user found — cannot self-sign JWT.");
  return row;
}

async function pickAcademicYearAndStudent() {
  const ay = await db.execute(
    sql`SELECT id FROM academic_years ORDER BY id DESC LIMIT 1`,
  );
  const st = await db.execute(
    sql`SELECT id, uid FROM students ORDER BY id DESC LIMIT 1`,
  );
  const academicYearId = (ay.rows[0] as { id: number } | undefined)?.id;
  const student = st.rows[0] as { id: number; uid: string } | undefined;
  if (!academicYearId || !student) throw new Error("Missing seed data.");
  return { academicYearId, student };
}

function tinyPngBuffer() {
  // 1×1 transparent PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  );
}

async function run() {
  console.log(`=== idcard HTTP smoke against ${BASE} ===`);
  const actor = await pickActor();
  TOKEN = jwt.sign({ id: actor.id, type: actor.type }, SECRET as string, {
    expiresIn: "10m",
  });
  console.log(`Actor: user ${actor.id} (${actor.type})`);

  const { academicYearId, student } = await pickAcademicYearAndStudent();
  console.log(
    `Using academicYearId=${academicYearId} studentId=${student.id} uid=${student.uid}`,
  );

  // 1. Auth gate
  const noAuth = await fetch(`${BASE}/api/idcard/templates`);
  check("401 without auth", noAuth.status === 401, `got ${noAuth.status}`);

  // 2. Empty list ok
  const listEmpty = await req(
    "GET",
    `/api/idcard/templates?academicYearId=${academicYearId}`,
  );
  check("GET /templates (auth) returns 200", listEmpty.status === 200);

  // 3. Create template (multipart)
  const png = tinyPngBuffer();
  const tplName = `HTTP-SMOKE-${Date.now()}`;
  const fd = new FormData();
  fd.append("academicYearId", String(academicYearId));
  fd.append("name", tplName);
  fd.append("description", "http smoke");
  fd.append("canvasWidthPx", "600");
  fd.append("canvasHeightPx", "900");
  fd.append("qrcodeSize", "80");
  fd.append("validFrom", "2026-01-01");
  fd.append("validTill", "2026-12-31");
  fd.append("isDefault", "false");
  fd.append(
    "templateImage",
    new Blob([png], { type: "image/png" }) as unknown as globalThis.Blob,
    "smoke.png",
  );
  const createTpl = await req("POST", "/api/idcard/templates", fd);
  const acceptable = [201, 500];
  check(
    "POST /templates returns 201 (200 if AWS not configured may 500)",
    acceptable.includes(createTpl.status),
    `status=${createTpl.status} body=${createTpl.text.slice(0, 200)}`,
  );

  const templateId = createTpl.json?.payload?.id as number | undefined;
  if (!templateId) {
    console.log(
      "  Template creation requires AWS_S3_BUCKET; skipping further endpoints.",
    );
    if (fail > 0) process.exit(1);
    process.exit(0);
  }

  // 4. Get template
  const getTpl = await req("GET", `/api/idcard/templates/${templateId}`);
  check("GET /templates/:id returns 200", getTpl.status === 200);
  check(
    "fetched template has fields array",
    Array.isArray(getTpl.json?.payload?.fields),
  );

  // 5. Upsert fields
  const upsert = await req(
    "PUT",
    `/api/idcard/templates/${templateId}/fields`,
    {
      fields: [
        { fieldKey: "NAME", x: 320, y: 580 },
        { fieldKey: "UID", x: 215, y: 680 },
        { fieldKey: "PHOTO", x: 200, y: 100, width: 225, height: 250 },
      ],
    },
  );
  check("PUT /templates/:id/fields returns 200", upsert.status === 200);
  check(
    "fields upsert returned 3 rows",
    Array.isArray(upsert.json?.payload) && upsert.json.payload.length === 3,
  );

  // 6. List fields
  const listFields = await req(
    "GET",
    `/api/idcard/templates/${templateId}/fields`,
  );
  check(
    "GET /templates/:id/fields lists rows",
    listFields.status === 200 && Array.isArray(listFields.json?.payload),
  );

  // 7. Most recent issue for student (likely null)
  const recent = await req(
    "GET",
    `/api/idcard/students/${student.id}/most-recent-issue`,
  );
  check("GET most-recent-issue returns 200", recent.status === 200);

  // 8. Create issue (multipart)
  const issueFd = new FormData();
  issueFd.append("studentId", String(student.id));
  issueFd.append("templateId", String(templateId));
  issueFd.append("issueStatus", "ISSUED");
  issueFd.append("rfidNumber", `SMOKE-HTTP-${Date.now()}`);
  issueFd.append("nameSnapshot", "Smoke Tester");
  issueFd.append("uidSnapshot", student.uid);
  issueFd.append(
    "frontImage",
    new Blob([png], { type: "image/png" }) as unknown as globalThis.Blob,
    "front.png",
  );
  issueFd.append(
    "photoImage",
    new Blob([png], { type: "image/png" }) as unknown as globalThis.Blob,
    "photo.png",
  );
  const createIssue = await req("POST", "/api/idcard/issues", issueFd);
  check(
    "POST /issues returns 201",
    createIssue.status === 201,
    `body=${createIssue.text.slice(0, 200)}`,
  );
  const issueId = createIssue.json?.payload?.id as number | undefined;

  if (issueId) {
    // 9. Read issue
    const readIssue = await req("GET", `/api/idcard/issues/${issueId}`);
    check("GET /issues/:id returns 200", readIssue.status === 200);

    // 10. List issues
    const listIssues = await req(
      "GET",
      `/api/idcard/issues?studentId=${student.id}`,
    );
    check(
      "GET /issues filters by studentId",
      listIssues.status === 200 &&
        Array.isArray(listIssues.json?.payload?.rows),
    );

    // Cleanup issue
    await req("DELETE", `/api/idcard/issues/${issueId}`);
  }

  // Cleanup template
  const del = await req("DELETE", `/api/idcard/templates/${templateId}`);
  check("DELETE /templates/:id returns 200", del.status === 200);

  console.log(`\n[ summary ]  pass=${pass}  fail=${fail}`);
  if (fail > 0) {
    fails.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
  process.exit(0);
}

run().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
