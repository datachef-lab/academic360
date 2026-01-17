import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { feeStructureModel } from "@/schemas/models/fees";

export const feeStructureInstallmentModel = pgTable("fee_structure_installments", {
    id: serial().primaryKey(),
    feeStructureId: integer("fee_structure_id_fk")
        .references(() => feeStructureModel.id)
        .notNull(),
    installmentNumber: integer().notNull(),
    baseAmount: doublePrecision().default(0).notNull(),
    startDate: timestamp(),
    endDate: timestamp(),
    onlineStartDate: timestamp(),
    onlineEndDate: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeStructureInstallmentSchema = createInsertSchema(feeStructureInstallmentModel);

export type FeeStructureInstallment = z.infer<typeof createFeeStructureInstallmentSchema>; 

export type FeeStructureInstallmentT = typeof createFeeStructureInstallmentSchema._type;