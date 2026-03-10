import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userGroupModel } from "./user-group.model";
import { userStatusModel } from "./user-status.model";

export const userPrivilegeModel = pgTable("user_privileges", {
    id: serial().primaryKey(),
    userGroupId: integer("user_group_id_fk")
        .references(() => userGroupModel.id)
        .notNull(),
    userStatusId: integer("user_status_id_fk")
        .references(() => userStatusModel.id)
        .notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    userGroupStatusUnique: unique("uq_user_group_status").on(
        table.userGroupId,
        table.userStatusId,
    )
}));

export const createUserPrivilegeSchema = createInsertSchema(userPrivilegeModel);

export type UserPrivilege = z.infer<typeof createUserPrivilegeSchema>;

export type UserPrivilegeT = typeof createUserPrivilegeSchema._type;