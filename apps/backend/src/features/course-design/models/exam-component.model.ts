import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { subjects } from "./subject.model";

export const examComponents = pgTable("exam_components", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  maxMarks: integer("max_marks").notNull(),
  passingMarks: integer("passing_marks").notNull(),
  weight: integer("weight").notNull(),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertExamComponentSchema = createInsertSchema(examComponents);
export const selectExamComponentSchema = createSelectSchema(examComponents);
export type ExamComponent = z.infer<typeof selectExamComponentSchema>;
export type NewExamComponent = z.infer<typeof insertExamComponentSchema>;
