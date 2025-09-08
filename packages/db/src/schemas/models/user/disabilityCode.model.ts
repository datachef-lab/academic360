import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const disabilityCodeModel = pgTable("disability_codes", {
    id: serial().primaryKey(),
    legacyDisabilityCodeId: integer(),
    code: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDisabilityCodeSchema = createInsertSchema(disabilityCodeModel) as z.ZodTypeAny;

export type Disability = z.infer<typeof createDisabilityCodeSchema>;

export type DisabilityCodeT = typeof createDisabilityCodeSchema._type;