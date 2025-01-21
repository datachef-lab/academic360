import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { stateModel } from "./state.model.ts";
import { relations } from "drizzle-orm";

export const cityModel = pgTable("cities", {
    id: serial().primaryKey(),
    stateId: integer().notNull().references(() => stateModel.id),
    name: varchar({ length: 255 }).notNull(),
    documentRequired: boolean().notNull().default(false),
    code: varchar({ length: 10 }).notNull().unique(),
});

export const cityRelations = relations(cityModel, ({ one }) => ({
    state: one(stateModel, {
        fields: [cityModel.stateId],
        references: [stateModel.id]
    })
}));

export const createCitySchema = createInsertSchema(cityModel);

export type city = z.infer<typeof createCitySchema>;