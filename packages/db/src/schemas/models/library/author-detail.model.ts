import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { nationalityModel } from "../resources";
import { authorTypeModel } from "./author-type.model";
import { authorModel } from "./author.model";
import { bookModel } from "./book.model";

export const authorDetailsModel = pgTable("author_details", {
    id: serial().primaryKey(),
    legacyAuthorDetailsId: integer(),
    bookId: integer("book_id_fk").references(() => bookModel.id)
        .notNull(),
    authorTypeId: integer("author_type_id_fk")
        .references(() => authorTypeModel.id)
        .notNull(),
    authorId: integer("author_id_fk")
        .references(() => authorModel.id)
        .notNull(),
    remarks: varchar({ length: 1000 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAuthorDetailsSchema = createInsertSchema(authorDetailsModel);

export type AuthorDetails = z.infer<typeof createAuthorDetailsSchema>;

export type AuthorDetailsT = typeof createAuthorDetailsSchema._type;