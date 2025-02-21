import { date, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { addressModel } from "./address.model.js";
import { relations } from "drizzle-orm";
import { placeOfStayTypeEnum } from "./helper.js";

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

export type Accommodation = z.infer<typeof createAccommodationSchema>;