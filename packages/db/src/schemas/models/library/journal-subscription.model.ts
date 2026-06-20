import { boolean, date, doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { journalModel } from "./journal.model";
import { vendorModel } from "./vendor.model";

export const journalSubscriptionModel = pgTable("library_journal_subscriptions", {
    id: serial().primaryKey(),
    legacyJournalSubscriptionId: integer(),
    journalId: integer("journal_id_fk")
        .references(() => journalModel.id)
        .notNull(),
    vendorId: integer("vendor_id_fk")
        .references(() => vendorModel.id),
    startDate: date().notNull(),
    endDate: date().notNull(),
    frequency: varchar({ length: 100 }),
    costPerYear: doublePrecision().notNull().default(0),
    isActive: boolean().notNull().default(true),
    remarks: varchar({ length: 1000 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createJournalSubscriptionSchema = createInsertSchema(journalSubscriptionModel);

export type JournalSubscription = z.infer<typeof createJournalSubscriptionSchema>;

export type JournalSubscriptionT = typeof createJournalSubscriptionSchema._type;
