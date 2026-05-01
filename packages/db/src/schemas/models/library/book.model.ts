import { boolean, date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { libraryDocumentTypeModel } from "./library-document-type.model";
import { languageMediumModel } from "../resources";
import { seriesModel } from "./series.model";
import { publisherModel } from "./publisher.model";
import { journalModel } from "./journal.model";
import { enclosureModel } from "./enclosure.model";
import { userModel } from "../user";
import { libraryPeriodModel } from "./library-period.model";
import { subjectGroupingMainModel } from "../course-design";

export const bookModel = pgTable("books", {
    id: serial().primaryKey(),
    legacyBooksId: integer(),
    libraryDocumentTypeId: integer("library_document_type_id_fk")
        .references(() => libraryDocumentTypeModel.id),
    title: varchar({ length: 1000 }).notNull(),
    subTitle: varchar({ length: 1000 }),
    alternateTitle: varchar({ length: 1000 }),
    subjectGroupId: integer("subject_group_id_fk")
        .references(() => subjectGroupingMainModel.id),
    languageId: integer("language_id_fk")
        .references(() => languageMediumModel.id),
    isbn: varchar({ length: 1000 }),
    issueDate: date(),
    edition: varchar({ length: 255 }),
    editionYear: varchar({ length: 255 }),
    bookVolume: varchar({ length: 255 }),
    bookPart: varchar({ length: 255 }),
    seriesId: integer("series_id_fk")
        .references(() => seriesModel.id),
    publisherId: integer("publisher_id_fk")
        .references(() => publisherModel.id),
    publishedYear: varchar({ length: 255 }),
    keywords: varchar({ length: 1000 }),
    remarks: varchar({ length: 1000 }),
    callNumber: varchar({ length: 255 }),
    journalId: integer("journal_id_fk")
        .references(() => journalModel.id),
    issueNumber: varchar({ length: 255 }),
    isUniqueAccess: boolean().notNull().default(false),
    enclosureId: integer("enclosure_id_fk")
        .references(() => enclosureModel.id),
    notes: varchar({ length: 1000 }),
    issueDate1: date(),
    issueDate2: date(),
    monthFromAt1: varchar({ length: 255 }),
    monthFromAt2: varchar({ length: 255 }),
    frontCover: varchar(),
    backCover: varchar(),
    softCopy: varchar(),
    frequency: integer("library_period_id_fk")
        .references(() => libraryPeriodModel.id),
    referenceNumber: varchar({ length: 255 }),
    createdById: integer("created_by_user_id_fk")
        .references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedById: integer("updated_by_user_id_fk")
        .references(() => userModel.id),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBookSchema = createInsertSchema(bookModel);

export type Book = z.infer<typeof createBookSchema>;

export type BookT = typeof createBookSchema._type;