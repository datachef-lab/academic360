import { AnyPgColumn, boolean, doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";
import { borrowingTypeModel } from "./borrowing-type.model";
import { copyDetailsModel } from "./copy-details.model";
import { paymentModel } from "../payments";

export const bookCirculationModel = pgTable("book_circulation", {
    id: serial().primaryKey(),
    legacyBookCirculationId: integer(),
    reIssuedFromParentId: integer("reissued_from_parent_id_fk")
        .references((): AnyPgColumn => bookCirculationModel.id),
    copyDetailsId: integer("copy_details_id_fk")
        .references(() => copyDetailsModel.id)
        .notNull(),
    userId: integer("user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    borrowingTypeId: integer("borrowing_type_id_fk")
        .references(() => borrowingTypeModel.id),
    issueTimestamp: timestamp({ withTimezone: true }).notNull(),
    returnTimestamp: timestamp({ withTimezone: true }).notNull(),
    actualReturnTimestamp: timestamp({ withTimezone: true }),
    isReturned: boolean().default(false).notNull(),
    isReIssued: boolean().default(false).notNull(),
    isForcedIssue: boolean().default(false).notNull(),
    remarks: varchar(),
    fineAmount: doublePrecision().default(0).notNull(),
    fineWaiver: doublePrecision().default(0).notNull(),
    fineWaivedById: integer("fine_waived_by_user_id_fk")
        .references(() => userModel.id),
    fineWaivedAt: timestamp({ withTimezone: true }),
    fineRemarks: varchar(),
    fineDate: timestamp({ withTimezone: true }),
    paymentId: integer("payment_id_fk")
        .references(() => paymentModel.id),
    issuedFromId: integer("issued_from_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    returnedToId: integer("returned_to_user_id_fk")
        .references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBookCirculationSchema = createInsertSchema(bookCirculationModel);

export type BookCirculation = z.infer<typeof createBookCirculationSchema>;

export type BookCirculationT = typeof createBookCirculationSchema._type;
