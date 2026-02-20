import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { feeHeadModel, feeSlabModel, feeStructureModel } from "@/schemas/models/fees";

export const feeStructureComponentModel = pgTable("fee_structure_components", {
    id: serial().primaryKey(),
    feeStructureId:
        integer("fee_structure_id_fk")
            .references(() => feeStructureModel.id)
            .notNull(),
    feeHeadId: integer("fee_head_id_fk")
        .references(() => feeHeadModel.id)
        .notNull(),
    feeSlabId: integer("fee_slab_id_fk").references(() => feeSlabModel.id).notNull(),
    amount: doublePrecision().notNull().default(0),
    
    remarks: varchar({ length: 500 }),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeStructureComponentSchema = createInsertSchema(feeStructureComponentModel);

export type FeeStructureComponent = z.infer<typeof createFeeStructureComponentSchema>;

export type FeeStructureComponentT = typeof createFeeStructureComponentSchema._type;