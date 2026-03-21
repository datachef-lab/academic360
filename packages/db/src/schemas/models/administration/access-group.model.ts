import { accessGroupTypeEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { userStatusMasterModel } from "./user-status-master.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const accessGroupModel = pgTable("access_groups",  {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    type: accessGroupTypeEnum().default("BASIC").notNull(),
    userStatusId: integer("user_status_id_fk")
        .references(() => userStatusMasterModel.id)
        .notNull(),
    code: varchar({ length: 255 }),
    description: varchar({ length: 1000 }),
    remarks: varchar({ length: 500 }),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    nameTypeUserStatusUnique: unique("uq_name_user_status").on(
        table.name,
        table.type,
        table.userStatusId,
    ),
}));

export const createAccessGroupSchema = createInsertSchema(accessGroupModel);

export type AccessGroup = z.infer<typeof createAccessGroupSchema>;

export type AccessGroupT = typeof createAccessGroupSchema._type;