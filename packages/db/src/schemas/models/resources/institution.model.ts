import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { addressModel } from "@/schemas/models/user";
import { degreeModel } from "@/schemas/models/resources";

export const institutionModel = pgTable("institutions", {
    id: serial().primaryKey(),
    legacyInstitutionId: integer(),
    name: varchar({ length: 700 }).notNull().unique(),
    degreeId: integer("degree_id_fk").references(() => degreeModel.id),
    addressId: integer("address_id_fk").references(() => addressModel.id),
    sequence: integer().unique(),
    disabled: boolean().default(false),
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

export type InstitutionT = typeof createInstitutionSchema._type;