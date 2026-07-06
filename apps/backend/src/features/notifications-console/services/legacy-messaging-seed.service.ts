import fs from "fs";
import { fileURLToPath } from "url";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import {
  uploadToS3,
  createUploadConfig,
  FileTypeConfigs,
} from "@/services/s3.service.js";
import {
  notificationMasterModel,
  notificationMasterFieldModel,
  notificationMasterMetaModel,
} from "@repo/db/schemas";
import legacyMasters from "../seed/legacy-messaging-masters.json" with { type: "json" };

const log = createLogger("legacy-msg-seed");

/**
 * Preview PNGs bundled in seed/previews/<template>.png (snapshotted read-only
 * from the legacy app's public/ folder). Uploaded to S3 the first time a master
 * needs one; the stored S3 key is served (signed) by getMasterPreview.
 */
function previewPath(template: string): string {
  return fileURLToPath(
    new URL(`../seed/previews/${template}.png`, import.meta.url),
  );
}

async function ensurePreviewImage(
  masterId: number,
  template: string | null,
  current: string | null,
): Promise<void> {
  if (current || !template) return; // already has one, or no template key
  let file: string;
  try {
    file = previewPath(template);
  } catch {
    return;
  }
  if (!fs.existsSync(file)) return;
  try {
    const buffer = fs.readFileSync(file);
    const uploaded = await uploadToS3(
      {
        buffer,
        originalname: `${template}.png`,
        mimetype: "image/png",
        size: buffer.length,
      } as Express.Multer.File,
      createUploadConfig("notification-masters/previews", {
        allowedMimeTypes: FileTypeConfigs.IMAGES,
        maxFileSizeMB: 5,
      }),
    );
    await db
      .update(notificationMasterModel)
      .set({ previewImage: uploaded.key })
      .where(eq(notificationMasterModel.id, masterId));
  } catch (e) {
    log.error(`preview upload failed for ${template}`, {
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

type LegacyAlert = {
  id: number;
  name: string;
  template: string | null;
  fields: Array<{ name: string; sequence: number; flag: boolean }> | null;
};

/**
 * Idempotent startup seed of the legacy besc-admission-messaging templates
 * (30 "alerts" + their ordered fields), snapshotted read-only into
 * seed/legacy-messaging-masters.json — so no runtime connectivity to the
 * legacy box is ever needed.
 *
 * Dedupe rules (existing data always wins, nothing is overwritten):
 * - A master is matched by its Interakt template key (or by name when the
 *   legacy row has no key). Existing masters are left untouched.
 * - Fields/meta are only inserted for masters this seeder creates, or for
 *   matched masters that have NO stored fields yet.
 * - Imported masters are WHATSAPP + manual (isSystemTriggered = false).
 */
export async function seedLegacyMessagingMasters(): Promise<void> {
  const alerts = legacyMasters as LegacyAlert[];
  let createdMasters = 0;
  let createdFields = 0;
  let previews = 0;
  let skipped = 0;

  for (const alert of alerts) {
    const name = alert.name.trim();
    const template = alert.template?.trim() || null;
    if (!name) continue;

    // Match by template key first (unique in both systems), then by name.
    const [existing] = await db
      .select({
        id: notificationMasterModel.id,
        previewImage: notificationMasterModel.previewImage,
      })
      .from(notificationMasterModel)
      .where(
        template
          ? eq(notificationMasterModel.template, template)
          : and(
              eq(notificationMasterModel.name, name),
              eq(notificationMasterModel.variant, "WHATSAPP" as never),
            ),
      )
      .limit(1);

    let masterId: number;
    let currentPreview: string | null = null;
    let backfillFields = true;

    if (existing) {
      masterId = existing.id;
      currentPreview = existing.previewImage;
      // Existing master keeps its own name/template/flags. Only backfill
      // fields when it has none at all.
      const [hasField] = await db
        .select({ id: notificationMasterFieldModel.id })
        .from(notificationMasterFieldModel)
        .where(eq(notificationMasterFieldModel.notificationMasterId, masterId))
        .limit(1);
      backfillFields = !hasField;
      if (!backfillFields) skipped++;
    } else {
      const [row] = await db
        .insert(notificationMasterModel)
        .values({
          name,
          variant: "WHATSAPP" as never,
          template,
          isActive: true,
          isSystemTriggered: false,
        })
        .returning({ id: notificationMasterModel.id });
      masterId = row.id;
      createdMasters++;
    }

    if (backfillFields) {
      const fields = (alert.fields ?? []).filter((f) => f.name?.trim());
      for (const f of fields) {
        const [fieldRow] = await db
          .insert(notificationMasterFieldModel)
          .values({ notificationMasterId: masterId, name: f.name.trim() })
          .returning({ id: notificationMasterFieldModel.id });
        await db.insert(notificationMasterMetaModel).values({
          notificationMasterId: masterId,
          notificationMasterFieldId: fieldRow.id,
          sequence: f.sequence,
          flag: f.flag,
        });
        createdFields++;
      }
    }

    // Upload + set the bundled preview image if this master has none yet.
    if (!currentPreview && template) {
      const before = currentPreview;
      await ensurePreviewImage(masterId, template, currentPreview);
      // Count only if a file existed (ensurePreviewImage is a no-op otherwise).
      if (before === null && fs.existsSync(previewPath(template))) previews++;
    }
  }

  if (createdMasters || createdFields || previews) {
    log.info(
      `Legacy messaging seed: +${createdMasters} masters, +${createdFields} fields, +${previews} previews (${skipped} already present).`,
    );
  } else {
    log.debug(
      `Legacy messaging seed: nothing to do (${skipped} already present).`,
    );
  }
}
