import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { libraryArticleModel } from "./library-article.model";

export const libraryDocumentTypeModel = pgTable("library_document_types", {
    id: serial().primaryKey(),
    legacyLibraryDocumentTypeId: integer(),
    libraryArticleId: integer("library_article_id_fk")
        .references(() => libraryArticleModel.id),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLibraryDocumentTypeSchema = createInsertSchema(libraryDocumentTypeModel);

export type LibraryDocumentType = z.infer<typeof createLibraryDocumentTypeSchema>;

export type LibraryDocumentTypeT = typeof createLibraryDocumentTypeSchema._type;