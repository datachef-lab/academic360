import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, varchar, boolean, timestamp, text, integer } from "drizzle-orm/pg-core";

import { userTypeEnum } from "@/schemas/enums";
import { institutionalRoleModel } from "../administration/institutional-role.model";
// import { personalDetailsModel } from "./personalDetails.model";

export const userModel = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 500 }).unique().notNull(),
    password: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }),
    whatsappNumber: varchar({ length: 255 }),
    image: varchar({ length: 255 }),
    type: userTypeEnum().notNull(),
    isSuspended: boolean().default(false),
    suspendedReason: text(),
    suspendedTillDate: timestamp(),
    institutionalRoleId: integer("institutional_role_id_fk")
        .references(() => institutionalRoleModel.id),
    isActive: boolean().default(true),
    sendStagingNotifications: boolean().default(false),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserSchema = createInsertSchema(userModel);

export type User = z.infer<typeof createUserSchema>;

export type UserT = typeof createUserSchema._type;