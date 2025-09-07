import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { feesStructureModel } from "./fees-structure.model.js";
import { feesHeadModel } from "./fees-head.model.js";

export const feesComponentModel = pgTable("fees_components", {
  id: serial().primaryKey(),
  feesStructureId: integer("fees_structure_id_fk")
    .references(() => feesStructureModel.id)
    .notNull(),
  feesHeadId: integer("fees_head_id_fk")
    .references(() => feesHeadModel.id)
    .notNull(),
  isConcessionApplicable: boolean().notNull().default(false),
  baseAmount: doublePrecision().notNull(),
  sequence: integer().notNull(),
  remarks: varchar({ length: 500 }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createFeesComponentSchema = createInsertSchema(feesComponentModel);

export type FeesComponent = z.infer<typeof createFeesComponentSchema>;
