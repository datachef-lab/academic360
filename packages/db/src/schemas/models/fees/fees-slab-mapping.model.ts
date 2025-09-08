import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { feesSlabModel, feesStructureModel } from "@/schemas/models/fees";

export const feesSlabMappingModel = pgTable("fees_slab_mapping", {
    id: serial().primaryKey(),
    feesStructureId: integer("fees_structure_id_fk")
        .references(() => feesStructureModel.id)
        .notNull(),
    feesSlabId: integer("fees_slab_id_fk")
        .references(() => feesSlabModel.id)
        .notNull(),
    feeConcessionRate: doublePrecision().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesSlabMappingSchema = createInsertSchema(feesSlabMappingModel) as z.ZodTypeAny;

export type FeesSlabMapping = z.infer<typeof createFeesSlabMappingSchema>;

export type FeesSlabMappingT = typeof createFeesSlabMappingSchema._type;