import { date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { journalSubscriptionModel } from "./journal-subscription.model";

export const journalIssueModel = pgTable("library_journal_issues", {
    id: serial().primaryKey(),
    legacyJournalIssueId: integer(),
    subscriptionId: integer("subscription_id_fk")
        .references(() => journalSubscriptionModel.id)
        .notNull(),
    issueNumber: varchar({ length: 255 }).notNull(),
    expectedDate: date().notNull(),
    receivedDate: date(),
    condition: varchar({ length: 255 }),
    remarks: varchar({ length: 1000 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createJournalIssueSchema = createInsertSchema(journalIssueModel);

export type JournalIssue = z.infer<typeof createJournalIssueSchema>;

export type JournalIssueT = typeof createJournalIssueSchema._type;
