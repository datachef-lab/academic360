import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const documentModel = pgTable("documents", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});