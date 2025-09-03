import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { localityTypeEnum } from "@/schemas/enums";
import { cityModel, countryModel, stateModel } from "@/schemas/models/resources";
import { districtModel } from "../resources/district.model";

export const addressModel = pgTable("address", {
    id: serial().primaryKey(),
    countryId: integer("country_id_fk").references(() => countryModel.id),
    otherCountry: varchar({ length: 255 }),
    
    stateId: integer("state_id_fk").references(() => stateModel.id),
    otherState: varchar({ length: 255 }),

    cityId: integer("city_id_fk").references(() => cityModel.id),
    otherCity: varchar({ length: 255 }),

    districtId: integer("district_id_fk").references(() => districtModel.id),
    
    addressLine: varchar({ length: 1000 }),
    landmark: varchar({ length: 255 }),
    localityType: localityTypeEnum(),

    postofficeId: integer("postoffice_id"),
    otherPostoffice: varchar({ length: 2000 }),

    policeStationId: integer("police_station_id"),
    otherPoliceStation: varchar({ length: 2000 }),
    
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

export type AddressT = typeof createAddressSchema._type;