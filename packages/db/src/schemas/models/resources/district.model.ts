import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { cityModel } from "@/schemas/models/resources";

export const districtModel = pgTable("cities", {
    id: serial().primaryKey(),
    legacyDistrictId: integer(),
    cityId: integer().notNull().references(() => cityModel.id),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createdistrictSchema = createInsertSchema(districtModel);

export type district = z.infer<typeof createdistrictSchema>;

export type districtT = typeof createdistrictSchema._type;