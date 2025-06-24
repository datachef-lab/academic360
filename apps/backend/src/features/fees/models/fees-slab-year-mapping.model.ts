import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { feesSlabModel } from "./fees-slab.model";
import { academicYearModel } from "@/features/academics/models/academic-year.model";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const feesSlabYearModel = pgTable("fees_slab_academic_year_mapping", {
    id: serial().primaryKey(),
    feesSlabId: integer("fees_slab_id_fk")
        .references(() => feesSlabModel.id)
        .notNull(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    feeConcessionRate: doublePrecision().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesSlabYearSchema = createInsertSchema(feesSlabYearModel);

export type FeesSlabYear = z.infer<typeof createFeesSlabYearSchema>;