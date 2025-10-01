import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const notificationMasterModel = pgTable("notification_masters", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    template: varchar({ length: 255 }).unique(),
    previewImage: text("preview_image"),
    isActive: boolean().notNull().default(true),

    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationMasterInsertSchema = createInsertSchema(notificationMasterModel);

export type NotificationMaster = z.infer<typeof notificationMasterInsertSchema>;

export type NotificationMasterT = typeof notificationMasterModel.$inferSelect;