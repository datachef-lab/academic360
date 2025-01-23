import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const languageMediumModel = pgTable("language_medium", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});