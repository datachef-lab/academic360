import { db } from "@/db/index";
import { Settings, settingsModel } from "../models/settings.model";
import { and, eq, ilike } from "drizzle-orm";
import { settingsVariantEnum } from "@/features/user/models/helper";

const SETTINGS_PATH= process.env.SETTINGS_PATH!;

const defaultSettings: Settings[] = [
    { name: "College Name", value: "Default College", type: "TEXT", variant: "GENERAL" },
    { name: "College Abbreviation", value: "DC", type: "TEXT", variant: "GENERAL" },
    { name: "College Email", value: null, type: "TEXT", variant: "GENERAL" },
    { name: "College Logo Image", value: null, type: "FILE", variant: "GENERAL" },
    { name: "Login Screen Image", value: null, type: "FILE", variant: "GENERAL" },


    { name: "GOOGLE_CLIENT_ID", value: null, type: "TEXT", variant: "API_CONFIG" },
    { name: "GOOGLE_CLIENT_SECRET", value: null, type: "TEXT", variant: "API_CONFIG" },

    { name: "INTERAKT_API_KEY", value: null, type: "TEXT", variant: "API_CONFIG" },
    { name: "INTERAKT_BASE_URL", value: null, type: "TEXT", variant: "API_CONFIG" },

    { name: "ZEPTO_URL", value: null, type: "TEXT", variant: "API_CONFIG" },
    { name: "ZEPTO_FROM", value: null, type: "TEXT", variant: "API_CONFIG" },
    { name: "ZEPTO_TOKEN", value: null, type: "TEXT", variant: "API_CONFIG" },
]

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

export async function findAll(variant?: typeof settingsVariantEnum.enumValues[number]) {
    const whereConditions = [];
    if (variant) {
        whereConditions.push(
            eq(settingsModel.variant, variant)
        )
    }

    return await db.select().from(settingsModel).where(and(...whereConditions));
}

export async function findById(id: number) {
    return await db.select().from(settingsModel).where(eq(settingsModel.id, id));
}
import fs from "fs";
import path from "path";
import { promisify } from "util";
import mime from "mime-types";

const writeFile = promisify(fs.writeFile);
const unlinkFile = promisify(fs.unlink);

export async function save(id: number, givenData: Settings & { file?: Express.Multer.File }) {
    const [existingSetting] = await db
        .select()
        .from(settingsModel)
        .where(eq(settingsModel.id, id));

    if (!existingSetting) {
        throw new Error("Setting not found");
    }

    // Handle FILE type
    if (existingSetting.type === "FILE" && givenData.file) {
        const file = givenData.file;

        // Get file extension from mimetype or original name
        const ext = mime.extension(file.mimetype) || path.extname(file.originalname).replace('.', '');

        // Sanitize the name for filename use
        const safeName = existingSetting.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeName}.${ext}`;
        const filePath = path.join(SETTINGS_PATH, fileName);

        // Delete existing file if exists
        if (existingSetting.value) {
            const existingFilePath = path.join(SETTINGS_PATH, existingSetting.value);
            if (fs.existsSync(existingFilePath)) {
                await unlinkFile(existingFilePath);
            }
        }

        // Save new file
        await writeFile(filePath, file.buffer);

        // Update setting value with the new filename
        givenData.value = fileName;
    }

    // Remove file object before DB insert
    delete (givenData as any).file;

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
          : eq(settingsModel.id, Number(idOrName))
      )
      .then((res) => res[0]);
  
    if (!setting || setting.type !== "FILE") {
      return null;
    }
  
    const ext = path.extname(setting.name);
    const filePath = path.join("uploads", `${setting.name}${ext}`);
    const contentType = mime.lookup(filePath) || "application/octet-stream";
  
    if (!fs.existsSync(filePath)) return null;
  
    const stream = fs.createReadStream(filePath);
    return { stream, contentType };
  }