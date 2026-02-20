import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "../user";

export const feeSlabModel = pgTable("fee_slabs", {
    id: serial().primaryKey(),
    legacyFeeSlabId: integer(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }),
    defaultRate: doublePrecision().default(0),
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

export const createFeeSlabSchema = createInsertSchema(feeSlabModel);

export type FeeSlab = z.infer<typeof createFeeSlabSchema>;

export type FeeSlabT = typeof createFeeSlabSchema._type;