import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const documentModel = pgTable("documents", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
});