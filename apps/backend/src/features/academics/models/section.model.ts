import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sectionModel =  pgTable('sections', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
})

export const createSectionModel = createInsertSchema(sectionModel);

export type Section = z.infer<typeof createSectionModel>;