import { AnyPgColumn, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { appModuleModel } from "./app-module.model";
import { appModulePermissionEnum } from "@/schemas/enums";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const appModulePermissionModel = pgTable("app_module_permissions", {
    id: serial().primaryKey(),
    appModuleId: integer("app_module_id_fk")
        .references((): AnyPgColumn => appModuleModel.id)
        .notNull(),
    type: appModulePermissionEnum().notNull().default("READ"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    appModulePermissionTypeUq: unique("uq_app_module__permission_type").on(
        table.appModuleId,
        table.type,
    )
}));

export const createAppModulePermissionSchema = createInsertSchema(appModulePermissionModel);

export type AppModulePermission = z.infer<typeof createAppModulePermissionSchema>;

export type AppModulePermissionT = typeof createAppModulePermissionSchema._type;
