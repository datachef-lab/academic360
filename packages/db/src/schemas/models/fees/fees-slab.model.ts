import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const feesSlabModel = pgTable("fees_slab", {
    id: serial().primaryKey(),
    legacyFeesSlabId: integer(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }).notNull(),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesSlabSchema = createInsertSchema(feesSlabModel);

export type FeesSlab = z.infer<typeof createFeesSlabSchema>;

export type FeesSlabT = typeof createFeesSlabSchema._type;