import { genderTypeEnum } from "@/schemas/enums";
import { date, integer, pgTable, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { sessionModel } from "../academics";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const identityMasterModel = pgTable("identity_master", {
    id: serial().primaryKey(),
    sesionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    firstName: varchar({ length: 500 }).notNull(),
    middleName: varchar({ length: 500 }),
    lastName: varchar({ length: 500 }),
    email: varchar({ length: 500 }),
    alternativeEmail: varchar({ length: 500 }),
    phone: varchar({ length: 15 }),
    dateOfBirth: date(),
    gender: genderTypeEnum(),
    whatsappNumber: varchar({ length: 15 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow().$onUpdate(() => new Date())
}, (table) => ({
    sessionNameEmailPhoneDOBGenderUnique: unique("uq_session_name_email_phone_dob_gender").on(
        table.sesionId,
        table.firstName,
        table.middleName,
        table.lastName,
        table.email,
        table.alternativeEmail,
        table.phone,
        table.dateOfBirth,
        table.gender,
        table.whatsappNumber,
    )
}));

export const createIdentityMasterSchema = createInsertSchema(identityMasterModel);

export type IdentityMaster = z.infer<typeof createIdentityMasterSchema>;

export type IdentityMasterT = typeof createIdentityMasterSchema._type;
