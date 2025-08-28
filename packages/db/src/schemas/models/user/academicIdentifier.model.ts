import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { frameworkTypeEnum } from "@/schemas/enums";
import { studentModel } from "@/schemas/models/user";
import { courseModel, programCourseModel } from "@/schemas/models/course-design";
import { sectionModel, shiftModel } from "@/schemas/models/academics";

export const academicIdentifierModel = pgTable("academic_identifiers", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().unique().references(() => studentModel.id),
    rfid: varchar({ length: 255 }),
    // streamId: integer("stream_id_fk").references(() => streamModel.id),
    programCourseId: integer("program_course_id_fk").references(() => programCourseModel.id),
    
    cuFormNumber: varchar({ length: 255 }),
    uid: varchar({ length: 255 }),
    oldUid: varchar({ length: 255 }),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
    sectionId: integer("section_id_fk").references(() => sectionModel.id),
    classRollNumber: varchar({ length: 255 }),
    apaarId: varchar({ length: 255 }),
    abcId: varchar({ length: 255 }),
    apprid: varchar({ length: 255 }),
    checkRepeat: boolean(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAcademicIdentifierSchema = createInsertSchema(academicIdentifierModel);

export type AcademicIdentifier = z.infer<typeof createAcademicIdentifierSchema>;