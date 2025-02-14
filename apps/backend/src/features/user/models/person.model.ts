import { occupationModel } from "@/features/resources/models/occupation.model.js";
import { qualificationModel } from "@/features/resources/models/qualification.model.js";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { addressModel } from "./address.model.js";

export const personModel = pgTable("person", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 255 }),
    aadhaarCardNumber: varchar({ length: 255 }),
    image: varchar({ length: 255 }),
    qualificationId: integer("qualification_id_fk").references(() => qualificationModel.id),
    occupationId: integer("occupation_id_fk").references(() => occupationModel.id),
    officeAddressId: integer("office_addres_id_fk").references(() => addressModel.id),
    officePhone: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const personRelations = relations(personModel, ({ one }) => ({
    qualification: one(qualificationModel, {
        fields: [personModel.qualificationId],
        references: [qualificationModel.id]
    }),
    occupation: one(occupationModel, {
        fields: [personModel.occupationId],
        references: [occupationModel.id]
    }),
    address: one(addressModel, {
        fields: [personModel.officeAddressId],
        references: [addressModel.id]
    })
}));

export const createPersonSchema = createInsertSchema(personModel);

export type Person = z.infer<typeof createPersonSchema>;