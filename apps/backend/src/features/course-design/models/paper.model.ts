import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { subjectPaperModel } from "./subject-paper.model";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { subjectTypeModel } from "./subject-type.model";
import { courseModel } from "./course.model";
import { classModel } from "@/features/academics/models/class.model";

export const paperModel = pgTable("papers", {
    id: serial().primaryKey(),
    subjectPaperId: integer("subject_paper_id_fk")
        .references(() => subjectPaperModel.id)
        .notNull(),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id)
        .notNull(),
    courseId: integer("course_id_fk")
        .references(() => courseModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 255 }).notNull(),
    isOptional: boolean().default(false),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPaperModel = createInsertSchema(paperModel);
export type Paper = z.infer<typeof createPaperModel>;       
