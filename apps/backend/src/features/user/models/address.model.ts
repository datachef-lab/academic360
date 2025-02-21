import { cityModel } from "@/features/resources/models/city.model.js";
import { countryModel } from "@/features/resources/models/country.model.js";
import { stateModel } from "@/features/resources/models/state.model.js";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { localityTypeEnum } from "./helper.js";

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

export type Address = z.infer<typeof createAddressSchema>;