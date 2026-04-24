import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { promotionClauseClassMappingModel } from "./promotion-clause-class-mapping.model";
import { promotionBuilderClauseMappingModel } from "./promotion-builder-clause-mapping.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const promotionBuilderClauseClassMappingModel = pgTable("promotion_builder_clause_class_mapping", {
    id: serial().primaryKey(),
    promotionBuilderClauseId: integer("promotion_builder_clause_id_fk")
        .references(() => promotionBuilderClauseMappingModel.id)
        .notNull(),
    promotionClauseClassId: integer("promotion_clause_class_id_fk")
        .references(() => promotionClauseClassMappingModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
 }, (table) => ({
     uniquePromotionBuilderClauseClass: unique("uq_promotion_builder_clause_class").on(
        table.promotionBuilderClauseId,
        table.promotionClauseClassId,
    ),
}));

export const createPromotionBuilderClauseClassMappingSchema = createInsertSchema(promotionBuilderClauseClassMappingModel);

export type PromotionBuilderClauseClassMapping = z.infer<typeof createPromotionBuilderClauseClassMappingSchema>;

export type PromotionBuilderClauseClassMappingT = typeof createPromotionBuilderClauseClassMappingSchema._type;