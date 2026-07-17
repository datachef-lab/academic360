import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { index, integer, serial } from "drizzle-orm/pg-core";
import { boolean, date, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { academicYearModel } from "@/schemas/models/academics";

export const sessionModel = pgTable("sessions", {
    id: serial().primaryKey(),
    legacySessionId: integer(),
    academicYearId: integer("academic_id_fk")
        .references(() => academicYearModel.id),
    name: varchar({ length: 255 }).notNull(),
    from: date().notNull(),
    to: date().notNull(),
    isCurrentSession: boolean().notNull().default(false),
    codePrefix: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    // Every report scopes to an academic year through sessions.academic_id_fk.
    academicYearIdx: index("sessions_academic_id_idx").on(t.academicYearId),
}));

const createSessionSchema: z.ZodTypeAny = createInsertSchema(sessionModel);

export type Session = z.infer<typeof createSessionSchema>;

export type SessionT = typeof createSessionSchema._type;