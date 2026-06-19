import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { authorTypeModel } from "./author-type.model";
import { nationalityModel } from "../resources";

export const authorModel = pgTable("authors", {
    id: serial().primaryKey(),
    legacyAuthorId: integer(),
    authorTypeId: integer("author_type_id_fk").references(() => authorTypeModel.id),
    name: varchar({ length: 1000 }).notNull(),
    shortName: varchar({ length: 1000 }),
    nationalityId: integer("nationality_id_fk")
        .references(() => nationalityModel.id),
    remarks: varchar({ length: 1000 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAuthorSchema = createInsertSchema(authorModel);

export type Author = z.infer<typeof createAuthorSchema>;

export type AuthorT = typeof createAuthorSchema._type;