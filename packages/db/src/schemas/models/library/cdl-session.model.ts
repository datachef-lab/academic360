import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { bookModel } from "./book.model";
import { userModel } from "../user/user.model";

export const cdlSessionModel = pgTable("library_cdl_sessions", {
    id: serial().primaryKey(),
    bookId: integer("book_id_fk")
        .notNull()
        .references(() => bookModel.id),
    userId: integer("user_id_fk")
        .notNull()
        .references(() => userModel.id),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCdlSessionSchema = createInsertSchema(cdlSessionModel);
export type CdlSession = z.infer<typeof createCdlSessionSchema>;
