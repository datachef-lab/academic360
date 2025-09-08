import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { stateModel } from "@/schemas/models/resources";

export const cityModel = pgTable("cities", {
    id: serial().primaryKey(),
    legacyCityId: integer(),
    stateId: integer().notNull().references(() => stateModel.id),
    name: varchar({ length: 255 }),
    documentRequired: boolean().notNull().default(false),
    code: varchar({ length: 10 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cityRelations = relations(cityModel, ({ one }) => ({
    state: one(stateModel, {
        fields: [cityModel.stateId],
        references: [stateModel.id]
    })
}));

export const createCitySchema = createInsertSchema(cityModel) as z.ZodTypeAny;

export type City = z.infer<typeof createCitySchema>;

export type CityT = typeof createCitySchema._type;