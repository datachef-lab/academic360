import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "../user";

export const feeHeadModel = pgTable("fee_heads", {
    id: serial().primaryKey(),
    legacyFeeHeadId: integer(),
    name: varchar({ length: 255 }).notNull(),
    defaultPercentage: doublePrecision().default(0).notNull(),
    sequence: integer(),
    remarks: varchar({ length: 500 }),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
});

export const createFeeHeadSchema = createInsertSchema(feeHeadModel);

export type FeeHead = z.infer<typeof createFeeHeadSchema>;

export type FeeHeadT = typeof createFeeHeadSchema._type;