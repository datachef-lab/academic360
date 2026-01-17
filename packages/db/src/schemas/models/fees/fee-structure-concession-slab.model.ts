import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { feeConcessionSlabModel, feeStructureModel } from "@/schemas/models/fees";

export const feeStructureConcessionSlabModel = pgTable("fee_structure_concession_slabs", {
    id: serial().primaryKey(),
    feeStructureId: integer("fee_structure_id_fk")
        .references(() => feeStructureModel.id)
        .notNull(),
    feeConcessionSlabId: integer("fee_concession_slab_id_fk")
        .references(() => feeConcessionSlabModel.id)
        .notNull(),
    concessionRate: doublePrecision().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeStructureConcessionSlabSchema = createInsertSchema(feeStructureConcessionSlabModel);

export type FeeStructureConcessionSlab = z.infer<typeof createFeeStructureConcessionSlabSchema>;

export type FeeStructureConcessionSlabT = typeof createFeeStructureConcessionSlabSchema._type;