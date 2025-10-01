import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const whatsappAlertTable = pgTable("whatsapp_alerts", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    template: varchar({ length: 255 }).unique(),
    previewImage: text("preview_image"),
    isActive: boolean().notNull().default(true),

    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const whatsappAlertInsertSchema = createInsertSchema(whatsappAlertTable);

export type WhatsappAlert = z.infer<typeof whatsappAlertInsertSchema>;

export type WhatsappAlertT = typeof whatsappAlertTable.$inferSelect;