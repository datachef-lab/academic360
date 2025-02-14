import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const bloodGroupModel = pgTable("blood_group", {
    id: serial().primaryKey(),
    type: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBloodGroupSchema = createInsertSchema(bloodGroupModel);

export type BloodGroup = z.infer<typeof createBloodGroupSchema>;