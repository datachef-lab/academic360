import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const shelfModel = pgTable("shelfs", {
    id: serial().primaryKey(),
    legacyShelfId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createShelfSchema = createInsertSchema(shelfModel);

export type Shelf = z.infer<typeof createShelfSchema>;

export type ShelfT = typeof createShelfSchema._type;