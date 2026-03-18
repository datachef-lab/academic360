import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { classModel } from "../academics";
import { accessGroupModuleModel } from "./access-group-module.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const accessGroupModuleClassModel = pgTable("access_group_module__class", {
    id: serial().primaryKey(),
    accessGroupModuleId: integer("access_group_module_id_fk")
        .references(() => accessGroupModuleModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    isAvailable: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAccessGroupModuleClassSchema = createInsertSchema(accessGroupModuleClassModel);

export type AccessGroupModuleClass = z.infer<typeof createAccessGroupModuleClassSchema>;

export type AccessGroupModuleClassT = typeof createAccessGroupModuleClassSchema._type;