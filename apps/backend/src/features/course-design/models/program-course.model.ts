import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { streams } from "./stream.model";
import { courses } from "./course.model";
import { courseTypes } from "./course-type.model";
import { courseLevels } from "./course-level.model";
import { affiliationTypes } from "./affiliation-type.model";
import { regulationTypes } from "./regulation-type.model";

export const programCourses = pgTable("program_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  streamId: uuid("stream_id").references(() => streams.id),
  courseId: uuid("course_id").references(() => courses.id),
  courseTypeId: uuid("course_type_id").references(() => courseTypes.id),
  courseLevelId: uuid("course_level_id").references(() => courseLevels.id),
  duration: integer("duration").notNull(),
  totalSemesters: integer("total_semesters").notNull(),
  affiliationTypeId: uuid("affiliation_type_id").references(() => affiliationTypes.id),
  regulationTypeId: uuid("regulation_type_id").references(() => regulationTypes.id),
  status: boolean("status").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertProgramCourseSchema = createInsertSchema(programCourses);
export const selectProgramCourseSchema = createSelectSchema(programCourses);
export type ProgramCourse = z.infer<typeof selectProgramCourseSchema>;
export type NewProgramCourse = z.infer<typeof insertProgramCourseSchema>;
