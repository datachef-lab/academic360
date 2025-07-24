import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const regulationTypes = pgTable("regulation_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertRegulationTypeSchema = createInsertSchema(regulationTypes);
export const selectRegulationTypeSchema = createSelectSchema(regulationTypes);
export type RegulationType = z.infer<typeof selectRegulationTypeSchema>;
export type NewRegulationType = z.infer<typeof insertRegulationTypeSchema>;
