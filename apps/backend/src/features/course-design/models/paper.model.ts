import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { subjects } from "./subject.model";

export const papers = pgTable("papers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertPaperSchema = createInsertSchema(papers);
export const selectPaperSchema = createSelectSchema(papers);
export type Paper = z.infer<typeof selectPaperSchema>;
export type NewPaper = z.infer<typeof insertPaperSchema>;
