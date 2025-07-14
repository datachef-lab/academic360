import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { papers } from "./paper.model";

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  paperId: uuid("paper_id").references(() => papers.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertTopicSchema = createInsertSchema(topics);
export const selectTopicSchema = createSelectSchema(topics);
export type Topic = z.infer<typeof selectTopicSchema>;
export type NewTopic = z.infer<typeof insertTopicSchema>;
