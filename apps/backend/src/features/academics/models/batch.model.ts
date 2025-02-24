import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { courseModel } from "./course.model.js";
import { classModel } from "./class.model.js";
import { sectionModel } from "./section.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const batchModel = pgTable('batches', {
    id: serial().primaryKey(),
    courseId: integer("course_id_fk").notNull().references(() => courseModel.id),
    classId: integer("class_id_fk").notNull().references(() => classModel.id),
    sectionId: integer("section_id_fk").references(() => sectionModel.id),
    session: integer().notNull(),
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
    sectionId: one(sectionModel, {
        fields: [batchModel.sectionId],
        references: [sectionModel.id],
    }),
}));

export const createBatchSchema = createInsertSchema(batchModel);

export type Batch = z.infer<typeof createBatchSchema>;