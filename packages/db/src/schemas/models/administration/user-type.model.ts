import { AnyPgColumn, boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";


export const userTypeModel = pgTable("user_types", {
   id: serial().primaryKey(),
   parentUserTypeId: integer("parent_user_type_id_fk")
      .references((): AnyPgColumn => userTypeModel.id),
   name: varchar({ length: 255 }).notNull().unique(),
   description: varchar({ length: 500 }),
   code: varchar({ length: 255 }),
   allowedDesignationFiltering: boolean().notNull().default(false),
   allowedModuleTypeFiltering: boolean().notNull().default(false),
   isActive: boolean().default(true).notNull(),
   createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
   updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserTypeSchema = createInsertSchema(userTypeModel);

export type UserType = z.infer<typeof createUserTypeSchema>;

export type UserTypeT = typeof createUserTypeSchema._type;
