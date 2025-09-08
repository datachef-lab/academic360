import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const annualIncomeModel = pgTable("annual_incomes", {
    id: serial().primaryKey(),
    range: varchar({ length: 255 }).notNull(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAnnualIncomeSchema = createInsertSchema(annualIncomeModel) as z.ZodTypeAny;

export type AnnualIncome = z.infer<typeof createAnnualIncomeSchema>;

export type AnnualIncomeT = typeof createAnnualIncomeSchema._type;