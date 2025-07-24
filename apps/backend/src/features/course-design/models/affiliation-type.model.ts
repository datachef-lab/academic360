import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const affiliationTypes = pgTable("affiliation_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertAffiliationTypeSchema = createInsertSchema(affiliationTypes);
export const selectAffiliationTypeSchema = createSelectSchema(affiliationTypes);
export type AffiliationType = z.infer<typeof selectAffiliationTypeSchema>;
export type NewAffiliationType = z.infer<typeof insertAffiliationTypeSchema>;
