import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar, index } from "drizzle-orm/pg-core";

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
}, (table) => ({
    // Foreign key indexes for fast joins
    boardIdIdx: index("idx_address_board_id").on(table.boardId),
    personalDetailsIdIdx: index("idx_address_personal_details_id").on(table.personalDetailsId),
    staffIdIdx: index("idx_address_staff_id").on(table.staffId),
    institutionIdIdx: index("idx_address_institution_id").on(table.institutionId),
    accommodationIdIdx: index("idx_address_accommodation_id").on(table.accommodationId),
    personIdIdx: index("idx_address_person_id").on(table.personId),

    // Location indexes
    countryIdIdx: index("idx_address_country_id").on(table.countryId),
    stateIdIdx: index("idx_address_state_id").on(table.stateId),
    cityIdIdx: index("idx_address_city_id").on(table.cityId),
    districtIdIdx: index("idx_address_district_id").on(table.districtId),
    postofficeIdIdx: index("idx_address_postoffice_id").on(table.postofficeId),
    policeStationIdIdx: index("idx_address_police_station_id").on(table.policeStationId),

    // Search indexes
    typeIdx: index("idx_address_type").on(table.type),
    pincodeIdx: index("idx_address_pincode").on(table.pincode),
    phoneIdx: index("idx_address_phone").on(table.phone),

    // Ordering indexes
    createdAtIdx: index("idx_address_created_at").on(table.createdAt),
}));

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