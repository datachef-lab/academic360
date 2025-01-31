import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { specializationModel } from "./specialization.model.ts";
import { z } from "zod";

export const annualIncomeModel = pgTable("annual_incomes", {
    id: serial().primaryKey(),
    range: varchar({ length: 255 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAnnualIncomeSchema = createInsertSchema(annualIncomeModel);

export type AnnualIncome = z.infer<typeof createAnnualIncomeSchema>;