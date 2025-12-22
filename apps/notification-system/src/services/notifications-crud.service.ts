import { db } from "@/db";
import {
  notificationContentModel,
  notificationModel,
  notificationQueueModel,
} from "@repo/db/schemas/models/notifications";
import { eq } from "drizzle-orm";

export class NotificationsCrudService {
  static db() {
    return db;
  }

  // notifications
  static async listNotifications() {
    const db = this.db();
    return db.select().from(notificationModel).limit(1000);
  }
  static async getNotification(id: number) {
    const db = this.db();
    const rows = await db
      .select()
      .from(notificationModel)
      .where(eq(notificationModel.id, id))
      .limit(1);
    return rows[0];
  }

  // contents
  static async listContents(notificationId: number) {
    const db = this.db();
    return db
      .select()
      .from(notificationContentModel)
      .where(eq(notificationContentModel.notificationId, notificationId));
  }

  // queue
  static async listQueue() {
    const db = this.db();
    return db.select().from(notificationQueueModel).limit(1000);
  }
  static async getQueueItem(id: number) {
    const db = this.db();
    const rows = await db
      .select()
      .from(notificationQueueModel)
      .where(eq(notificationQueueModel.id, id))
      .limit(1);
    return rows[0];
  }
}
