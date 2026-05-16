import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { affiliationModel } from "../course-design";
import { promotionBuilderLogicTypeEnum } from "@/schemas/enums";
import { classModel } from "../academics";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const promotionBuilderModel = pgTable("promotion_builder", {
    id: serial().primaryKey(),
    affiliationId: integer("affiliation_id_fk")
        .references(() => affiliationModel.id)
        .notNull(),
    logic: promotionBuilderLogicTypeEnum().notNull().default("AUTO_PROMOTE"),
    targetClassId: integer("target_class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createPromotionBuilderSchema = createInsertSchema(promotionBuilderModel);

export type PromotionBuilder = z.infer<typeof createPromotionBuilderSchema>;

export type PromotionBuilderT = typeof createPromotionBuilderSchema._type;