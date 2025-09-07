import {
  boolean,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sportsCategoryModel = pgTable("sports_categories", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  disabled: boolean().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createSportsCategorySchema =
  createInsertSchema(sportsCategoryModel);

export type SportsCategory = z.infer<typeof createSportsCategorySchema>;
