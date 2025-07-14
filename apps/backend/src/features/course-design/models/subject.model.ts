import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { specializations } from "./specialization.model";
import { subjectTypes } from "./subject-type.model";

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  credits: integer("credits").notNull(),
  subjectTypeId: uuid("subject_type_id").references(() => subjectTypes.id, { onDelete: "restrict" }).notNull(),
  specializationId: uuid("specialization_id").references(() => specializations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertSubjectSchema = createInsertSchema(subjects);
export const selectSubjectSchema = createSelectSchema(subjects);
export type Subject = z.infer<typeof selectSubjectSchema>;
export type NewSubject = z.infer<typeof insertSubjectSchema>;
