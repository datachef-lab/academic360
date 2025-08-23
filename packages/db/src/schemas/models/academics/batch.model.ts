import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { courseModel } from "@/schemas/models/course-design";
import { classModel, sectionModel, shiftModel, sessionModel } from "@/schemas/models/academics";

export const batchModel = pgTable('batches', {
    id: serial().primaryKey(),
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