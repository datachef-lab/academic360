import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { paperModel, examComponentModel } from "@/schemas/models/course-design";

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

export type PaperComponentT = typeof createPaperComponentSchema._type;