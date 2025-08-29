import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, serial } from "drizzle-orm/pg-core";
import { boolean, date, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { academicYearModel } from "@/schemas/models/academics";

export const sessionModel = pgTable("sessions", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_id_fk")
        .references(() => academicYearModel.id),
    name: varchar({ length: 255 }).notNull(),
    from: date().notNull(),
    to: date().notNull(),
    isCurrentSession: boolean().notNull().default(false),
    codePrefix: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

const createSessionSchema = createInsertSchema(sessionModel);

export type Session = z.infer<typeof createSessionSchema>;

export type SessionT = typeof createSessionSchema._type;