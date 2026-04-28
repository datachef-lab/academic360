import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { bookCirculationModel } from "./book-circulation.model";
import { userModel } from "../user";

export const bookReissueModel = pgTable("book_reissue", {
    id: serial().primaryKey(),
    bookCirculationId: integer("book_circulation_id_fk")
        .references(() => bookCirculationModel.id),
    reissuedBy: integer("reissued_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBookReissueSchema = createInsertSchema(bookReissueModel);

export type BookReissue = z.infer<typeof createBookReissueSchema>;

export type BookReissueT = typeof createBookReissueSchema._type;