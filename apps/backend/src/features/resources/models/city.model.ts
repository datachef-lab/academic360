import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { stateModel } from "./state.model.js";
import { relations } from "drizzle-orm";

export const cityModel = pgTable("cities", {
    id: serial().primaryKey(),
    stateId: integer().notNull().references(() => stateModel.id),
    name: varchar({ length: 255 }).notNull().unique(),
    documentRequired: boolean().notNull().default(false),
    code: varchar({ length: 10 }).notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cityRelations = relations(cityModel, ({ one }) => ({
    state: one(stateModel, {
        fields: [cityModel.stateId],
        references: [stateModel.id]
    })
}));

export const createCitySchema = createInsertSchema(cityModel);

export type City = z.infer<typeof createCitySchema>;