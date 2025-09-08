import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { paperComponentModel } from "@/schemas/models/course-design";
import { marksheetPaperMappingModel } from "@/schemas/models/academics";

export const marksheetPaperComponentMappingModel = pgTable("marksheet_paper_component_mapping", {
    id: serial().primaryKey(),
    marksheetPaperMappingId: integer("marksheet_paper_mapping_id_fk")
        .references(() => marksheetPaperMappingModel.id)
        .notNull(),
    paperComponentId: integer("paper_component_id_fk")
        .references(() => paperComponentModel.id)
        .notNull(),
    marksObtained: doublePrecision().default(0),
    creditObtained: doublePrecision().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createMarksheetPaperComponentMappingSchema = createInsertSchema(marksheetPaperComponentMappingModel) as z.ZodTypeAny;

export type MarksheetPaperComponentMapping = z.infer<typeof createMarksheetPaperComponentMappingSchema>;

export type MarksheetPaperComponentMappingT = typeof createMarksheetPaperComponentMappingSchema._type;