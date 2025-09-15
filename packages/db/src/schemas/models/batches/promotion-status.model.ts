import { promotionStatusTypeEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
export const promotionStatusModel = pgTable("promotion_status", {
    id: serial().primaryKey(),
    legacyPromotionStatusId: integer("legacy_promotion_status_id"),
    name: varchar({ length: 255 }).notNull(),
    type: promotionStatusTypeEnum().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const promotionStatusInsertSchema = createInsertSchema(promotionStatusModel);

export type PromotionStatusInsertSchema = z.infer<typeof promotionStatusInsertSchema>;

export type PromotionStatusT = typeof promotionStatusInsertSchema._type