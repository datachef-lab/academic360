import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { programCourseModel } from "../course-design";
import { classModel } from "../academics";
import { userModel } from "../user";

export const readingListModel = pgTable("library_reading_lists", {
    id: serial().primaryKey(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id),
    facultyUserId: integer("faculty_user_id_fk")
        .references(() => userModel.id),
    title: varchar({ length: 500 }).notNull(),
    description: varchar({ length: 2000 }),
    isPublished: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createReadingListSchema = createInsertSchema(readingListModel);

export type ReadingList = z.infer<typeof createReadingListSchema>;

export type ReadingListT = typeof createReadingListSchema._type;
