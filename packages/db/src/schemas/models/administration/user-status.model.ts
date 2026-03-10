import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userStatusModel = pgTable("user_statuses", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserStatusSchema = createInsertSchema(userStatusModel);

export type UserStatus = z.infer<typeof createUserStatusSchema>;

export type UserStatusT = typeof createUserStatusSchema._type;