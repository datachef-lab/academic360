import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const categoryModel = pgTable("categories", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    documentRequired: boolean(),
    code: varchar({ length: 10 }).notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCategorySchema = createInsertSchema(categoryModel);

export type Category = z.infer<typeof createCategorySchema>;