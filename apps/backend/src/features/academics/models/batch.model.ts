import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { courseModel } from "./course.model.js";
import { classModel } from "./class.model.js";
import { sectionModel } from "./section.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { shiftModel } from "./shift.model.js";
import { sessionModel } from "./session.model.js";
import { academicYearModel } from "./academic-year.model.js";

export const batchModel = pgTable('batches', {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    courseId: integer("course_id_fk")
        .notNull()
        .references(() => courseModel.id),
    classId: integer("class_id_fk").notNull().references(() => classModel.id),
    sectionId: integer("section_id_fk").references(() => sectionModel.id),
    shiftId: integer("shift_id_fk").references(() => shiftModel.id),
    sessionId: integer("session_id_fk").references(() => sessionModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const batchRelations = relations(batchModel, ({ one }) => ({
    course: one(courseModel, {
        fields: [batchModel.courseId],
        references: [courseModel.id],
    }),
    selectedClass: one(classModel, {
        fields: [batchModel.classId],
        references: [classModel.id],
    }),
    section: one(sectionModel, {
        fields: [batchModel.sectionId],
        references: [sectionModel.id],
    }),
    shift: one(shiftModel, {
        fields: [batchModel.shiftId],
        references: [shiftModel.id],
    }),
    session: one(sessionModel, {
        fields: [batchModel.sessionId],
        references: [sessionModel.id],
    }),
}));

export const createBatchSchema = createInsertSchema(batchModel);

export type Batch = z.infer<typeof createBatchSchema>;