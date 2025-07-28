import { boolean, integer, pgTable, serial, text, timestamp,  } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const affiliationTypeModel = pgTable("affiliation_types", {
  id: serial().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sequence: integer("sequence").default(0),
  disabled: boolean("disabled").default(false),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertAffiliationTypeSchema = createInsertSchema(affiliationTypeModel);
export const selectAffiliationTypeSchema = createSelectSchema(affiliationTypeModel);
export type AffiliationType = z.infer<typeof selectAffiliationTypeSchema>;
export type NewAffiliationType = z.infer<typeof insertAffiliationTypeSchema>;
