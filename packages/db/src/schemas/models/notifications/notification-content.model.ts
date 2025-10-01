import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { notificationMasterFieldModel, } from "./notification-master-field.model";
import { notificationModel } from "./notification.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { notificationEventModel } from "./notification-event.model";

export const notificationContentModel = pgTable("notification_contents", {
    id: serial().primaryKey(),
    notificationId: integer("notification_id_fk").references(() => notificationModel.id).notNull(),
    notificationEventId: integer("notification_event_id_fk").references(() => notificationEventModel.id).notNull(),
    emailTemplate: varchar({ length: 255 }),
    whatsappFieldId: integer("whatsapp_field_id_fk")
        .references(() => notificationMasterFieldModel.id)
        .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationContentInsertSchema = createInsertSchema(notificationContentModel);

export type NotificationContent = z.infer<typeof notificationContentInsertSchema>;

export type NotificationContentT = typeof notificationContentModel.$inferSelect;