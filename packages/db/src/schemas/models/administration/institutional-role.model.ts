import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { userModel } from "../user";
import { userTypeModel } from "./user-type.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const institutionalRoleModel = pgTable("institutional_roles", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    userTypeId: integer("user_type_id_fk")
        .references(() => userTypeModel.id)
        .notNull(),
    validTill: timestamp({ withTimezone: true }),
    approvedByUserId: integer("approved_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    isPrimary: boolean().default(true).notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true })
          .notNull()
          .defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createUserInstitutionalRoleModelSchema = createInsertSchema(institutionalRoleModel);

export type UserInstitutionalRole = z.infer<typeof createUserInstitutionalRoleModelSchema>;

export type UserInstitutionalRoleT = typeof createUserInstitutionalRoleModelSchema._type;