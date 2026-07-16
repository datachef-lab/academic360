/**
 * Unified student-avatar resolver.
 *
 * Walks the chain: S3 (by uid → previous uid) → snapcard legacy
 * (`besc.academic360.app/id-card-generate`) → hrclIRP image host
 * (`74.207.233.48:8443`). The first source that yields a real image wins.
 * Callers get back the bytes + content type, or null so they can render
 * initials client-side.
 */

import https from "node:https";
import { URL } from "node:url";
import { desc, eq, or } from "drizzle-orm";

import { db } from "@/db/index.js";
import { getBufferFromS3 } from "@/services/s3.service.js";
import { idCardIssueModel, studentModel } from "@repo/db/schemas/index.js";

export type AvatarHit = {
  buffer: Buffer;
  contentType: string;
  source: "s3" | "besc" | "hrclirp";
  uidUsed: string;
};

const BESC_URL = (uid: string) =>
  `https://besc.academic360.app/id-card-generate/api/images?crop=true&uid=${encodeURIComponent(uid)}`;

// The legacy hrclIRP image host serves with a self-signed cert — accept it
// only when reaching out of this resolver (never trust globally).
const HRCLIRP_URL = (uid: string) =>
  `https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${encodeURIComponent(uid)}.jpg`;

const guessContentType = (key: string): string => {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
};

function fetchHttps(
  url: string,
  options: { rejectUnauthorized?: boolean; timeoutMs?: number } = {},
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request(
        {
          method: "GET",
          hostname: parsed.hostname,
          port: parsed.port || 443,
          path: `${parsed.pathname}${parsed.search}`,
          // We intentionally accept self-signed certs only when the caller
          // says so — used for the legacy on-prem image host.
          rejectUnauthorized: options.rejectUnauthorized !== false,
          headers: { Accept: "image/*,*/*;q=0.1" },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            // Follow a single redirect; bail if it goes more than one hop.
            const next = new URL(res.headers.location, url).toString();
            res.resume();
            fetchHttps(next, { ...options, timeoutMs: options.timeoutMs }).then(
              resolve,
              () => resolve(null),
            );
            return;
          }
          if (
            !res.statusCode ||
            res.statusCode < 200 ||
            res.statusCode >= 300
          ) {
            res.resume();
            resolve(null);
            return;
          }
          const contentType = (
            (res.headers["content-type"] as string | undefined) ?? "image/jpeg"
          ).split(";")[0];
          if (!contentType.startsWith("image/")) {
            res.resume();
            resolve(null);
            return;
          }
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.byteLength < 200) {
              resolve(null);
              return;
            }
            resolve({ buffer, contentType });
          });
          res.on("error", () => resolve(null));
        },
      );
      req.setTimeout(options.timeoutMs ?? 4000, () => {
        req.destroy();
        resolve(null);
      });
      req.on("error", () => resolve(null));
      req.end();
    } catch {
      resolve(null);
    }
  });
}

async function s3PhotoForUid(uid: string): Promise<AvatarHit | null> {
  const [hit] = await db
    .select({
      key: idCardIssueModel.photoImageKey,
      uid: studentModel.uid,
    })
    .from(idCardIssueModel)
    .innerJoin(studentModel, eq(studentModel.id, idCardIssueModel.studentId))
    .where(or(eq(studentModel.uid, uid), eq(studentModel.previousUid, uid)))
    .orderBy(desc(idCardIssueModel.issueDate))
    .limit(1);
  if (!hit?.key) return null;
  const buf = await getBufferFromS3(hit.key);
  if (!buf || buf.byteLength < 200) return null;
  return {
    buffer: buf,
    contentType: guessContentType(hit.key),
    source: "s3",
    uidUsed: hit.uid ?? uid,
  };
}

async function externalForUid(uid: string): Promise<AvatarHit | null> {
  const besc = await fetchHttps(BESC_URL(uid), { rejectUnauthorized: true });
  if (besc) return { ...besc, source: "besc", uidUsed: uid };
  const hrcl = await fetchHttps(HRCLIRP_URL(uid), {
    rejectUnauthorized: false,
  });
  if (hrcl) return { ...hrcl, source: "hrclirp", uidUsed: uid };
  return null;
}

async function resolveSiblingUids(uid: string): Promise<string[]> {
  const [row] = await db
    .select({
      uid: studentModel.uid,
      previousUid: studentModel.previousUid,
    })
    .from(studentModel)
    .where(or(eq(studentModel.uid, uid), eq(studentModel.previousUid, uid)))
    .limit(1);
  if (!row) return [];
  const out = [row.previousUid, row.uid].filter(
    (v): v is string => !!v && v !== uid,
  );
  return Array.from(new Set(out));
}

/**
 * Resolver-backed data URL for server-side PDF / ZIP / template rendering.
 * Returns null if every fallback in the chain misses.
 */
export async function resolveStudentAvatarDataUrl(
  uid: string,
): Promise<string | null> {
  const hit = await resolveStudentAvatar(uid);
  if (!hit) return null;
  return `data:${hit.contentType};base64,${hit.buffer.toString("base64")}`;
}

/**
 * Resolver-backed raw buffer for callers that need the bytes (e.g. zipping
 * captured images for batch exports).
 */
export async function resolveStudentAvatarBuffer(
  uid: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const hit = await resolveStudentAvatar(uid);
  if (!hit) return null;
  return { buffer: hit.buffer, contentType: hit.contentType };
}

export async function resolveStudentAvatar(
  uid: string,
): Promise<AvatarHit | null> {
  const cleaned = uid.trim();
  if (!cleaned) return null;

  // Round 1: current UID — S3, then external sources.
  const fromS3 = await s3PhotoForUid(cleaned);
  if (fromS3) return fromS3;
  const fromExternal = await externalForUid(cleaned);
  if (fromExternal) return fromExternal;

  // Round 2: each known previous UID — S3, then external sources.
  const siblings = await resolveSiblingUids(cleaned);
  for (const sibling of siblings) {
    const s3 = await s3PhotoForUid(sibling);
    if (s3) return s3;
    const ext = await externalForUid(sibling);
    if (ext) return ext;
  }

  return null;
}
