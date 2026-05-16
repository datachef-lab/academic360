import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const borrowingTypeModel = pgTable("borrowing_types", {
    id: serial().primaryKey(),
    legacyBorrowingTypeId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    searchGuideline: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBorrowingTypeSchema = createInsertSchema(borrowingTypeModel);

export type BorrowingType = z.infer<typeof createBorrowingTypeSchema>;

export type BorrowingTypeT = typeof createBorrowingTypeSchema._type;