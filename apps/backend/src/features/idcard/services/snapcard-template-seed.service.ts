import { and, eq, ilike } from "drizzle-orm";

import { db } from "@/db/index.js";
import { fileExistsInS3 } from "@/services/s3.service.js";
import {
  academicYearModel,
  idCardTemplateFieldModel,
  idCardTemplateModel,
} from "@repo/db/schemas/index.js";

/**
 * Static seed of the snapcard front-side ID card template (snapcard_db
 * id_card_templates #12, admission_year 2025) captured from the proven staging
 * import. Field coordinates are at the canonical 638x1004 canvas. The background
 * images are NOT bundled (too large); they are a one-time per-environment S3
 * asset — see `templateImageKey` / `backsideImageKey`.
 */
export const SNAPCARD_TEMPLATE_SEED = {
  name: "Snapcard #12 (2025)",
  description: "Imported from snapcard (admission_year=2025)",
  academicYearLabel: "2025-26",
  canvasWidthPx: 638,
  canvasHeightPx: 1004,
  qrcodeSize: 180,
  qrcodeHeight: 0,
  templateImageKey: "besc/idcard/templates/snapcard-12.jpeg",
  backsideImageKey: "besc/idcard/backsides/snapcard.jpeg",
  isDefault: false,
  disabled: false,
  fields: [
    { fieldKey: "NAME", x: 288, y: 599 },
    { fieldKey: "COURSE", x: 117, y: 742 },
    { fieldKey: "UID", x: 279, y: 646 },
    { fieldKey: "MOBILE", x: 117, y: 781 },
    { fieldKey: "BLOOD_GROUP", x: 170, y: 863 },
    { fieldKey: "SPORTS_QUOTA", x: 257, y: 863 },
    { fieldKey: "QRCODE", x: 428, y: 757 },
    { fieldKey: "VALID_TILL_DATE", x: 287, y: 985 },
    { fieldKey: "PHOTO", x: 250, y: 307, width: 225, height: 250 },
  ] as Array<{
    fieldKey:
      | "NAME"
      | "COURSE"
      | "UID"
      | "MOBILE"
      | "BLOOD_GROUP"
      | "SPORTS_QUOTA"
      | "QRCODE"
      | "VALID_TILL_DATE"
      | "PHOTO"
      | "SHIFT";
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize?: number;
  }>,
};

export type EnsureSnapcardTemplateResult = {
  created: boolean;
  templateId: number | null;
  reason?: string;
  bgMissing?: string[];
};

/**
 * Idempotently ensure the snapcard front-side template exists for the given
 * academic year (defaults to the seed's 2025-26). If a template with the same
 * name already exists for that academic year, it is left untouched (NO
 * duplicate). Also reports if the background images are missing from this
 * environment's S3 bucket (the composer needs them to render the card).
 */
export async function ensureSnapcardTemplate(opts?: {
  academicYearLabel?: string;
  makeDefault?: boolean;
}): Promise<EnsureSnapcardTemplateResult> {
  const seed = SNAPCARD_TEMPLATE_SEED;
  const yearLabel = opts?.academicYearLabel ?? seed.academicYearLabel;

  // Resolve the academic year row.
  const [year] = await db
    .select({ id: academicYearModel.id })
    .from(academicYearModel)
    .where(eq(academicYearModel.year, yearLabel))
    .limit(1);
  if (!year) {
    return {
      created: false,
      templateId: null,
      reason: `academic year "${yearLabel}" not found`,
    };
  }

  // Idempotency: skip if a template with this name already exists for the year.
  const [existing] = await db
    .select({ id: idCardTemplateModel.id })
    .from(idCardTemplateModel)
    .where(
      and(
        eq(idCardTemplateModel.academicYearId, year.id),
        ilike(idCardTemplateModel.name, seed.name),
      ),
    )
    .limit(1);
  if (existing) {
    return {
      created: false,
      templateId: existing.id,
      reason: "already exists",
    };
  }

  const [created] = await db
    .insert(idCardTemplateModel)
    .values({
      academicYearId: year.id,
      name: seed.name,
      description: seed.description,
      templateImageKey: seed.templateImageKey,
      backsideImageKey: seed.backsideImageKey,
      canvasWidthPx: seed.canvasWidthPx,
      canvasHeightPx: seed.canvasHeightPx,
      qrcodeSize: seed.qrcodeSize,
      qrcodeHeight: seed.qrcodeHeight,
      isDefault: opts?.makeDefault ?? seed.isDefault,
      disabled: seed.disabled,
    })
    .returning({ id: idCardTemplateModel.id });

  await db.insert(idCardTemplateFieldModel).values(
    seed.fields.map((f) => ({
      templateId: created.id,
      fieldKey: f.fieldKey,
      x: f.x,
      y: f.y,
      width: f.width ?? null,
      height: f.height ?? null,
      fontSize: f.fontSize ?? null,
      align: "LEFT",
      isVisible: true,
    })),
  );

  // The background images are a per-env S3 asset; warn (don't fail) if missing.
  const bgMissing: string[] = [];
  for (const key of [seed.templateImageKey, seed.backsideImageKey]) {
    try {
      if (!(await fileExistsInS3(key))) bgMissing.push(key);
    } catch {
      bgMissing.push(key);
    }
  }
  if (bgMissing.length) {
    console.warn(
      `[snapcard-template-seed] template created (id ${created.id}) but these background images are missing from this env's S3 (upload them or the card bg won't render):`,
      bgMissing.join(", "),
    );
  }

  return { created: true, templateId: created.id, bgMissing };
}
