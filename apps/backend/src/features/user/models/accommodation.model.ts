import { date, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
<<<<<<< HEAD
import { studentModel } from "./student.model.ts";
=======
import { studentModel } from "./student.model.js";
>>>>>>> 90004db6fb605e03f0ecb8df3be32b6658a1417b
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { addressModel } from "./address.model.js";
import { relations } from "drizzle-orm";

export const placeOfStayTypeEnum = pgEnum('place_of_stay_type', ["OWN", "HOSTEL", "FAMILY_FRIENDS", "PAYING_GUEST", "RELATIVES"]);

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