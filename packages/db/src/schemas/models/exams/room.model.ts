import { boolean, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { floorModel } from "./floor.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const roomModel = pgTable("rooms", {
    id: serial().primaryKey(),
    legacyRoomId: integer(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    numberOfBenches: integer().notNull().default(0),
    maxStudentsPerBench: integer().notNull().default(0),
    floorId: integer().references(() => floorModel.id),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    legacyIdNameUnique: unique().on(table.legacyRoomId, table.name),
}));

export const createRoomSchema = createInsertSchema(roomModel);

export type Room = z.infer<typeof createRoomSchema>;

export type RoomT = typeof roomModel.$inferSelect;