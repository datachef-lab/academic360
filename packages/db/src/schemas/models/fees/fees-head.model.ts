import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const feesHeadModel = pgTable("fees_heads", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer().notNull().unique(),
    remarks: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesHeadSchema = createInsertSchema(feesHeadModel);

export type FeesHead = z.infer<typeof createFeesHeadSchema>;