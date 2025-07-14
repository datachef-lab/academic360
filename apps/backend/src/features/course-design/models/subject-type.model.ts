import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const subjectTypes = pgTable("subject_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertSubjectTypeSchema = createInsertSchema(subjectTypes);
export const selectSubjectTypeSchema = createSelectSchema(subjectTypes);
export type SubjectType = z.infer<typeof selectSubjectTypeSchema>;
export type NewSubjectType = z.infer<typeof insertSubjectTypeSchema>;
