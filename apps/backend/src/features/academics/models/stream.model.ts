import { pgEnum, pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const streamLevelEnum = pgEnum('stream_level', ["UNDER_GRADUATE", "POST_GRADUATE"]);

export const streamModel = pgTable('streams', {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    level: streamLevelEnum().notNull().default("UNDER_GRADUATE"),
    duration: integer().notNull(),
    numberOfSemesters: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});