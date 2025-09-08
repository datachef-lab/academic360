import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const shiftModel = pgTable('shifts', {
    id: serial().primaryKey(),
    legacyShiftId: integer("legacy_shift_id"),
    name: varchar({ length: 500 }).notNull(),
    codePrefix: varchar({ length: 10 }).notNull(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createShiftModel = createInsertSchema(shiftModel) as z.ZodTypeAny;

export type Shift = z.infer<typeof createShiftModel>;

export type ShiftT = typeof createShiftModel._type;