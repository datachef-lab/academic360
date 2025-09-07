import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const languageMediumModel = pgTable("language_medium", {
    id: serial().primaryKey(),
    legacyLanguageMediumId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLanguageSchema = createInsertSchema(languageMediumModel);

export type LanguageMedium = z.infer<typeof createLanguageSchema>;

export type LanguageMediumT = typeof createLanguageSchema._type;