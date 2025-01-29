import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { degreeModel } from "./degree.model.ts";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { addressModel } from "@/features/user/models/address.model.ts";

export const institutionModel = pgTable("institutions", {
    id: serial().primaryKey(),
    name: varchar({ length: 700 }).notNull().unique(),
    degreeId: integer().notNull().references(() => degreeModel.id),
    addressId: integer().references(() => addressModel.id),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const degreeRelations = relations(institutionModel, ({ one }) => ({
    degree: one(degreeModel, {
        fields: [institutionModel.degreeId],
        references: [degreeModel.id]
    }),
    address: one(addressModel, {
        fields: [institutionModel.addressId],
        references: [addressModel.id]
    }),
}));

export const createInstitutionSchema = createInsertSchema(institutionModel);

export type Institution = z.infer<typeof createInstitutionSchema>;