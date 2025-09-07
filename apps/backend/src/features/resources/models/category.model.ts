import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const categoryModel = pgTable("categories", {
  id: serial().primaryKey(),
  legacyCategoryId: integer(),
  name: varchar({ length: 255 }).notNull().unique(),
  documentRequired: boolean(),
  code: varchar({ length: 10 }).notNull().unique(),
  sequence: integer().unique(),
  disabled: boolean().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createCategorySchema = createInsertSchema(categoryModel);

export type Category = z.infer<typeof createCategorySchema>;
