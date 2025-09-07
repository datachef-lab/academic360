import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const feesSlabModel = pgTable("fees_slab", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull(),
  sequence: integer().unique(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createFeesSlabSchema = createInsertSchema(feesSlabModel);

export type FeesSlab = z.infer<typeof createFeesSlabSchema>;
