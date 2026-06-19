import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const patronCategoryModel = pgTable("library_patron_categories", {
    id: serial().primaryKey(),
    legacyPatronCategoryId: integer(),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 100 }),
    description: varchar({ length: 1000 }),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPatronCategorySchema = createInsertSchema(patronCategoryModel);

export type PatronCategory = z.infer<typeof createPatronCategorySchema>;

export type PatronCategoryT = typeof createPatronCategorySchema._type;
