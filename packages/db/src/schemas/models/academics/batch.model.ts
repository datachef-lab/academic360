import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { programCourseModel } from "@/schemas/models/course-design";
import { classModel, sectionModel, shiftModel, sessionModel } from "@/schemas/models/academics";

export const batchModel = pgTable('batches', {
    id: serial().primaryKey(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    classId: integer("class_id_fk").notNull().references(() => classModel.id),
    sectionId: integer("section_id_fk").references(() => sectionModel.id),
    shiftId: integer("shift_id_fk").references(() => shiftModel.id),
    sessionId: integer("session_id_fk").references(() => sessionModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBatchSchema = createInsertSchema(batchModel);

export type Batch = z.infer<typeof createBatchSchema>;

export type BatchT = typeof createBatchSchema._type;