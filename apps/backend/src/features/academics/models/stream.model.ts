import { pgEnum, pgTable, serial, varchar, boolean } from "drizzle-orm/pg-core";

export const streamLevelEnum = pgEnum('stream_level', ["UNDER_GRADUATE", "POST_GRADUATE"]);

export const streamModel = pgTable('streams', {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    level: streamLevelEnum().default("UNDER_GRADUATE"),
});