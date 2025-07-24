import { academicYearModel } from "@/features/academics/models/academic-year.model";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { courseModel } from "./course.model";
import { subjectModel } from "./subject.model";
import { classModel } from "@/features/academics/models/class.model";
import { frameworkTypeEnum, subjectCategoryTypeEnum } from "@/features/user/models/helper";
import { specializationModel } from "@/features/course-design/models/specialization.model";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { regulationTypeModel } from "./regulation-type.model";
import { affiliationModel } from "./affiliation.model";

export const subjectPaperModel = pgTable("subject_papers", {
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
    
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectPaperSchema = createInsertSchema(subjectPaperModel);

export type SubjectPaper = z.infer<typeof createSubjectPaperSchema>;