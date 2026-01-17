import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { notificationModel } from "./notification.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { notificationQueueTypeEnum } from "@/schemas/enums";

export const notificationQueueModel = pgTable("notification_queue", {
    id: serial().primaryKey(),
    notificationId: integer("notification_id_fk")
        .references(() => notificationModel.id)
        .notNull(),
    type: notificationQueueTypeEnum().notNull(),
    retryAttempts: integer("retry_attempts").notNull().default(0),
    isProcessing: boolean().notNull().default(false),
    isDeadLetter: boolean().notNull().default(false),
    failedReason: text("failed_reason"),
    deadLetterAt: timestamp("dead_letter_at"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationQueueInsertSchema = createInsertSchema(notificationQueueModel);

export type NotificationQueue = z.infer<typeof notificationQueueInsertSchema>;

export type NotificationQueueT = typeof notificationQueueModel.$inferSelect;