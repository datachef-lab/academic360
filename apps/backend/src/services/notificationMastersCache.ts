import { getDbConnection } from "@repo/db/connection";
import { notificationMasterModel } from "@repo/db/schemas/models/notifications";
import { eq } from "drizzle-orm";

const cache = new Map<string, number>();

export async function getNotificationMasterIdByName(
  name: string,
): Promise<number> {
  if (cache.has(name)) return cache.get(name)!;
  const db = getDbConnection(process.env.DATABASE_URL!);
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
