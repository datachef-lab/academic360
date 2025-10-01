import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { whatsappAlertTable } from "./whatsapp-alert.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const whatsappFieldTable = pgTable("whatsapp_fields", {
    id: serial().primaryKey(),
    whatsAppAlertId: integer("whatsapp_alert_id_fk")
        .references(() => whatsappAlertTable.id).notNull(),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer().notNull(),
    flag: boolean().notNull().default(true),
    frequecy: integer().notNull().default(1),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const whatsappFieldInsertSchema = createInsertSchema(whatsappFieldTable);

export type WhatsappField = z.infer<typeof whatsappFieldInsertSchema>;

export type WhatsappFieldT = typeof whatsappFieldTable.$inferSelect;