import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const bloodGroupModel = pgTable("blood_group", {
    id: serial().primaryKey(),
    type: varchar({ length: 5 }).notNull().unique(),
});

export const createBloodGroupSchema = createInsertSchema(bloodGroupModel);

export type BloodGroup = z.infer<typeof createBloodGroupSchema>;