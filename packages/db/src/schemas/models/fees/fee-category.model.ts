
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import z from "zod";
import { createInsertSchema } from "drizzle-zod";
import { userModel } from "../user";

export const feeCategoryModel = pgTable("fee_categories", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 500 }),
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
});

export const createFeeCategorySchema = createInsertSchema(feeCategoryModel);

export type FeeCategory = z.infer<typeof createFeeCategorySchema>;

export type FeeCategoryT = typeof createFeeCategorySchema._type;