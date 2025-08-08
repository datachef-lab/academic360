import { db } from "@/db/index";
import { Settings, settingsModel } from "../models/settings.model";
import { and, eq, ilike } from "drizzle-orm";
import { settingsVariantEnum } from "@/features/user/models/helper";

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

export async function save(id: number, givenData: Settings) {
    const [existingSetting] = await db
        .select()
        .from(settingsModel)
        .where(eq(settingsModel.id, id));

    if (existingSetting) null;

    return await db
        .update(settingsModel)
        .set(givenData)
        .where(eq(settingsModel.id, id))
        .returning();
}