import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user/user.model";
import { sessionModel } from "../academics";
import { userStatusReasonModel } from "./user-status-reason.model";

export const userStatusSessionMappingModel = pgTable("user_status_session_mapping", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    userStatusReasonId: integer("user_status_reason_id_fk")
        .references(() => userStatusReasonModel.id),
    suspendedTillDate: timestamp({ withTimezone: true }),
    remarks: varchar({length: 255}),
    byUserId: integer("by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    userSessionStatusReasonUnique: unique("uq_user_session_status_reason").on(
        table.userId,
        table.sessionId,
        table.userStatusReasonId,
    )
}));

export const createUserStatusSessionMappingSchema = createInsertSchema(userStatusSessionMappingModel);

export type UserStatusSessionMapping = z.infer<typeof createUserStatusSessionMappingSchema>;

export type UserStatusSessionMappingT = typeof createUserStatusSessionMappingSchema._type;
