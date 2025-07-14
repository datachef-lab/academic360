import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { courses } from "./course.model";

export const specializations = pgTable("specializations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertSpecializationSchema = createInsertSchema(specializations);
export const selectSpecializationSchema = createSelectSchema(specializations);
export type Specialization = z.infer<typeof selectSpecializationSchema>;
export type NewSpecialization = z.infer<typeof insertSpecializationSchema>;
