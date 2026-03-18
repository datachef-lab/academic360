import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { accessGroupModel } from "./access-group.model";
import { userTypeModel } from "./user-type.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const accessGroupUserTypeModel = pgTable("access_group__user_type", {
    id: serial().primaryKey(),
    accessGroupId: integer("access_group_id_fk")
        .references(() => accessGroupModel.id)
        .notNull(),
    userTypeId: integer("user_type_id_fk")
        .references(() => userTypeModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    accessGroupUserTypeUq: unique("access_group__user_type_uq").on(
        table.accessGroupId,
        table.userTypeId,
    )
}));

export const createAccessGroupUserTypeSchema = createInsertSchema(accessGroupUserTypeModel);

export type AccessGroupUserType = z.infer<typeof createAccessGroupUserTypeSchema>;

export type AccessGroupUserTypeT = typeof createAccessGroupUserTypeSchema._type;
