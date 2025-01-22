import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const categoryModel = pgTable("categories", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    documentRequired: boolean().notNull().default(false),
    code: varchar({ length: 10 }).notNull().unique(),
});

export const createCategorySchema = createInsertSchema(categoryModel);

export type Category = z.infer<typeof createCategorySchema>;