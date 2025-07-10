import { academicYearModel } from "@/features/academics/models/academic-year.model";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { courseModel } from "./course.model";
import { subjectModel } from "./subject.model";
import { classModel } from "@/features/academics/models/class.model";
import { frameworkTypeEnum, subjectCategoryTypeEnum } from "@/features/user/models/helper";
import { specializationModel } from "@/features/course-design/models/specialization.model";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paperModel = pgTable("papers", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    framework: frameworkTypeEnum().notNull(),
    courseId: integer("course_id_fk")
        .references(() => courseModel.id)
        .notNull(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    paperName: varchar({ length: 500 }).notNull(),
    paperCode: varchar({ length: 255 }).notNull(),
    category: subjectCategoryTypeEnum(),
    specializationId: integer("specialization_id_fk")
        .references(() => specializationModel.id),
    codePrefix: varchar({ length: 10 }),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPaperListSchema = createInsertSchema(paperModel);

export type Paper = z.infer<typeof createPaperListSchema>;