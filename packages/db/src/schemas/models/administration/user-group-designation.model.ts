import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userGroupModel } from "./user-group.model";
import { designationModel } from "./designation.model";

export const userGroupDesignationModel = pgTable("user_group_designations", {
    id: serial().primaryKey(),
    userGroupId: integer("user_group_id_fk")
        .references(() => userGroupModel.id)
        .notNull(),
    designationId: integer("designation_id_fk")
        .references(() => designationModel.id)
        .notNull(),
    isActive: boolean().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
        .$onUpdate(() => new Date()),
}, (table) => ({
    groupDesignationUnique: unique("uq_user_group_designation").on(
        table.userGroupId,
        table.designationId,
    )
}));

export const createUserGroupDesignationSchema = createInsertSchema(userGroupDesignationModel);

export type UserGroupDesignation = z.infer<typeof createUserGroupDesignationSchema>;

export type UserGroupDesignationT = typeof createUserGroupDesignationSchema._type;