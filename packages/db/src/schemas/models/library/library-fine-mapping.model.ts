import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";
import { paymentModel } from "../payments";
import { bookCirculationModel } from "./book-circulation.model";
import { circulationPolicyModel } from "./circulation-policy.model";

// Per-circulation fine ledger, modeled on fee_student_mappings. Authoritative
// for waiver/payment; book_circulation.fine_amount is a denormalized display
// cache mirrored in the same transaction. Status (OUTSTANDING/PAID/WAIVED) is
// derived at read from amountPaid + waivedAmount vs fineAmount, never stored.
export const libraryFineMappingModel = pgTable("library_fine_mappings", {
    id: serial().primaryKey(),
    bookCirculationId: integer("book_circulation_id_fk")
        .references(() => bookCirculationModel.id)
        .notNull()
        .unique(),
    userId: integer("user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    policyId: integer("policy_id_fk")
        .references(() => circulationPolicyModel.id),
    finePerDaySnapshot: doublePrecision().notNull().default(0),
    accruedFrom: timestamp({ withTimezone: true }),
    accruedUpto: timestamp({ withTimezone: true }),
    billableDays: integer().notNull().default(0),
    fineAmount: doublePrecision().notNull().default(0),
    waivedAmount: doublePrecision().notNull().default(0),
    waivedByUserId: integer("waived_by_user_id_fk")
        .references(() => userModel.id),
    waivedAt: timestamp({ withTimezone: true }),
    waiverRemarks: varchar({ length: 1000 }),
    amountPaid: doublePrecision().notNull().default(0),
    paymentId: integer("payment_id_fk")
        .references(() => paymentModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLibraryFineMappingSchema = createInsertSchema(libraryFineMappingModel);

export type LibraryFineMapping = z.infer<typeof createLibraryFineMappingSchema>;

export type LibraryFineMappingT = typeof createLibraryFineMappingSchema._type;
