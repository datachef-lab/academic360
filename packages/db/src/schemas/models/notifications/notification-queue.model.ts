import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { notificationModel } from "./notification.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const notificationQueueModel = pgTable("notification_queue", {
    id: serial().primaryKey(),
    notificationId: integer("notification_id_fk")
        .references(() => notificationModel.id)
        .notNull(),
    retryAttempts: integer("retry_attempts").notNull().default(0),
    isDead: boolean().notNull().default(false),
    failedReason: text("failed_reason"),
    deadAt: timestamp("dead_at"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationQueueInsertSchema = createInsertSchema(notificationQueueModel);

export type NotificationQueue = z.infer<typeof notificationQueueInsertSchema>;

export type NotificationQueueT = typeof notificationQueueModel.$inferSelect;