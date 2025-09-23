import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { relatedSubjectMainModel } from "./related-subject-main.model";
import {
    //  boardSubjectNameModel,
     boardSubjectUnivSubjectMappingModel } from "../admissions";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const relatedSubjectSubModel = pgTable("related_subjects_sub", {
    id: serial().primaryKey(),
    relatedSubjectMainId: integer("related_subject_main_id_fk")
        .references(() => relatedSubjectMainModel.id),
    boardSubjectUnivSubjectMappingId: integer("board_subject_univ_subject_mapping_id_fk")
        .references(() => boardSubjectUnivSubjectMappingModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRelatedSubjectSub = createInsertSchema(relatedSubjectSubModel);

export type RelatedSubjectSub = z.infer<typeof createRelatedSubjectSub>;

export type RelatedSubjectSubT = typeof createRelatedSubjectSub._type;