import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { accessGroupModel } from "./access-group.model";
import { appModuleModel } from "./app-module.model";

export const accessGroupModuleModel = pgTable("access_group__module", {
    id: serial().primaryKey(),
    accessGroupId: integer("access_group_id_fk")
        .references(() => accessGroupModel.id)
        .notNull(),
    appModuleId: integer("app_module_id_fk")
        .references(() => appModuleModel.id)
        .notNull(),
    isAvailable: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAccessGroupModuleSchema = createInsertSchema(accessGroupModuleModel);

export type AccessGroupModule = z.infer<typeof createAccessGroupModuleSchema>;

export type AccessGroupModuleT = typeof createAccessGroupModuleSchema._type;