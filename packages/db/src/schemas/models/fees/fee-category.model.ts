import { feeCategoryValidityTypeEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { feeConcessionSlabModel } from "./fee-concession-slab.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";

export const feeCategoryModel = pgTable("fee_categories", {
    id: serial().primaryKey(),
    feeConcessionSlabId: integer("fee_concession_slab_id_fk")
        .references(() => feeConcessionSlabModel.id)
        .notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }).notNull(),
    priority: integer().notNull().unique(),
    validityType: feeCategoryValidityTypeEnum().notNull().default("SEMESTER"),
    isCarryForwarded: boolean().notNull().default(false),
    createdAt: timestamp({withTimezone: true})
        .notNull()
        .defaultNow(),
    updatedAt: timestamp({withTimezone: true})
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
}, (table) => ({
    uniqueFeeCategoryConstraint: unique()
        .on(table.feeConcessionSlabId, table.name, table.validityType),
}));

export const createFeeCategorySchema = createInsertSchema(feeCategoryModel);

export type FeeCategory = z.infer<typeof createFeeCategorySchema>;

export type FeeCategoryT = typeof createFeeCategorySchema._type;