import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const entryModeModel = pgTable("entry_modes", {
    id: serial().primaryKey(),
    legacyEntryModeId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createEntryModeSchema = createInsertSchema(entryModeModel);

export type EntryMode = z.infer<typeof createEntryModeSchema>;

export type EntryModeT = typeof createEntryModeSchema._type;