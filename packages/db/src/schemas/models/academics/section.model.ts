import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const sectionModel =  pgTable('sections', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull().unique(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
})

export const createSectionModel = createInsertSchema(sectionModel);

export type Section = z.infer<typeof createSectionModel>;

export type SectionT = typeof createSectionModel._type;