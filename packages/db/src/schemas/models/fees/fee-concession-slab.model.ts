import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "../user";

export const feeConcessionSlabModel = pgTable("fee_concession_slabs", {
    id: serial().primaryKey(),
    legacyFeeSlabId: integer(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }).notNull(),
    defaultConcessionRate: doublePrecision().default(0),
    sequence: integer(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
});

export const createFeeConcessionSlabSchema = createInsertSchema(feeConcessionSlabModel);

export type FeeConcessionSlab = z.infer<typeof createFeeConcessionSlabSchema>;

export type FeeConcessionSlabT = typeof createFeeConcessionSlabSchema._type;