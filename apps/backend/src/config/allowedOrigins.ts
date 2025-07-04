import "dotenv/config";
import { db } from "../db/index.js";
import { appsModel } from "@/features/apps/models/apps.model.js";
import { eq } from "drizzle-orm";

async function getOrigins() {
    const availableApps = await db
        .select()
        .from(appsModel)
        .where(eq(appsModel.isActive, true));

    return [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://13.235.168.107:3003",
        "http://localhost:3003",
        process.env.CORS_ORIGIN!,
        "*",
        ...availableApps.map(app => app.url),
    ];
}



export const allowedOrigins = await getOrigins();
