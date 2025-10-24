import { z } from "zod";
// import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar, unique } from "drizzle-orm/pg-core";

import { cityModel } from "@/schemas/models/resources";

export const districtModel = pgTable("districts", {
    id: serial().primaryKey(),
    legacyDistrictId: integer(),
    cityId: integer().notNull().references(() => cityModel.id),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    legacyIdCityIdNameUnique: unique().on(table.legacyDistrictId, table.cityId, table.name),
}));

export const createdistrictSchema = createInsertSchema(districtModel);

export type district = z.infer<typeof createdistrictSchema>;

export type districtT = typeof createdistrictSchema._type;