import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { countryModel } from "@/features/resources/models/country.model.js";
import { relations } from "drizzle-orm";

export const stateModel = pgTable("states", {
  id: serial().primaryKey(),
  legacyStateId: integer(),
  countryId: integer()
    .notNull()
    .references(() => countryModel.id),
  name: varchar({ length: 255 }).notNull().unique(),
  sequence: integer().unique(),
  disabled: boolean().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const stateRelations = relations(stateModel, ({ one }) => ({
  country: one(countryModel, {
    fields: [stateModel.countryId],
    references: [countryModel.id],
  }),
}));

export const createStateSchema = createInsertSchema(stateModel);

export type State = z.infer<typeof createStateSchema>;
