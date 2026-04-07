import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";

import { classModel } from "../academics";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { promotionClauseModel } from "./promotion-clause.model";

export const promotionClauseClassMappingModel = pgTable("promotion_clause_class_mapping", {
    id: serial().primaryKey(),
    promotionClauseId: integer("promotion_clause_id_fk")
        .references(() => promotionClauseModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniquePromotionClauseClass: unique("uq_promotion_clause_class").on(
        table.promotionClauseId, 
        table.classId,
    ),
}));

export const createPromotionClauseClassMappingSchema = createInsertSchema(promotionClauseClassMappingModel);

export type PromotionClauseClassMapping = z.infer<typeof createPromotionClauseClassMappingSchema>;

export type PromotionClauseClassMappingT = typeof createPromotionClauseClassMappingSchema._type;