import { cityModel } from "@/features/resources/models/city.model.ts";
import { countryModel } from "@/features/resources/models/country.model.ts";
import { stateModel } from "@/features/resources/models/state.model.ts";
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const localityTypeEnum = pgEnum("locality_type", ["RURAL", "URBAN"]);

export const addressModel = pgTable("address", {
    id: serial().primaryKey(),
    countryId: integer().references(() => countryModel.id,{onDelete:"cascade",}),
    stateId: integer().references(() => stateModel.id),
    cityId: integer().references(() => cityModel.id),
    addressLine: varchar({ length: 1000 }),
    landmark: varchar({ length: 255 }),
    localityType: localityTypeEnum(),
    phone: varchar({ length: 15 }),
    pincode: varchar({ length: 10 }),
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