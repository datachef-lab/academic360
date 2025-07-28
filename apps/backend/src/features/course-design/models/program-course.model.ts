import { pgTable, text, timestamp, integer, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { streamModel } from "./stream.model";
import { courseModel } from "./course.model";
import { courseTypeModel } from "./course-type.model";
import { courseLevelModel } from "./course-level.model";
import { affiliationModel } from "./affiliation.model";
import { regulationTypeModel } from "./regulation-type.model";

export const programCourses = pgTable("program_courses", {
  id: serial().primaryKey(),
  streamId: integer("stream_id_fk").references(() => streamModel.id),
  courseId: integer("course_id_fk").references(() => courseModel.id),
  courseTypeId: integer("course_type_id_fk").references(() => courseTypeModel.id),
  courseLevelId: integer("course_level_id_fk").references(() => courseLevelModel.id),
  duration: integer("duration").notNull(),
  totalSemesters: integer("total_semesters").notNull(),
  affiliationId: integer("affiliation_id_fk").references(() => affiliationModel.id),
  regulationTypeId: integer("regulation_type_id_fk").references(() => regulationTypeModel.id),
  disabled: boolean("disabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertProgramCourseSchema = createInsertSchema(programCourses);
export const selectProgramCourseSchema = createSelectSchema(programCourses);
export type ProgramCourse = z.infer<typeof selectProgramCourseSchema>;
export type NewProgramCourse = z.infer<typeof insertProgramCourseSchema>;
