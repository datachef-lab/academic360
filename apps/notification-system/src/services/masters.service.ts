import { db } from "@/db";
import {
  notificationMasterModel,
  notificationMasterFieldModel,
  notificationMasterMetaModel,
} from "@repo/db/schemas/models/notifications";
import { and, eq } from "drizzle-orm";

export class NotificationMastersService {
  static db() {
    return db;
  }

  // Masters
  static async listMasters() {
    const db = this.db();
    return db.select().from(notificationMasterModel).limit(1000);
  }
  static async getMaster(id: number) {
    const db = this.db();
    const rows = await db
      .select()
      .from(notificationMasterModel)
      .where(eq(notificationMasterModel.id, id))
      .limit(1);
    return rows[0];
  }
  static async createMaster(
    values: typeof notificationMasterModel.$inferInsert,
  ) {
    const db = this.db();
    const [row] = await db
      .insert(notificationMasterModel)
      .values(values as never)
      .returning();
    return row;
  }
  static async updateMaster(
    id: number,
    values: Partial<typeof notificationMasterModel.$inferInsert>,
  ) {
    const db = this.db();
    const [row] = await db
      .update(notificationMasterModel)
      .set(values as never)
      .where(eq(notificationMasterModel.id, id))
      .returning();
    return row;
  }

  // Fields
  static async listFields(masterId: number) {
    const db = this.db();
    return db
      .select()
      .from(notificationMasterFieldModel)
      .where(eq(notificationMasterFieldModel.notificationMasterId, masterId));
  }
  static async createField(
    values: typeof notificationMasterFieldModel.$inferInsert,
  ) {
    const db = this.db();
    const [row] = await db
      .insert(notificationMasterFieldModel)
      .values(values as never)
      .returning();
    return row;
  }
  static async deleteField(id: number) {
    const db = this.db();
    await db
      .delete(notificationMasterFieldModel)
      .where(eq(notificationMasterFieldModel.id, id));
  }

  // Meta
  static async listMeta(masterId: number) {
    const db = this.db();
    return db
      .select()
      .from(notificationMasterMetaModel)
      .where(eq(notificationMasterMetaModel.notificationMasterId, masterId));
  }
  static async createMeta(
    values: typeof notificationMasterMetaModel.$inferInsert,
  ) {
    const db = this.db();
    const [row] = await db
      .insert(notificationMasterMetaModel)
      .values(values as never)
      .returning();
    return row;
  }
  static async updateMeta(
    id: number,
    values: Partial<typeof notificationMasterMetaModel.$inferInsert>,
  ) {
    const db = this.db();
    const [row] = await db
      .update(notificationMasterMetaModel)
      .set(values as never)
      .where(eq(notificationMasterMetaModel.id, id))
      .returning();
    return row;
  }
  static async deleteMeta(id: number) {
    const db = this.db();
    await db
      .delete(notificationMasterMetaModel)
      .where(eq(notificationMasterMetaModel.id, id));
  }
}
