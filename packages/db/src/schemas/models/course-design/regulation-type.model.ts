import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const regulationTypeModel = pgTable('regulation_types', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRegulationTypeModel = createInsertSchema(regulationTypeModel) as z.ZodTypeAny;

export type RegulationType = z.infer<typeof createRegulationTypeModel>; 

export type RegulationTypeT = typeof createRegulationTypeModel._type;
