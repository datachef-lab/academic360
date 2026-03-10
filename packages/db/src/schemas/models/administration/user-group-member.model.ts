import { integer, pgEnum, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { userGroupModel } from "./user-group.model";
import { userTypeEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userGroupMemberModel = pgTable("user_group_members", {
    id: serial().primaryKey(),
    userGroupId: integer("user_group_id_fk")
        .references(() => userGroupModel.id)
        .notNull(),
    member: userTypeEnum().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    userGroupMemberUnique: unique("uq_user_group_member").on(
        table.userGroupId,
        table.member,
    )
}));

export const createUserGroupMemberSchema = createInsertSchema(userGroupMemberModel);

export type UserGroupMember = z.infer<typeof createUserGroupMemberSchema>;

export type UserGroupMemberT = typeof createUserGroupMemberSchema._type;