import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { programCourseModel } from "../course-design";
import { classModel } from "../academics";
import { userModel } from "../user";

export const academicArchiveModel = pgTable("library_academic_archives", {
    id: serial().primaryKey(),
    archiveType: varchar({ length: 100 }).notNull(),
    title: varchar({ length: 500 }).notNull(),
    description: varchar({ length: 2000 }),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id),
    classId: integer("class_id_fk")
        .references(() => classModel.id),
    year: integer(),
    fileKey: varchar({ length: 1000 }).notNull(),
    mimeType: varchar({ length: 255 }),
    fileSizeBytes: integer(),
    tags: varchar({ length: 1000 }),
    uploadedByUserId: integer("uploaded_by_user_id_fk")
        .references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAcademicArchiveSchema = createInsertSchema(academicArchiveModel);

export type AcademicArchive = z.infer<typeof createAcademicArchiveSchema>;

export type AcademicArchiveT = typeof createAcademicArchiveSchema._type;
