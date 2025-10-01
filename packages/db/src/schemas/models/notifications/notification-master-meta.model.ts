import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { notificationMasterModel } from "./notification-master.model";
import { notificationMasterFieldModel } from "./notification-master-field.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const notificationMasterMetaModel = pgTable("notification_master_meta", {
    id: serial().primaryKey(),
    notificationMasterId: integer("notification_master_id_fk")
        .references(() => notificationMasterModel.id)
        .notNull(),
    notificationMasterFieldId: integer("notification_master_field_id_fk")
        .references(() => notificationMasterFieldModel.id).notNull(),
    sequence: integer().notNull(),
    flag: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationMasterMetaInsertSchema = createInsertSchema(notificationMasterMetaModel);

export type NotificationMasterMeta = z.infer<typeof notificationMasterMetaInsertSchema>;

export type NotificationMasterMetaT = typeof notificationMasterMetaModel.$inferSelect;