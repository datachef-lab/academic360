import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const nationalityModel = pgTable("nationality", {
    id: serial().primaryKey(),
    legacyNationalityId: integer(),
    name: varchar({ length: 255 }).notNull(),
    code: integer(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createNationalitySchema = createInsertSchema(nationalityModel);

export type Nationality = z.infer<typeof createNationalitySchema>;

export type NationalityT = typeof createNationalitySchema._type;