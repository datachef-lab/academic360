import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { marksheetPaperMappingModel } from "./marksheet-paper-mapping.model.js";
import { paperComponentModel } from "@/features/course-design/models/paper-component.model.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const createMarksheetPaperComponentMappingSchema = createInsertSchema(marksheetPaperComponentMappingModel);

export type MarksheetPaperComponentMapping = z.infer<typeof createMarksheetPaperComponentMappingSchema>;