import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const authorTypeModel = pgTable("author_types", {
    id: serial().primaryKey(),
    legacyAuthorTypeId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAuthorTypeSchema = createInsertSchema(authorTypeModel);

export type AuthorType = z.infer<typeof createAuthorTypeSchema>;

export type AuthorTypeT = typeof createAuthorTypeSchema._type;