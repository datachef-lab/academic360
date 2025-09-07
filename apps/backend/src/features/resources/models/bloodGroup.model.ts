import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const bloodGroupModel = pgTable("blood_group", {
  id: serial().primaryKey(),
  legacyBloodGroupId: integer(),
  type: varchar({ length: 255 }).notNull().unique(),
  sequence: integer().unique(),
  disabled: boolean().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createBloodGroupSchema = createInsertSchema(bloodGroupModel);

export type BloodGroup = z.infer<typeof createBloodGroupSchema>;
