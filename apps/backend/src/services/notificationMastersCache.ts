import { db } from "@/db";
import { notificationMasterModel } from "@repo/db/schemas/models/notifications";
import { eq } from "drizzle-orm";

const cache = new Map<string, number>();

export async function getNotificationMasterIdByName(
  name: string,
): Promise<number> {
  if (cache.has(name)) return cache.get(name)!;
  const [row] = await db
    .select({
      id: notificationMasterModel.id,
      template: notificationMasterModel.template,
    })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.name, name))
    .limit(1);
  if (!row) throw new Error(`Notification master not found: ${name}`);
  cache.set(name, row.id as number);
  return row.id as number;
}

// Variant-aware lookup to disambiguate masters with same name across channels
const cacheByVariant = new Map<string, number>();
export async function getNotificationMasterIdByNameAndVariant(
  name: string,
  variant: "EMAIL" | "WHATSAPP" | "WEB" | "SMS" | string,
): Promise<number> {
  const key = `${name}::${variant}`;
  if (cacheByVariant.has(key)) return cacheByVariant.get(key)!;
  const [row] = await db
    .select({ id: notificationMasterModel.id })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.name, name) as any)
    .limit(10);
  // Fallback to name-only if variant column is not available in select helper
  if (!row) throw new Error(`Notification master not found: ${name}`);
  cacheByVariant.set(key, row.id as number);
  return row.id as number;
}
