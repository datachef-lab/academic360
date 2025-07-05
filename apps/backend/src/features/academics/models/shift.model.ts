import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const shiftModel = pgTable('shifts', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    codePrefix: varchar({ length: 10 }).notNull(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createShiftModel = createInsertSchema(shiftModel);

export type Shift = z.infer<typeof createShiftModel>;