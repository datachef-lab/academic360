import { academic360ApplicationDomainEnum } from "@/schemas/enums";
import { boolean, varchar, pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userGroupModel = pgTable("user_groups", {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull().unique(),
    shortName: varchar({ length: 500 }),
    code: varchar({ length: 255 }),
    sequence: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserGroupSchema = createInsertSchema(userGroupModel);

export type UserGroup = z.infer<typeof createUserGroupSchema>;

export type UserGroupT = typeof createUserGroupSchema._type;