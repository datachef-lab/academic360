import { academic360ApplicationDomainEnum, appModuleIconEnum } from "@/schemas/enums";
import { AnyPgColumn, boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const appModuleModel = pgTable("app_modules", {
   id: serial().primaryKey(),
   application: academic360ApplicationDomainEnum().notNull(),
   parentAppModuleId: integer("parent_app_module_id_fk")
       .references((): AnyPgColumn => appModuleModel.id),
   name: varchar({ length: 500 }).notNull().unique(),
   description: varchar({ length: 1000 }).notNull(),
   iconType: appModuleIconEnum(),
   iconValue: varchar({ length: 255 }),
   moduleUrl: varchar({ length: 1000 }).notNull(),
   image: varchar({ length: 5000 }),
   isMasterModule: boolean().notNull().default(false),
   isReadOnly: boolean().notNull().default(false),
   isActive: boolean().notNull().default(true),
   createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
   updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAppModuleSchema = createInsertSchema(appModuleModel);

export type AppModule = z.infer<typeof createAppModuleSchema>;

export type AppModuleT = typeof createAppModuleSchema._type;
