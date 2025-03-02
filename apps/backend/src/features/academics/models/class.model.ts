import { classTypeEnum } from "@/features/user/models/helper.js";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const classModel = pgTable('classes', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    type: classTypeEnum().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createClassModel = createInsertSchema(classModel);

export type Class = z.infer<typeof createClassModel>;