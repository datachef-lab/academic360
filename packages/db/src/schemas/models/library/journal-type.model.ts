import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const journalTypeModel = pgTable("journal_types", {
    id: serial().primaryKey(),
    legacyJournalTypeId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createJournalTypeSchema = createInsertSchema(journalTypeModel);

export type JournalType = z.infer<typeof createJournalTypeSchema>;

export type JournalTypeT = typeof createJournalTypeSchema._type;