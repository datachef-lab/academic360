import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { notificationMasterModel } from "./notification-master.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const notificationMasterFieldModel = pgTable("notification_master_fields", {
    id: serial().primaryKey(),
    notificationMasterId: integer("notification_master_id_fk")
        .references(() => notificationMasterModel.id).notNull(),
    name: varchar({ length: 255 }).notNull(),

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationMasterFieldInsertSchema = createInsertSchema(notificationMasterFieldModel);

export type NotificationMasterField = z.infer<typeof notificationMasterFieldInsertSchema>;

export type NotificationMasterFieldT = typeof notificationMasterFieldModel.$inferSelect;