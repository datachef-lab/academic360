import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { addressTypeEnum, localityTypeEnum } from "@/schemas/enums";
import { boardModel, cityModel, countryModel, institutionModel, stateModel } from "@/schemas/models/resources";
import { districtModel } from "../resources/district.model";
import { personalDetailsModel } from "./personalDetails.model";
import { staffModel } from "./staff.model";

export const addressModel = pgTable("address", {
    id: serial().primaryKey(),
    boardId: integer("board_id_fk").references(() => boardModel.id),
    personalDetailsId: integer("personal_details_id_fk").references(() => personalDetailsModel.id),
    staffId: integer("staff_id_fk").references(() => staffModel.id),
    institutionId: integer("institution_id_fk").references(() => institutionModel.id),
    
    type: addressTypeEnum(),
    countryId: integer("country_id_fk").references(() => countryModel.id),
    otherCountry: varchar({ length: 255 }),

    stateId: integer("state_id_fk").references(() => stateModel.id),
    otherState: varchar({ length: 255 }),

    cityId: integer("city_id_fk").references(() => cityModel.id),
    otherCity: varchar({ length: 255 }),

    districtId: integer("district_id_fk").references(() => districtModel.id),
    otherDistrict: varchar({ length: 255 }),

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
    }),
    district: one(districtModel, {
        fields: [addressModel.districtId],
        references: [districtModel.id]
    })
}));

export const createAddressSchema = createInsertSchema(addressModel);


export type Address = z.infer<typeof createAddressSchema>;

// export type AddressUpdate = z.infer<typeof updateAddressSchema>;

export type AddressT = typeof createAddressSchema._type;