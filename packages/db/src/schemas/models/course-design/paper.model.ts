import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
    boolean,
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

import { academicYearModel, classModel } from "@/schemas/models/academics";
import {
    subjectTypeModel,
    subjectModel,
    affiliationModel,
    regulationTypeModel,
    programCourseModel,
} from "@/schemas/models/course-design";

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
        .references(() => programCourseModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 255 }).notNull(),
    isOptional: boolean().default(false),
    sequence: integer(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createPaperModel = createInsertSchema(paperModel) as z.ZodTypeAny;

export type Paper = z.infer<typeof createPaperModel>;

export type PaperT = typeof createPaperModel._type;