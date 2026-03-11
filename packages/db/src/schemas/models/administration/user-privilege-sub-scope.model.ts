import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { userPrivilegeSubModel } from "./user-privilege-sub.model";
import { departmentModel } from "./department.model";
import { designationModel } from "./designation.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const userPrivilegeSubScopeModel = pgTable("user_privilege_sub_scopes", {
    id: serial().primaryKey(),
    userPrivilegeSubId: integer("user_privilege_sub_id_fk")
        .references(() => userPrivilegeSubModel.id)
        .notNull(),
    departmentId: integer("department_id_fk")
        .references(() => departmentModel.id),
    designationId: integer("designation_id_fk")
        .references(() => designationModel.id),
    isAccessible: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
        .$onUpdate(() => new Date()),
}, (table) => ({
    unique: unique("uq_privilege_sub_scope").on(
        table.userPrivilegeSubId,
        table.departmentId,
        table.designationId,
    )
}));

export const createUserPrivilegeSubScopeSchema = createInsertSchema(userPrivilegeSubScopeModel);

export type UserPrivilegeSubScope = z.infer<typeof createUserPrivilegeSubScopeSchema>;

export type UserPrivilegeSubScopeT = typeof createUserPrivilegeSubScopeSchema._type;