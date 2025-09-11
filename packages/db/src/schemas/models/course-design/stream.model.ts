import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const streamModel = pgTable('streams', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    ugPrefix: varchar({ length: 10 }),
    pgPrefix: varchar({ length: 10 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStreamModel = createInsertSchema(streamModel) as z.ZodTypeAny;

export type Stream = z.infer<typeof createStreamModel>;

export type StreamT = typeof createStreamModel._type;