import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { papers } from "./paper.model";

export const paperComponents = pgTable("paper_components", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  maxMarks: integer("max_marks").notNull(),
  passingMarks: integer("passing_marks").notNull(),
  paperId: uuid("paper_id").references(() => papers.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertPaperComponentSchema = createInsertSchema(paperComponents);
export const selectPaperComponentSchema = createSelectSchema(paperComponents);
export type PaperComponent = z.infer<typeof selectPaperComponentSchema>;
export type NewPaperComponent = z.infer<typeof insertPaperComponentSchema>;
