import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const itemCategoryModel = pgTable("library_item_categories", {
    id: serial().primaryKey(),
    legacyItemCategoryId: integer(),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 100 }),
    description: varchar({ length: 1000 }),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createItemCategorySchema = createInsertSchema(itemCategoryModel);

export type ItemCategory = z.infer<typeof createItemCategorySchema>;

export type ItemCategoryT = typeof createItemCategorySchema._type;
