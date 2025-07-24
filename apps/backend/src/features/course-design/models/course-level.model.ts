import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const courseLevels = pgTable("course_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertCourseLevelSchema = createInsertSchema(courseLevels);
export const selectCourseLevelSchema = createSelectSchema(courseLevels);
export type CourseLevel = z.infer<typeof selectCourseLevelSchema>;
export type NewCourseLevel = z.infer<typeof insertCourseLevelSchema>;
