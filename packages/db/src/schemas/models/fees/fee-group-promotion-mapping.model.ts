import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { promotionModel } from "../batches";

import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";
import { feeGroupModel } from "./fee-group.model";

export const feeGroupPromotionMappingModel = pgTable("fee_group_promotion_mappings", {
    id: serial().primaryKey(),
    feeGroupId: integer("fee_group_id_fk").
        references(() => feeGroupModel.id)
        .notNull(),
    promotionId: integer("promotion_id_fk")
        .references(() => promotionModel.id)
        .notNull(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
}, (table) => ({
    uniqueFeeGroupPromotionConstraint: unique()
        .on(table.feeGroupId, table.promotionId),
}));

export const createFeeGroupPromotionMappingSchema = createInsertSchema(feeGroupPromotionMappingModel);

export type FeeGroupPromotionMapping = z.infer<typeof createFeeGroupPromotionMappingSchema>;

export type FeeGroupPromotionMappingT = typeof createFeeGroupPromotionMappingSchema._type;