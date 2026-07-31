import { z } from "zod";
import { boolean, doublePrecision, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";


// import { subjectModel } from "../course-design";
import { boardModel } from "../resources";
import { boardSubjectNameModel } from "./board-subject-name.model";

export const boardSubjectModel = pgTable("board_subjects", {
    id: serial("id").primaryKey(),
    legacyBoardSubjectMappingSubId: integer("legacy_board_subject_mapping_sub_id"),
    boardId: integer("board_id_fk").references(() => boardModel.id).notNull(),
    boardSubjectNameId: integer("board_subject_name_id_fk").references(() => boardSubjectNameModel.id).notNull(),
    fullMarksTheory: doublePrecision("full_marks_theory"),
    passingMarksTheory: doublePrecision("passing_marks_theory"),
    fullMarksPractical: doublePrecision("full_marks_practical"),
    passingMarksPractical: doublePrecision("passing_marks_practical"),
    isActive: boolean().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    // (board, subject) is the natural key. Nothing enforced it, and the
    // per-student legacy importer inserted a fresh row whenever the legacy
    // mapping lookup fell through — 14,307 rows for 661 real pairs. The app
    // guards this now too, but the constraint is what makes it impossible.
    uniqueBoardSubject: unique("board_subjects_board_id_fk_board_subject_name_id_fk_unique").on(
        t.boardId,
        t.boardSubjectNameId,
    ),
}));

export const createBoardSubjects = createInsertSchema(boardSubjectModel);

export type BoardSubject = z.infer<typeof createBoardSubjects>;

export type BoardSubjectT = typeof createBoardSubjects._type;