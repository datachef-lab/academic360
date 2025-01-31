import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const specializationModel = pgTable("specializations", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSpecializationSchema = createInsertSchema(specializationModel);

export type Specialization = z.infer<typeof createSpecializationSchema>;