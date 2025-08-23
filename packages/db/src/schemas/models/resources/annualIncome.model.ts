import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const annualIncomeModel = pgTable("annual_incomes", {
    id: serial().primaryKey(),
    range: varchar({ length: 255 }).notNull(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAnnualIncomeSchema = createInsertSchema(annualIncomeModel);

export type AnnualIncome = z.infer<typeof createAnnualIncomeSchema>;