import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar, unique } from "drizzle-orm/pg-core";

export const countryModel = pgTable("countries", {
    id: serial().primaryKey(),
    legacyCountryId: integer(),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    legacyIdNameUnique: unique().on(table.legacyCountryId, table.name),
}));

export const createCountrySchema = createInsertSchema(countryModel);

export type Country = z.infer<typeof createCountrySchema>;

export type CountryT = typeof createCountrySchema._type;