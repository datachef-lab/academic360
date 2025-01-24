import { date, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.ts";
import { start } from "repl";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { addressModel } from "./address.model.ts";
import { relations } from "drizzle-orm";

export const stayTypeEnum = pgEnum('stay_type', ["OWN", "HOSTEL", "FAMILY_FRIENDS", "PAYING_GUEST", "RELATIVES"]);

export const accomodationModel = pgTable("accomodation", {
    id: serial().primaryKey(),
    studentId: integer().unique().references(() => studentModel.id),
    placeOfStay: varchar({ length: 255 }),
    stayType: stayTypeEnum(),
    addressId: integer().references(() => addressModel.id),
    startDate: date(),
    endDate: date(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const accomodationRelations = relations(accomodationModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [accomodationModel.studentId],
        references: [studentModel.id]
    }),
    address: one(addressModel, {
        fields: [accomodationModel.addressId],
        references: [addressModel.id]
    }),
}));

export const createAccomodationSchema = createInsertSchema(accomodationModel);

export type Accomodation = z.infer<typeof createAccomodationSchema>;