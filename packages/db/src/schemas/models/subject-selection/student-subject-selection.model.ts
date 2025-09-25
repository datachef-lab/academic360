import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { studentModel } from "../user";
import { subjectModel } from "../course-design";
import { subjectSelectionMetaModel } from "./subject-selection-meta.model";
import { sessionModel } from "../academics";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const studentSubjectSelectionModel = pgTable("student_subject_selections", {
    id: serial().primaryKey(),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    subjectSelectionMetaId: integer("subject_selection_meta_id_fk")
        .references(() => subjectSelectionMetaModel.id)
        .notNull(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id)
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createStudentSubjectSelection = createInsertSchema(studentSubjectSelectionModel);

export type StudentSubjectSelection = z.infer<typeof createStudentSubjectSelection>;

export type StudentSubjectSelectionT = typeof createStudentSubjectSelection._type;