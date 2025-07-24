import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const streams = pgTable("streams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertStreamSchema = createInsertSchema(streams);
export const selectStreamSchema = createSelectSchema(streams);
export type Stream = z.infer<typeof selectStreamSchema>;
export type NewStream = z.infer<typeof insertStreamSchema>;
