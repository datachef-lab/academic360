import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const affiliationModel = pgTable('affiliations', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    remarks: text("remarks"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAffiliationModel = createInsertSchema(affiliationModel) as z.ZodTypeAny;

export type Affiliation = z.infer<typeof createAffiliationModel>;

export type AffiliationT = typeof createAffiliationModel._type;