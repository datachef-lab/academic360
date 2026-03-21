import { AnyPgColumn, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { accessGroupModulePermissionEnum } from "@/schemas/enums";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";
import { accessGroupModuleModel } from "./access-group-module.model";

export const accessGroupModulePermissionModel = pgTable("access_group_module_permissions", {
    id: serial().primaryKey(),
    accessGroupModuleId: integer("access_group_module_id_fk")
        .references((): AnyPgColumn => accessGroupModuleModel.id)
        .notNull(),
    type: accessGroupModulePermissionEnum().notNull().default("READ"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    accessGroupModulePermissionTypeUnique: unique("uq_access_group_module_permission_type").on(
        table.accessGroupModuleId,
        table.type,
    )
}));

export const createAccessGroupModulePermissionSchema = createInsertSchema(accessGroupModulePermissionModel);

export type AccessGroupModulePermission = z.infer<typeof createAccessGroupModulePermissionSchema>;

export type AccessGroupModulePermissionT = typeof createAccessGroupModulePermissionSchema._type;
