import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const languageMediumModel = pgTable("language_medium", {
    id: serial().primaryKey(),
    legacyLanguageMediumId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLanguageSchema = createInsertSchema(languageMediumModel);

export type LanguageMedium = z.infer<typeof createLanguageSchema>;