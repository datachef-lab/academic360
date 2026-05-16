
import { integer, pgTable, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const libraryArticleModel = pgTable("library_articles", {
    id: serial().primaryKey(),
    legacyLibraryArticleId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    code: varchar({ length: 500 }),
    isDocumentTypeExist: boolean().notNull().default(false),
    isUniqueAccessNumber: boolean().notNull().default(false),
    isJournal: boolean().notNull().default(false),
    isAuthor: boolean().notNull().default(false),
    isImprint: boolean().notNull().default(false),
    isCopyDetail: boolean().notNull().default(false),
    isKeyword: boolean().notNull().default(false),
    isRemarks: boolean().notNull().default(false),
    isCallNumber: boolean().notNull().default(false),
    isEnclosure: boolean().notNull().default(false),
    isVoucher: boolean().notNull().default(false),
    isAnalytical: boolean().notNull().default(false),
    isCallNumberAuto: boolean().notNull().default(false),
    isCallNumberCompulsory: boolean().notNull().default(false),
    isPublisher: boolean().notNull().default(false),
    isNote: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLibraryArticleSchema = createInsertSchema(libraryArticleModel);

export type LibraryArticle = z.infer<typeof createLibraryArticleSchema>;

export type LibraryArticleT = typeof createLibraryArticleSchema._type;