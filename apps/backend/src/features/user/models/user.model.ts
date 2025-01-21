import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { pgEnum, pgTable, serial, varchar, boolean } from "drizzle-orm/pg-core";
import { studentModel } from "@/features/academics/models/student.model.ts";
import { z } from "zod";

export const userTypeEnum = pgEnum('user_type', ["ADMIN", "STUDENT", "TEACHER"]);

export const userModel = pgTable('users', {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 500 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 11 }),
    image: varchar({ length: 255 }),
    type: userTypeEnum().default("STUDENT"),
    disabled: boolean().default(false),
});

export const createUserSchema = createInsertSchema(userModel);

export type UserType = z.infer<typeof createUserSchema>;