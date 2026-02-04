import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { promotionModel } from "../batches";
import { feeCategoryModel } from "./fee-category.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";

export const feeCategoryPromotionMappingModel = pgTable("fee_category_promotion_mappings", {
    id: serial().primaryKey(),
    feeCategoryId: integer("fee_category_id_fk").
        references(() => feeCategoryModel.id)
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
});

export const createFeeCategoryPromotionMappingSchema = createInsertSchema(feeCategoryPromotionMappingModel);

export type FeeCategoryPromotionMapping = z.infer<typeof createFeeCategoryPromotionMappingSchema>;

export type FeeCategoryPromotionMappingT = typeof createFeeCategoryPromotionMappingSchema._type;