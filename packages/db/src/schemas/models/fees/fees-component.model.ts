import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { feesHeadModel, feesStructureModel } from "@/schemas/models/fees";

export const feesComponentModel = pgTable("fees_components", {
    id: serial().primaryKey(),
    feesStructureId:
        integer("fees_structure_id_fk")
            .references(() => feesStructureModel.id)
            .notNull(),
    feesHeadId: integer("fees_head_id_fk")
        .references(() => feesHeadModel.id)
        .notNull(),
    isConcessionApplicable: boolean().notNull().default(false),
    baseAmount: doublePrecision().notNull(),
    sequence: integer().notNull(),
    remarks: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesComponentSchema = createInsertSchema(feesComponentModel) as z.ZodTypeAny;

export type FeesComponent = z.infer<typeof createFeesComponentSchema>;

export type FeesComponentT = typeof createFeesComponentSchema._type;