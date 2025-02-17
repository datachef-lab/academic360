import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { streamModel } from "@/features/academics/models/stream.model.js";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { specializationModel } from "@/features/user/models/specialization.model.js";
import { courseTypeEnum } from "@/features/user/models/helper.js";
import { subjectTypeModel } from "./subjectType.model.js";

export const subjectCategoryTypeEnum = pgEnum("subject_category_type", [
    "SPECIAL",
    "COMMON",
    "HONOURS",
    "GENERAL",
    "ELECTIVE",
]);

export const frameworkTypeEnum = pgEnum("framework_type", ["CCF", "CBCS"]);

export const subjectMetadataModel = pgTable("subject_metadatas", {
    id: serial().primaryKey(),
    streamId: integer("stream_id_fk").notNull().references(() => streamModel.id),
    course: courseTypeEnum(),
    semester: integer().notNull(),
    framework: frameworkTypeEnum().notNull(),
    specializationId: integer("specialization_id_fk").references(() => specializationModel.id),
    category: subjectCategoryTypeEnum(),
    subjectTypeId: integer().references(() => subjectTypeModel.id),
    name: varchar({ length: 255 }).notNull(),
    isOptional: boolean().default(false),
    credit: integer(),
    fullMarksTheory: integer(),
    fullMarksTutorial: integer(),
    fullMarksInternal: integer(),
    fullMarksPractical: integer(),
    fullMarksProject: integer(),
    fullMarksViva: integer(),
    fullMarks: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const subjectMetadataRelations = relations(subjectMetadataModel, ({ one }) => ({
    stream: one(streamModel, {
        fields: [subjectMetadataModel.id],
        references: [streamModel.id]
    }),
    subjectType: one(subjectTypeModel, {
        fields: [subjectMetadataModel.subjectTypeId],
        references: [subjectTypeModel.id]
    }),
    specialization: one(specializationModel, {
        fields: [subjectMetadataModel.specializationId],
        references: [specializationModel.id]
    }),
}));

export const createSubjectMetadataSchema = createInsertSchema(subjectMetadataModel);

export type SubjectMetadata = z.infer<typeof createSubjectMetadataSchema>;