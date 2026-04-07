import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { promotionBuilderModel } from "./promotion-builder.model";
import { promotionClauseModel } from "./promotion-clause.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";
import { promotionBuilderOperatorEnum } from "@/schemas/enums";


export const promotionBuilderClauseMappingModel = pgTable("promotion_builder_clause_mapping", {
    id: serial().primaryKey(),
    promotionBuilderId: integer("promotion_builder_id_fk")
        .references(() => promotionBuilderModel.id)
        .notNull(),
    promotionClauseId: integer("promotion_clause_id_fk")
        .references(() => promotionClauseModel.id)
        .notNull(),
    operator: promotionBuilderOperatorEnum().notNull().default("EQUALS"),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
 }, (table) => ({
     uniquePromotionBuilderClause: unique("uq_promotion_builder_clause").on(
         table.promotionBuilderId,
         table.promotionClauseId,
     ),
 }));
 
export const createPromotionBuilderClauseMappingSchema = createInsertSchema(promotionBuilderClauseMappingModel);

export type PromotionBuilderClauseMapping = z.infer<typeof createPromotionBuilderClauseMappingSchema>;

export type PromotionBuilderClauseMappingT = typeof createPromotionBuilderClauseMappingSchema._type;