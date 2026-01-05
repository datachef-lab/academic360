import { db } from "@/db";
import { notificationEventModel } from "@repo/db/schemas/models/notifications";
import { eq } from "drizzle-orm";

export class NotificationEventsService {
  static db() {
    return db;
  }
  static async list() {
    const db = this.db();
    return db.select().from(notificationEventModel).limit(1000);
  }
  static async get(id: number) {
    const db = this.db();
    const rows = await db
      .select()
      .from(notificationEventModel)
      .where(eq(notificationEventModel.id, id))
      .limit(1);
    return rows[0];
  }
  static async create(values: typeof notificationEventModel.$inferInsert) {
    const db = this.db();
    const [row] = await db
      .insert(notificationEventModel)
      .values(values as never)
      .returning();
    return row;
  }
  static async update(
    id: number,
    values: Partial<typeof notificationEventModel.$inferInsert>,
  ) {
    const db = this.db();
    const [row] = await db
      .update(notificationEventModel)
      .set(values as never)
      .where(eq(notificationEventModel.id, id))
      .returning();
    return row;
  }
}
