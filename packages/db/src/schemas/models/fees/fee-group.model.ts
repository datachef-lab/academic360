import { feeCategoryValidityTypeEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";
import { feeSlabModel } from "./fee-slab.model";
import { feeCategoryModel } from "./fee-category.model";

export const feeGroupModel = pgTable("fee_groups", {
    id: serial().primaryKey(),
    feeCategoryId: integer("fee_category_id_fk")
        .references(() => feeCategoryModel.id)
        .notNull(),
    feeSlabId: integer("fee_slab_id_fk")
        .references(() => feeSlabModel.id)
        .notNull(),
    description: varchar({ length: 500 }),
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
        .on(table.feeCategoryId, table.feeSlabId, table.validityType),
}));

export const createFeeGroupSchema = createInsertSchema(feeGroupModel);

export type FeeGroup = z.infer<typeof createFeeGroupSchema>;

export type FeeGroupT = typeof createFeeGroupSchema._type;