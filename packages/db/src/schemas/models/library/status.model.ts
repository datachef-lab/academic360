import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const statusModel = pgTable("library_statuses", {
    id: serial().primaryKey(),
    legacyStatusId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    isIssuable: boolean().notNull().default(false),
    issuedTo: varchar({ length: 1000 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStatusSchema = createInsertSchema(statusModel);

export type Status = z.infer<typeof createStatusSchema>;

export type StatusT = typeof createStatusSchema._type;