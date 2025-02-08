import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
<<<<<<< HEAD
import { streamModel } from "@/features/academics/models/stream.model.ts";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { specializationModel } from "@/features/user/models/specialization.model.ts";
import { courseTypeEnum } from "@/features/user/models/academicIdentifier.model.ts";
=======
import { streamModel } from "@/features/academics/models/stream.model.js";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { specializationModel } from "@/features/user/models/specialization.model.js";
import { courseTypeEnum } from "@/features/user/models/academicIdentifier.model.js";
>>>>>>> 90004db6fb605e03f0ecb8df3be32b6658a1417b

export const subjectCategoryTypeEnum = pgEnum("subject_category_type", [
    "SPECIAL",
    "COMMON",
    "HONOURS",
    "GENERAL",
    "ELECTIVE",
]);

export const subjectTypeEnum = pgEnum("subject_type", [
    "ABILITY ENHANCEMENT COMPULSORY COURSE",
    "CORE COURSE",
    "GENERIC ELECTIVE",
    "DISCIPLINE SPECIFIC ELECTIVE",
    "SKILL ENHANCEMENT COURSE",
]);

export const frameworkTypeEnum = pgEnum("framework_type", ["CCF", "CBCS"]);

export const subjectMetadataModel = pgTable("subject_metadatas", {
    id: serial().primaryKey(),
    streamId: integer("stream_id_fk").notNull().references(() => streamModel.id),
    semester: integer().notNull(),
    framework: frameworkTypeEnum().notNull(),
    specializationId: integer("specialization_id_fk").references(() => specializationModel.id),
    category: subjectCategoryTypeEnum(),
    subjectType: subjectTypeEnum().notNull().default("CORE COURSE"),
    name: varchar({ length: 255 }).notNull(),
    credit: integer(),
    fullMarksTheory: integer(),
    fullMarksTutorial: integer(),
    fullMarksInternal: integer(),
    fullMarksPractical: integer(),
    fullMarks: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const subjectMetadataRelations = relations(subjectMetadataModel, ({ one }) => ({
    stream: one(streamModel, {
        fields: [subjectMetadataModel.id],
        references: [streamModel.id]
    }),
    specialization: one(specializationModel, {
        fields: [subjectMetadataModel.specializationId],
        references: [specializationModel.id]
    }),
}));

export const createSubjectMetadataSchema = createInsertSchema(subjectMetadataModel);

export type SubjectMetadata = z.infer<typeof createSubjectMetadataSchema>;