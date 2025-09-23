import { pgTable, integer, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { programCourseModel, subjectTypeModel } from "../course-design";
import {
    // boardSubjectNameModel,
     boardSubjectUnivSubjectMappingModel } from "../admissions";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { academicYearModel } from "../academics";

export const relatedSubjectMainModel = pgTable("related_subjects_main", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id),
    boardSubjectUnivSubjectMappingId: integer("board_subject_univ_subject_mapping_id_fk")
        .references(() => boardSubjectUnivSubjectMappingModel.id),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRelatedSubjectMain = createInsertSchema(relatedSubjectMainModel);

export type RelatedSubjectMain = z.infer<typeof createRelatedSubjectMain>;

export type RelatedSubjectMainT = typeof createRelatedSubjectMain._type;