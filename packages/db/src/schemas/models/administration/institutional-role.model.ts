import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { userTypeModel } from "./user-type.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { identityMasterModel } from "./identity-master.model";

export const institutionalRoleModel = pgTable("institutional_roles", {
    id: serial().primaryKey(),
    identityMasterId: integer("identity_master_id_fk")
        .references(() => identityMasterModel.id)
        .notNull(),
    userTypeId: integer("user_type_id_fk")
        .references(() => userTypeModel.id)
        .notNull(),
    validTill: timestamp({ withTimezone: true }),
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