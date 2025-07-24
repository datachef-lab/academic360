import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const courseTypes = pgTable("course_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertCourseTypeSchema = createInsertSchema(courseTypes);
export const selectCourseTypeSchema = createSelectSchema(courseTypes);
export type CourseType = z.infer<typeof selectCourseTypeSchema>;
export type NewCourseType = z.infer<typeof insertCourseTypeSchema>;
