import { degreeLevelTypeEnum } from "@repo/db/schemas/enums";
import { boolean, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const degreeModel = pgTable("degree", {
    id: serial().primaryKey(),
    legacyDegreeId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    level: degreeLevelTypeEnum(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDegreeSchema = createInsertSchema(degreeModel);

export type Degree = z.infer<typeof createDegreeSchema>;