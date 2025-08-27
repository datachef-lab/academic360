import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { courseModel } from "../course-design";
import { classModel } from "../academics";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const studentCategoryModel = pgTable("student_category", {
    id: serial().primaryKey(),
    legacyStudentCategoryId: integer("legacy_student_category_id").notNull(),
    name: varchar({ length: 255 }).notNull(),
    documentRequired: boolean().default(false).notNull(),
    courseId: integer("course_id_fk")
        .references(() => courseModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createStudentCategorySchema = createInsertSchema(studentCategoryModel);

export type StudentCategory = z.infer<typeof createStudentCategorySchema>;