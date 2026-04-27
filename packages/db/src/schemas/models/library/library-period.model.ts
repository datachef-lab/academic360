import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const libraryPeriodModel = pgTable("library_periods", {
    id: serial().primaryKey(),
    legacyLibraryPeriodId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLibraryPeriodSchema = createInsertSchema(libraryPeriodModel);

export type LibraryPeriod = z.infer<typeof createLibraryPeriodSchema>;

export type LibraryPeriodT = typeof createLibraryPeriodSchema._type;