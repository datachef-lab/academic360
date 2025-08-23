import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { degreeLevelTypeEnum } from "@/schemas/enums";

export const degreeModel = pgTable("degree", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    level: degreeLevelTypeEnum(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDegreeSchema = createInsertSchema(degreeModel);

export type Degree = z.infer<typeof createDegreeSchema>;