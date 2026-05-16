import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const rackModel = pgTable("racks", {
    id: serial().primaryKey(),
    legacyRackId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRackSchema = createInsertSchema(rackModel);

export type Rack = z.infer<typeof createRackSchema>;

export type RackT = typeof createRackSchema._type;