import { boardUniversityModel } from "@/features/resources/models/boardUniversity.model.js";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const academicSubjectModel = pgTable("academic_subjects", {
    id: serial("id").primaryKey(),
    boardUniversityId: integer("board_university_id_fk").references(() => boardUniversityModel.id).notNull(),
    name: varchar("name", { length: 500 }).notNull(),
    passingMarks: integer("passing_marks"),
    disabled: boolean().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createAcademicSubjects = createInsertSchema(academicSubjectModel);

export type AcademicSubject = z.infer<typeof createAcademicSubjects>;