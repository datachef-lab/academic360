import { academic360ApplicationDomainEnum } from "../../../schemas/enums";
import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { userGroupModel } from "./user-group.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userGroupDomainModel = pgTable("user_group_domains", {
    id: serial().primaryKey(),
    userGroupId: integer("user_group_id_fk")
        .references(() => userGroupModel.id)
        .notNull(),
    domain: academic360ApplicationDomainEnum().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    userGroupDomainUnique: unique("uq_user_group_domain").on(
        table.userGroupId,
        table.domain,
    )
}));

export const createUserGroupDomainSchema = createInsertSchema(userGroupDomainModel);

export type UserGroupDomain = z.infer<typeof createUserGroupDomainSchema>;

export type UserGroupDomainT = typeof createUserGroupDomainSchema._type;