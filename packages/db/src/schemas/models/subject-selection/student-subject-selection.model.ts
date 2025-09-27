import { AnyPgColumn, boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { studentModel, userModel } from "../user";
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
    // Versioning fields
    version: integer("version").default(1).notNull(), // Version number (1, 2, 3, etc.)
    parentId: integer("parent_id_fk")
        .references((): AnyPgColumn => studentSubjectSelectionModel.id), // Reference to the original selection (for version chain)
    isDeprecated: boolean("is_deprecated").default(false), // Mark old versions as deprecated
    isActive: boolean("is_active").default(true), // Current active version
    // Audit fields
    createdBy: integer("created_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(), // Who created this version (student/admin)
    changeReason: text("change_reason"), // Reason for the change (admin notes)
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createStudentSubjectSelection = createInsertSchema(studentSubjectSelectionModel);

export type StudentSubjectSelection = z.infer<typeof createStudentSubjectSelection>;

export type StudentSubjectSelectionT = typeof createStudentSubjectSelection._type;