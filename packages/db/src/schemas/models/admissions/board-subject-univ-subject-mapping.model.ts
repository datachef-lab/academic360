import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { boardSubjectModel } from "./board-subject.model";
import { subjectModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const boardSubjectUnivSubjectMappingModel = pgTable("board_subject_univ_subject_mappings", {
    id: serial().primaryKey(),
    subjectId: integer("subject_id_fk").references(() => subjectModel.id),
    boardSubjectId: integer("board_subject_id_fk").references(() => boardSubjectModel.id),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBoardSubjectUnivSubjectMappingModel = createInsertSchema(boardSubjectUnivSubjectMappingModel);

export type BoardSubjectUnivSubjectMapping = z.infer<typeof createBoardSubjectUnivSubjectMappingModel>;

export type BoardSubjectUnivSubjectMappingT = typeof createBoardSubjectUnivSubjectMappingModel._type;
