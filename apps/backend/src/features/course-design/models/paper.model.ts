import {
    boolean,
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { subjectTypeModel } from "./subject-type.model.js";
import { courseModel } from "./course.model.js";
import { classModel } from "@/features/academics/models/class.model.js";
import { subjectModel } from "./subject.model.js";
import { affiliationModel } from "./affiliation.model.js";
import { regulationTypeModel } from "./regulation-type.model.js";
import { academicYearModel } from "@/features/academics/models/academic-year.model.js";
import { programCourses } from "./program-course.model.js";

export const paperModel = pgTable("papers", {
    id: serial().primaryKey(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id)
        .notNull(),
    affiliationId: integer("affiliation_id_fk")
        .references(() => affiliationModel.id)
        .notNull(),
    regulationTypeId: integer("regulation_type_id_fk")
        .references(() => regulationTypeModel.id)
        .notNull(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id)
        .notNull(),
    programCourseId: integer("programe_course_id_fk")
        .references(() => programCourses.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 255 }).notNull(),
    isOptional: boolean().default(false),
    sequence: integer(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createPaperModel = createInsertSchema(paperModel);
export type Paper = z.infer<typeof createPaperModel>;
