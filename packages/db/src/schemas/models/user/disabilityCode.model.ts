import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const disabilityCodeModel = pgTable("disability_codes", {
    id: serial().primaryKey(),
    code: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDisabilityCodeSchema = createInsertSchema(disabilityCodeModel);

export type Disability = z.infer<typeof createDisabilityCodeSchema>;