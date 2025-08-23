import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { localityTypeEnum } from "@/schemas/enums";
import { cityModel, countryModel, stateModel } from "@/schemas/models/resources";

export const addressModel = pgTable("address", {
    id: serial().primaryKey(),
    countryId: integer("country_id_fk").references(() => countryModel.id),
    stateId: integer("state_id_fk").references(() => stateModel.id),
    cityId: integer("city_id_fk").references(() => cityModel.id),
    addressLine: varchar({ length: 1000 }),
    landmark: varchar({ length: 255 }),
    localityType: localityTypeEnum(),
    phone: varchar({ length: 255 }),
    pincode: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const addressRelations = relations(addressModel, ({ one }) => ({
    country: one(countryModel, {
        fields: [addressModel.countryId],
        references: [countryModel.id]
    }),
    state: one(stateModel, {
        fields: [addressModel.stateId],
        references: [stateModel.id]
    }),
    city: one(cityModel, {
        fields: [addressModel.cityId],
        references: [cityModel.id]
    })
}));

export const createAddressSchema = createInsertSchema(addressModel);

// Schema for updates that excludes timestamp fields
export const updateAddressSchema = createAddressSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
});

export type Address = z.infer<typeof createAddressSchema>;
export type AddressUpdate = z.infer<typeof updateAddressSchema>;