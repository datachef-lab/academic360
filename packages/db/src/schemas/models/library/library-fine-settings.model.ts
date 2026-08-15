import { boolean, integer, pgTable, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

// Single-row settings + scheduler state for automatic fine accrual.
// accrualGoLiveDate is seeded by the migration with now(), so each environment
// starts accruing only from the moment the feature lands there — overdue days
// before go-live are forgiven by design.
export const libraryFineSettingsModel = pgTable("library_fine_settings", {
    onlyRow: boolean().primaryKey().default(true),
    accrualGoLiveDate: timestamp({ withTimezone: true }).notNull().defaultNow(),
    running: boolean().notNull().default(false),
    lastRunAt: timestamp({ withTimezone: true }),
    lastDurationMs: integer(),
    lastProcessed: integer(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLibraryFineSettingsSchema = createInsertSchema(libraryFineSettingsModel);

export type LibraryFineSettings = z.infer<typeof createLibraryFineSettingsSchema>;

export type LibraryFineSettingsT = typeof createLibraryFineSettingsSchema._type;
