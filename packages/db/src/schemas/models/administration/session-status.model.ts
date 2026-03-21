import { integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { sessionModel } from "../academics";

import { userStatusMasterModel } from "./user-status-master.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";
import { userModel } from "../user";

export const sessionStatusModel = pgTable("session_statuses", {
    id: serial().primaryKey(),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    userId: integer("user_id_fk")
        .references(() =>userModel.id)
        .notNull(),
    userStatusMasterId: integer("user_status_master_id_fk")
        .references(() => userStatusMasterModel.id)
        .notNull(),
    remarks: varchar({length: 500}),
    suspendedTillDate: timestamp({ withTimezone: true }),
    byUserId: integer("by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
}, (table) => ({
    sessionRoleUserStatusUnique: unique("uq_session_role_user_status").on(
        table.sessionId,
        table.userId,
        table.userStatusMasterId
    )
}));

export const createSessionStatusSchema = createInsertSchema(sessionStatusModel);

export type SessionStatus = z.infer<typeof createSessionStatusSchema>;

export type SessionStatusT = typeof createSessionStatusSchema._type;