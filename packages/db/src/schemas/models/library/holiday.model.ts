import { date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const holidayModel = pgTable("holidays", {
    id: serial().primaryKey(),
    legacyHolidayId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    shortName: varchar({ length: 1000 }),
    from: date().notNull(),
    to: date().notNull(),
    remarks: varchar({ length: 1000 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createHolidaySchema = createInsertSchema(holidayModel);

export type Holiday = z.infer<typeof createHolidaySchema>;

export type HolidayT = typeof createHolidaySchema._type;