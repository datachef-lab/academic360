import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { placeOfStayTypeEnum } from "@/schemas/enums";
import { addressModel, studentModel } from "@/schemas/models/user";

export const accommodationModel = pgTable("accommodation", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").unique().references(() => studentModel.id),
    placeOfStay: placeOfStayTypeEnum(),
    addressId: integer("address_id_fk").references(() => addressModel.id),
    startDate: date(),
    endDate: date(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const accommodationRelations = relations(accommodationModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [accommodationModel.studentId],
        references: [studentModel.id]
    }),
    address: one(addressModel, {
        fields: [accommodationModel.addressId],
        references: [addressModel.id]
    }),
}));

export const createAccommodationSchema = createInsertSchema(accommodationModel);

// Schema for updates that excludes timestamp fields
export const updateAccommodationSchema = createAccommodationSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
});

export type Accommodation = z.infer<typeof createAccommodationSchema>;
export type AccommodationUpdate = z.infer<typeof updateAccommodationSchema>;