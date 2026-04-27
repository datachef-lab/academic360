import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const enclosureModel = pgTable("enclosures", {
    id: serial().primaryKey(),
    legacyEnclosureId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createEnclosureSchema = createInsertSchema(enclosureModel);

export type Enclosure = z.infer<typeof createEnclosureSchema>;

export type EnclosureT = typeof createEnclosureSchema._type;