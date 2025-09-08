import { z } from "zod";
// import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { addressModel } from "@/schemas/models/user";
import { degreeModel } from "@/schemas/models/resources";

export const boardModel = pgTable("boards", {
    id: serial().primaryKey(),
    legacyBoardId: integer(),
    name: varchar({ length: 700 }).notNull().unique(),
    degreeId: integer().references(() => degreeModel.id),
    passingMarks: integer(),
    code: varchar({ length: 255 }),
    addressId: integer().references(() => addressModel.id),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBoardSchema = createInsertSchema(boardModel) as z.ZodTypeAny;

export type Board = z.infer<typeof createBoardSchema>;

export type BoardT = typeof createBoardSchema._type;