import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const feeHeadModel = pgTable("fee_heads", {
    id: serial().primaryKey(),
    legacyFeeHeadId: integer(),
    name: varchar({ length: 255 }).notNull(),
    defaultPercentage: doublePrecision().default(0).notNull(),
    sequence: integer().notNull().unique(),
    remarks: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeHeadSchema = createInsertSchema(feeHeadModel);

export type FeeHead = z.infer<typeof createFeeHeadSchema>;

export type FeeHeadT = typeof createFeeHeadSchema._type;