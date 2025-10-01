import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "../user";
import { notificationMasterModel } from "./notification-master.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const notificationEventModel = pgTable("notification_events", {
    id: serial().primaryKey(),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id),
    emailTemplate: varchar({ length: 255 }),
        notificationMasterId: integer("notification_master_id_fk")
        .references(() => notificationMasterModel.id),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationEventInsertSchema = createInsertSchema(notificationEventModel);

export type NotificationEvent = z.infer<typeof notificationEventInsertSchema>;

export type NotificationEventT = typeof notificationEventModel.$inferSelect;