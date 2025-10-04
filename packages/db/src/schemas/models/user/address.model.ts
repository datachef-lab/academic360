import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { addressTypeEnum, localityTypeEnum } from "@/schemas/enums";
import { boardModel, cityModel, countryModel, institutionModel, stateModel } from "@/schemas/models/resources";
import { districtModel } from "../resources/district.model";
import { personalDetailsModel } from "./personalDetails.model";
import { staffModel } from "./staff.model";
import { accommodationModel } from "./accommodation.model";
import { postOfficeModel } from "./post-office.model";
import { policeStationModel } from "./police-station.model";
import { personModel } from "./person.model";

export const addressModel = pgTable("address", {
    id: serial().primaryKey(),
    boardId: integer("board_id_fk").references(() => boardModel.id),
    personalDetailsId: integer("personal_details_id_fk").references(() => personalDetailsModel.id),
    staffId: integer("staff_id_fk").references(() => staffModel.id),
    institutionId: integer("institution_id_fk").references(() => institutionModel.id),
    accommodationId: integer("accommodation_id_fk").references(() => accommodationModel.id),
    personId: integer("person_id_fk").references(() => personModel.id),

    type: addressTypeEnum(),
    countryId: integer("country_id_fk").references(() => countryModel.id),
    otherCountry: varchar({ length: 255 }),
    previousCountryId: integer("previous_country_id_fk").references(() => countryModel.id),
    previousOtherCountry: varchar({ length: 255 }),

    stateId: integer("state_id_fk").references(() => stateModel.id),
    otherState: varchar({ length: 255 }),
    previousStateId: integer("previous_state_id_fk").references(() => stateModel.id),
    previousOtherState: varchar({ length: 255 }),

    cityId: integer("city_id_fk").references(() => cityModel.id),
    otherCity: varchar({ length: 255 }),
    previousCityId: integer("previous_city_id_fk").references(() => cityModel.id),
    previousOtherCity: varchar({ length: 255 }),

    districtId: integer("district_id_fk").references(() => districtModel.id),
    otherDistrict: varchar({ length: 255 }),
    previousDistrictId: integer("previous_district_id_fk").references(() => districtModel.id),
    previousOtherDistrict: varchar({ length: 255 }),

    address: varchar({ length: 255 }),
    addressLine: varchar({ length: 1000 }),
    landmark: varchar({ length: 255 }),
    localityType: localityTypeEnum(),

    postofficeId: integer("postoffice_id_fk")
        .references(() => postOfficeModel.id),
    otherPostoffice: varchar({ length: 2000 }),

    policeStationId: integer("police_station_id_fk")
        .references(() => policeStationModel.id),
    otherPoliceStation: varchar({ length: 2000 }),

    block: varchar({ length: 255 }),

    phone: varchar({ length: 255 }),
    emergencyPhone: varchar({ length: 255 }),
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