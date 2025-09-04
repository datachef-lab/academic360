import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";

import { userTypeEnum } from "@/schemas/enums";
import { personalDetailsModel } from "./personalDetails.model";

export const userModel = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 500 }).unique().notNull(),
    password: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }),
    whatsappNumber: varchar({ length: 255 }),
    image: varchar({ length: 255 }),
    type: userTypeEnum().notNull(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserSchema = createInsertSchema(userModel);

export type User = z.infer<typeof createUserSchema>;

export type UserT = typeof createUserSchema._type;