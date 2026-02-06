import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import {  feeStructureModel } from "@/schemas/models/fees";
import { feeSlabModel } from "./fee-slab.model";

export const feeStructureSlabModel = pgTable("fee_structure_slabs", {
    id: serial().primaryKey(),
    feeStructureId: integer("fee_structure_id_fk")
        .references(() => feeStructureModel.id)
        .notNull(),
    feeSlabId: integer("fee_slab_id_fk")
        .references(() => feeSlabModel.id)
        .notNull(),
    concessionRate: doublePrecision().notNull().default(0),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeStructureSlabSchema = createInsertSchema(feeStructureSlabModel);

export type FeeStructureSlab = z.infer<typeof createFeeStructureSlabSchema>;

export type FeeStructureSlabT = typeof createFeeStructureSlabSchema._type;