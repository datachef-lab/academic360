import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
// import { streamModel } from "@/features/academics/models/stream.model.js";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { specializationModel } from "@/features/user/models/specialization.model.js";

import { subjectTypeModel } from "./subjectType.model.js";
import { programmeTypeEnum, frameworkTypeEnum, subjectCategoryTypeEnum } from "@/features/user/models/helper.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { classModel } from "./class.model.js";

export const subjectMetadataModel = pgTable("subject_metadatas", {
    id: serial().primaryKey(),
    // streamId: integer("stream_id_fk").notNull().references(() => streamModel.id),
    degreeId: integer("degree_id_fk")
        .references(() => degreeModel.id)
        .notNull(),
    programmeType: programmeTypeEnum().notNull().default("HONOURS"),
    framework: frameworkTypeEnum().default("CCF").notNull(),
    classId: integer("class_id_fk").notNull().references(() => classModel.id),
    specializationId: integer("specialization_id_fk").references(() => specializationModel.id),
    category: subjectCategoryTypeEnum(),
    subjectTypeId: integer("subject_type_id_fk").references(() => subjectTypeModel.id),
    irpName: varchar({ length: 500 }),
    name: varchar({ length: 500 }),
    irpCode: varchar({ length: 255 }),
    marksheetCode: varchar({ length: 255 }).notNull(),
    isOptional: boolean().default(false),
    credit: integer(),
    theoryCredit: integer(),
    fullMarksTheory: integer(),
    practicalCredit: integer(),
    fullMarksPractical: integer(),
    internalCredit: integer(),
    fullMarksInternal: integer(),
    projectCredit: integer(),
    fullMarksProject: integer(),
    vivalCredit: integer(),
    fullMarksViva: integer(),
    fullMarks: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectMetadataSchema = createInsertSchema(subjectMetadataModel);

export type SubjectMetadata = z.infer<typeof createSubjectMetadataSchema>;