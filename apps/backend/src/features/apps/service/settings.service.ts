import { db } from "@/db/index.js";
import { Settings, settingsModel } from "../models/settings.model.js";
import { and, asc, eq, ilike } from "drizzle-orm";
import { settingsVariantEnum } from "@repo/db/schemas/enums";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import type { Readable } from "stream";
import {
  createUploadConfig,
  deleteFromS3,
  getFileFromS3,
  uploadToS3,
  UploadConfigs,
} from "@/services/s3.service.js";

const SETTINGS_PATH = process.env.SETTINGS_PATH;

const defaultSettings: Settings[] = [
  {
    name: "College Name",
    value: "Default College",
    type: "TEXT",
    variant: "GENERAL",
  },
  {
    name: "College Abbreviation",
    value: "DC",
    type: "TEXT",
    variant: "GENERAL",
  },
  { name: "College Email", value: null, type: "TEXT", variant: "GENERAL" },
  { name: "College Logo Image", value: null, type: "FILE", variant: "GENERAL" },
  { name: "Login Screen Image", value: null, type: "FILE", variant: "GENERAL" },

  {
    name: "GOOGLE_CLIENT_ID",
    value: null,
    type: "TEXT",
    variant: "API_CONFIG",
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    value: null,
    type: "TEXT",
    variant: "API_CONFIG",
  },

  {
    name: "INTERAKT_API_KEY",
    value: null,
    type: "TEXT",
    variant: "API_CONFIG",
  },
  {
    name: "INTERAKT_BASE_URL",
    value: null,
    type: "TEXT",
    variant: "API_CONFIG",
  },

  { name: "ZEPTO_URL", value: null, type: "TEXT", variant: "API_CONFIG" },
  { name: "ZEPTO_FROM", value: null, type: "TEXT", variant: "API_CONFIG" },
  { name: "ZEPTO_TOKEN", value: null, type: "TEXT", variant: "API_CONFIG" },
];

function settingsS3Key(fileName: string): string {
  return `settings/${fileName}`.replace(/\/{2,}/g, "/");
}

async function deleteSettingFileFromS3(fileName: string): Promise<void> {
  try {
    await deleteFromS3(settingsS3Key(fileName));
  } catch {
    // Ignore missing objects during replacement.
  }
}

async function streamSettingFromS3(
  fileName: string,
): Promise<{ stream: Readable; contentType: string } | null> {
  const s3File = await getFileFromS3(settingsS3Key(fileName)).catch(() => null);
  if (!s3File?.Body) return null;

  return {
    stream: s3File.Body as Readable,
    contentType:
      s3File.ContentType || mime.lookup(fileName) || "application/octet-stream",
  };
}

function streamSettingFromDisk(
  fileName: string,
): { stream: Readable; contentType: string } | null {
  if (!SETTINGS_PATH) return null;

  const filePath = path.join(SETTINGS_PATH, fileName);
  if (!fs.existsSync(filePath)) return null;

  return {
    stream: fs.createReadStream(filePath),
    contentType: mime.lookup(filePath) || "application/octet-stream",
  };
}

export async function loadDefaultSettings() {
  for (let i = 0; i < defaultSettings.length; i++) {
    const [existingSetting] = await db
      .select()
      .from(settingsModel)
      .where(ilike(settingsModel.name, defaultSettings[i].name.trim()));

    if (existingSetting) continue;

    await db.insert(settingsModel).values(defaultSettings[i]);
  }
}

export async function findAll(
  variant?: (typeof settingsVariantEnum.enumValues)[number],
) {
  const whereConditions = [];
  if (variant) {
    whereConditions.push(eq(settingsModel.variant, variant));
  }

  return await db
    .select()
    .from(settingsModel)
    .where(and(...whereConditions))
    .orderBy(asc(settingsModel.id));
}

export async function findById(id: number) {
  return await db.select().from(settingsModel).where(eq(settingsModel.id, id));
}

export async function save(
  id: number,
  givenData: Settings & { file?: Express.Multer.File },
) {
  const [existingSetting] = await db
    .select()
    .from(settingsModel)
    .where(eq(settingsModel.id, id));

  if (!existingSetting) {
    throw new Error("Setting not found");
  }

  if (existingSetting.type === "FILE" && givenData.file) {
    const file = givenData.file;

    const ext =
      mime.extension(file.mimetype) ||
      path.extname(file.originalname).replace(".", "");

    const fileName = `${id}.${ext}`;

    if (existingSetting.value) {
      await deleteSettingFileFromS3(existingSetting.value);
      if (SETTINGS_PATH) {
        const existingFilePath = path.join(
          SETTINGS_PATH,
          existingSetting.value,
        );
        if (fs.existsSync(existingFilePath)) {
          fs.unlinkSync(existingFilePath);
        }
      }
    }

    await uploadToS3(
      file,
      createUploadConfig(UploadConfigs.SETTINGS_FILES.folder, {
        customFileName: fileName,
        maxFileSizeMB: UploadConfigs.SETTINGS_FILES.maxFileSizeMB,
        allowedMimeTypes: UploadConfigs.SETTINGS_FILES.allowedMimeTypes,
        metadata: {
          settingId: String(id),
          settingName: existingSetting.name,
        },
      }),
    );

    givenData.value = fileName;
  }

  delete (givenData as { file?: Express.Multer.File }).file;

  return await db
    .update(settingsModel)
    .set(givenData)
    .where(eq(settingsModel.id, id))
    .returning();
}

export async function findByIdOrName(idOrName: string | number) {
  const isNumeric = !isNaN(Number(idOrName));
  const query = isNumeric
    ? eq(settingsModel.id, Number(idOrName))
    : ilike(settingsModel.name, idOrName.toString().trim());

  const [setting] = await db.select().from(settingsModel).where(query);
  return setting;
}

export async function getSettingFileService(idOrName: string) {
  const setting = await db
    .select()
    .from(settingsModel)
    .where(
      isNaN(Number(idOrName))
        ? eq(settingsModel.name, idOrName)
        : eq(settingsModel.id, Number(idOrName)),
    )
    .then((res) => res[0]);

  if (!setting || setting.type !== "FILE") {
    return null;
  }

  const extensions = ["jpg", "jpeg", "png", "webp"];

  if (setting.value) {
    const fromS3 = await streamSettingFromS3(setting.value);
    if (fromS3) return fromS3;

    const fromDisk = streamSettingFromDisk(setting.value);
    if (fromDisk) return fromDisk;
  }

  for (const ext of extensions) {
    const fileName = `${setting.id}.${ext}`;
    const fromS3 = await streamSettingFromS3(fileName);
    if (fromS3) return fromS3;

    const fromDisk = streamSettingFromDisk(fileName);
    if (fromDisk) return fromDisk;
  }

  return null;
}
