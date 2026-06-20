import { boolean, doublePrecision, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { patronCategoryModel } from "./patron-category.model";
import { itemCategoryModel } from "./item-category.model";

export const circulationPolicyModel = pgTable("library_circulation_policies", {
    id: serial().primaryKey(),
    patronCategoryId: integer("patron_category_id_fk")
        .references(() => patronCategoryModel.id)
        .notNull(),
    itemCategoryId: integer("item_category_id_fk")
        .references(() => itemCategoryModel.id)
        .notNull(),
    loanDays: integer().notNull().default(7),
    finePerDay: doublePrecision().notNull().default(0),
    renewalLimit: integer().notNull().default(0),
    graceDays: integer().notNull().default(0),
    maxCopiesAtOnce: integer().notNull().default(1),
    skipHolidaysInFine: boolean().notNull().default(true),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniquePolicy: unique().on(table.patronCategoryId, table.itemCategoryId),
}));

export const createCirculationPolicySchema = createInsertSchema(circulationPolicyModel);

export type CirculationPolicy = z.infer<typeof createCirculationPolicySchema>;

export type CirculationPolicyT = typeof createCirculationPolicySchema._type;
