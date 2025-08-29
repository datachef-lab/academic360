import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const specializationModel = pgTable("specializations", {
    id: serial().primaryKey(),
    legacySpecializationId: integer("legacy_specialization_id"),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSpecializationSchema = createInsertSchema(specializationModel);

export type Specialization = z.infer<typeof createSpecializationSchema>;

export type SpecializationT = typeof createSpecializationSchema._type;