import { boolean, doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { feesStructureModel } from "./fees-structure.model";
import { feesHeadModel } from "./fees-head.model";

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
    amount: doublePrecision().notNull(),
    // concessionAmount: doublePrecision().notNull().default(0),
    sequence: integer().notNull(),
    remarks: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesComponentSchema = createInsertSchema(feesComponentModel);

export type FeesComponent = z.infer<typeof createFeesComponentSchema>;