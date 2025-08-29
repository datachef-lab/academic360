import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const occupationModel = pgTable("occupations", {
    id: serial().primaryKey(),
    legacyOccupationId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createOccupationSchema = createInsertSchema(occupationModel);

export type Occupation = z.infer<typeof createOccupationSchema>;

export type OccupationT = typeof createOccupationSchema._type;