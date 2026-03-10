import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userStatusModel } from "./user-status.model";

export const userStatusReasonModel = pgTable("user_status_reasons", {
    id: serial().primaryKey(),
    userStatusId: integer("user_status_id_fk")
        .references(() => userStatusModel.id)
        .notNull(),
    name: varchar({length: 255 }).notNull(),
    description: varchar({length: 1000 }),
    remarks: varchar({length: 500 }),
    isTerminal: boolean().notNull().default(false),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    userStatusNameUnique: unique("uq_user_status").on(
        table.userStatusId,
        table.name,
    )
}));

export const createUserStatusReasonSchema = createInsertSchema(userStatusReasonModel);

export type UserStatusReason = z.infer<typeof createUserStatusReasonSchema>;

export type UserStatusReasonT = typeof createUserStatusReasonSchema._type;