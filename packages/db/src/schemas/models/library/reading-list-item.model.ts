import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { readingListModel } from "./reading-list.model";
import { bookModel } from "./book.model";
import { journalModel } from "./journal.model";

export const readingListItemModel = pgTable("library_reading_list_items", {
    id: serial().primaryKey(),
    readingListId: integer("reading_list_id_fk")
        .references(() => readingListModel.id)
        .notNull(),
    itemType: varchar({ length: 50 }).notNull(),
    bookId: integer("book_id_fk")
        .references(() => bookModel.id),
    journalId: integer("journal_id_fk")
        .references(() => journalModel.id),
    externalUrl: varchar({ length: 2000 }),
    externalTitle: varchar({ length: 500 }),
    notes: varchar({ length: 1000 }),
    displayOrder: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createReadingListItemSchema = createInsertSchema(readingListItemModel);

export type ReadingListItem = z.infer<typeof createReadingListItemSchema>;

export type ReadingListItemT = typeof createReadingListItemSchema._type;
