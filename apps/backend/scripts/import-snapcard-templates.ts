/**
 * One-shot import: snapcard's id_card_templates rows + template JPEGs → local DB + S3.
 *
 * Inputs (already on this machine):
 *   /tmp/snapcard-templates.ndjson           — one row_to_json line per template
 *   /tmp/snapcard-templates-images/<id>.jpeg — front template image, by snapcard id
 *
 * Behaviour:
 *   - Maps snapcard's `admission_year` string → local academic_years.year (best match).
 *   - Skips if a template with the same (academicYearId, name) already exists.
 *   - Uploads the JPEG to S3 (idcard/templates/snapcard-<id>.jpeg).
 *   - Inserts into id_card_templates and id_card_template_fields (one row per JSON coord).
 *
 * Run: pnpm --filter backend exec tsx scripts/import-snapcard-templates.ts
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../src/db/index.js";
import {
  academicYearModel,
  idCardTemplateFieldModel,
  idCardTemplateModel,
} from "@repo/db/schemas/index.js";
import { uploadToS3 } from "../src/services/s3.service.js";

const NDJSON = "/tmp/snapcard-templates.ndjson";
const IMG_DIR = "/tmp/snapcard-templates-images";

type SnapcardCoord = { x: number; y: number };
type SnapcardPhoto = { x: number; y: number; width: number; height: number };

type SnapcardTemplate = {
  id: number;
  admission_year: string;
  name_coordinates: SnapcardCoord;
  course_coordinates: SnapcardCoord;
  uid_coordinates: SnapcardCoord;
  mobile_coordinates: SnapcardCoord;
  bloodGroup_coordinates: SnapcardCoord;
  sports_quota_coordinates: SnapcardCoord;
  qrcode_coordinates: SnapcardCoord;
  qrcode_size: number;
  valid_till_date_coordinates: SnapcardCoord | null;
  photo_dimensions: SnapcardPhoto;
  disabled: boolean | null;
  createdAt: string;
  updatedAt: string;
};

const FIELD_MAP: Array<{
  key:
    | "NAME"
    | "COURSE"
    | "UID"
    | "MOBILE"
    | "BLOOD_GROUP"
    | "SPORTS_QUOTA"
    | "QRCODE"
    | "VALID_TILL_DATE"
    | "PHOTO";
  pick: (
    t: SnapcardTemplate,
  ) => { x: number; y: number; width?: number; height?: number } | null;
}> = [
  { key: "NAME", pick: (t) => t.name_coordinates ?? null },
  { key: "COURSE", pick: (t) => t.course_coordinates ?? null },
  { key: "UID", pick: (t) => t.uid_coordinates ?? null },
  { key: "MOBILE", pick: (t) => t.mobile_coordinates ?? null },
  { key: "BLOOD_GROUP", pick: (t) => t.bloodGroup_coordinates ?? null },
  { key: "SPORTS_QUOTA", pick: (t) => t.sports_quota_coordinates ?? null },
  { key: "QRCODE", pick: (t) => t.qrcode_coordinates ?? null },
  {
    key: "VALID_TILL_DATE",
    pick: (t) => t.valid_till_date_coordinates ?? null,
  },
  {
    key: "PHOTO",
    pick: (t) =>
      t.photo_dimensions
        ? {
            x: t.photo_dimensions.x,
            y: t.photo_dimensions.y,
            width: t.photo_dimensions.width,
            height: t.photo_dimensions.height,
          }
        : null,
  },
];

async function resolveAcademicYearId(admissionYear: string) {
  const all = await db
    .select({ id: academicYearModel.id, year: academicYearModel.year })
    .from(academicYearModel);

  // Try literal "2025-26", then any year containing "2025", then current, then newest.
  const target = admissionYear.trim();
  const literal = all.find((r) => r.year === target);
  if (literal) return literal.id;
  const startsWith = all.find((r) => r.year?.startsWith(target));
  if (startsWith) return startsWith.id;
  const contains = all.find((r) => r.year?.includes(target));
  if (contains) return contains.id;
  const current = await db
    .select({ id: academicYearModel.id })
    .from(academicYearModel)
    .where(eq(academicYearModel.isCurrentYear, true))
    .limit(1);
  if (current[0]) return current[0].id;
  if (all[0]) return all[0].id;
  throw new Error("No academic_years rows in local DB.");
}

async function importOne(t: SnapcardTemplate) {
  const imageFile = path.join(IMG_DIR, `${t.id}.jpeg`);
  if (!fs.existsSync(imageFile)) {
    console.log(`  SKIP id=${t.id} — image ${imageFile} not found.`);
    return;
  }
  const academicYearId = await resolveAcademicYearId(t.admission_year);

  const tplName = `Snapcard #${t.id} (${t.admission_year})`;

  const existing = await db
    .select({ id: idCardTemplateModel.id })
    .from(idCardTemplateModel)
    .where(
      and(
        eq(idCardTemplateModel.academicYearId, academicYearId),
        eq(idCardTemplateModel.name, tplName),
      ),
    )
    .limit(1);
  if (existing[0]) {
    console.log(
      `  SKIP id=${t.id} — already imported as local id=${existing[0].id}`,
    );
    return;
  }

  const buf = await fs.promises.readFile(imageFile);
  const uploaded = await uploadToS3(
    {
      buffer: buf,
      mimetype: "image/jpeg",
      originalname: `${t.id}.jpeg`,
      size: buf.byteLength,
      fieldname: "templateImage",
      encoding: "7bit",
      stream: undefined as any,
      destination: "",
      filename: `${t.id}.jpeg`,
      path: "",
    } as unknown as Express.Multer.File,
    {
      folder: "idcard/templates",
      customFileName: `snapcard-${t.id}.jpeg`,
      contentType: "image/jpeg",
      maxFileSizeMB: 20,
      allowedMimeTypes: ["image/jpeg", "image/png"],
    },
  );

  const [created] = await db
    .insert(idCardTemplateModel)
    .values({
      academicYearId,
      name: tplName,
      description: `Imported from snapcard (admission_year=${t.admission_year})`,
      templateImageKey: uploaded.key,
      templateImageUrl: uploaded.url,
      canvasWidthPx: 600,
      canvasHeightPx: 900,
      qrcodeSize: Number(t.qrcode_size) || 0,
      validFrom: null,
      validTill: null,
      isDefault: false,
      disabled: !!t.disabled,
    })
    .returning({ id: idCardTemplateModel.id });

  const localId = created.id;

  const fieldValues = FIELD_MAP.flatMap((f) => {
    const coord = f.pick(t);
    if (!coord) return [];
    return [
      {
        templateId: localId,
        fieldKey: f.key,
        x: Math.max(0, Math.round(coord.x ?? 0)),
        y: Math.max(0, Math.round(coord.y ?? 0)),
        width:
          "width" in coord && coord.width != null
            ? Math.round(coord.width)
            : null,
        height:
          "height" in coord && coord.height != null
            ? Math.round(coord.height)
            : null,
        isVisible: true,
      },
    ];
  });

  if (fieldValues.length > 0) {
    await db.insert(idCardTemplateFieldModel).values(fieldValues);
  }

  console.log(
    `  OK   id=${t.id} → local id=${localId} (academic_year_id=${academicYearId}, fields=${fieldValues.length}, key=${uploaded.key})`,
  );
}

async function main() {
  if (!fs.existsSync(NDJSON)) {
    console.error(`Missing ${NDJSON}. Dump snapcard templates first.`);
    process.exit(1);
  }
  const lines = fs
    .readFileSync(NDJSON, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  console.log(`Importing ${lines.length} template(s)…`);

  for (const line of lines) {
    let parsed: SnapcardTemplate;
    try {
      parsed = JSON.parse(line) as SnapcardTemplate;
    } catch (err) {
      console.warn("  skip — invalid JSON line:", err);
      continue;
    }
    await importOne(parsed);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(idCardTemplateModel);
  console.log(`\nDone. Local id_card_templates row count: ${count}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
