import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "../user";

export const addonModel = pgTable("addons", {
    id: serial().primaryKey(),
    legacyAddonId: integer(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
});

export const createAddOnSchema = createInsertSchema(addonModel);

export type AddOn = z.infer<typeof createAddOnSchema>;

export type AddOnT = typeof createAddOnSchema._type;