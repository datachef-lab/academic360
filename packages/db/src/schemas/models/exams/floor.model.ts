import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const floorModel = pgTable("floors", {
    id: serial().primaryKey(),
    legacyFloorId: integer(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    legacyIdNameUnique: unique().on(table.legacyFloorId, table.name),
}));

export const createFloorSchema = createInsertSchema(floorModel);

export type Floor = z.infer<typeof createFloorSchema>;

export type FloorT = typeof floorModel.$inferSelect;