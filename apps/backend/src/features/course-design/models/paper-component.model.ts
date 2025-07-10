import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { paperModel } from "./paper.model";
import { examComponentModel } from "./exam-component.model";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paperComponentModel = pgTable("paper_components", {
    id: serial().primaryKey(),
    paperId: integer("paper_id_fk")
        .references(() => paperModel.id)
        .notNull(),
    examComponentId: integer("exam_component_id_fk")
        .references(() => examComponentModel.id)
        .notNull(),
    fullMarks: doublePrecision().notNull().default(0),
    credit: doublePrecision().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPaperComponentSchema = createInsertSchema(paperComponentModel);

export type PaperComponent = z.infer<typeof createPaperComponentSchema>;