import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const streamModel = pgTable('streams', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStreamModel = createInsertSchema(streamModel);

export type Stream = z.infer<typeof createStreamModel>;
