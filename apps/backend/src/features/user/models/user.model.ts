import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { userTypeEnum } from "./helper.js";

export const userModel = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 500 }).unique().notNull(),
    password: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }),
    whatsappNumber: varchar({ length: 255 }),
    image: varchar({ length: 255 }),
    type: userTypeEnum().default("STUDENT"),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserSchema = createInsertSchema(userModel);

export type User = z.infer<typeof createUserSchema>;