import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const promotionClauseModel = pgTable("promotion_clause", {
    id: serial().primaryKey(),
    name: varchar().notNull(),
    description: varchar(),
    color: varchar(),
    bgColor: varchar(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()), 
});

export const createPromotionClauseSchema = createInsertSchema(promotionClauseModel);

export type PromotionClause = z.infer<typeof createPromotionClauseSchema>;    

export type PromotionClauseT = typeof createPromotionClauseSchema._type;