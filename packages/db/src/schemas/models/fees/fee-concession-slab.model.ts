import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const feeConcessionSlabModel = pgTable("fee_concession_slabs", {
    id: serial().primaryKey(),
    legacyFeeSlabId: integer(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }).notNull(),
    defaultConcessionRate: doublePrecision().default(0),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeConcessionSlabSchema = createInsertSchema(feeConcessionSlabModel);

export type FeeConcessionSlab = z.infer<typeof createFeeConcessionSlabSchema>;

export type FeeConcessionSlabT = typeof createFeeConcessionSlabSchema._type;