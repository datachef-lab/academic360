import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { batchPaperModel } from "./batchPaper.model.js";
import { studyMaterialTypeEnum, studyMetaTypeEnum } from "@/features/user/models/helper.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const studyMaterialModel = pgTable("study_materials", {
    id: serial().primaryKey(),
    batchPaperId: integer("batch_paper_id_fk")
        .references(() => batchPaperModel.id)
        .notNull(),
    type: studyMaterialTypeEnum().notNull(),
    meta: studyMetaTypeEnum().notNull(),
    name: varchar({length: 700}).notNull(),
    url: varchar({length: 2000}).notNull(),
    filePath: varchar({length: 700}),
    dueDate: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStudyMaterialSchema = createInsertSchema(studyMaterialModel);

export type studyMaterial = z.infer<typeof createStudyMaterialSchema>;