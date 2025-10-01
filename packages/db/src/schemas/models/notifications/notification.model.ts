import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { applicationFormModel } from "../admissions";
import { userModel } from "../user";
import { notificationStatusEnum, notificationTypeEnum, notificationVariantEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { notificationEventModel } from "./notification-event.model";

export const notificationModel = pgTable("notifications", {
    id: serial().primaryKey(),
    applicationFormId: integer("application_form_id_fk")
    .references(() => applicationFormModel.id),
    userId: integer("user_id_fk")
    .references(() => userModel.id),
    notificationEventId: integer("notification_event_id_fk")
    .references(() => notificationEventModel.id),
    variant: notificationVariantEnum().notNull(),
    type: notificationTypeEnum().notNull(),
    message: text("message").notNull(),
    status: notificationStatusEnum().notNull(),
    sentAt: timestamp("sent_at"),
    failedAt: timestamp("failed_at"),
    failedReason: text("failed_reason"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationInsertSchema = createInsertSchema(notificationModel); 

export type Notification = z.infer<typeof notificationInsertSchema>;

export type NotificationT = typeof notificationModel.$inferSelect;