import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { bloodGroupModel } from "@/schemas/models/resources";

export const healthModel = pgTable("health", {
    id: serial().primaryKey(),
    
    bloodGroupId: integer("blood_group_id_fk").references(() => bloodGroupModel.id),

    identificationMark: varchar("identification_mark", { length: 255 }),
    
    height: varchar("height", { length: 255 }),
    weight: varchar("weight", { length: 255 }),

    hasSpectacles: boolean("has_spectacles").default(false),
    spectaclesNotes: varchar("spectacles_notes", { length: 255 }),
    eyePowerLeft: numeric(),
    eyePowerRight: numeric(),
    
    illness: varchar("illness", { length: 255 }),
    illnessNotes: varchar("illness_notes", { length: 255 }),
    
    allergy: varchar("allergy", { length: 255 }),
    allergyNotes: varchar("allergy_notes", { length: 255 }),

    surgery: varchar("surgery", { length: 255 }),
    surgeryNotes: varchar("surgery_notes", { length: 255 }),

    isInfectedCOVID19: boolean("is_infected_covid19").default(false),
    isVaccinatedCOVID19: boolean("is_vaccinated_covid19").default(false),
    vaccineName: varchar("vaccine_name", { length: 255 }),
    otherVaccineName: varchar("other_vaccine_name", { length: 255 }),

    hasDonatedBlood: boolean("donated_blood").default(false),
    isDonatingBlood: boolean("is_donating_blood").default(false),

    otherHealthConditions: varchar("other_health_conditions", { length: 255 }),
    otherHealthConditionsNotes: varchar("other_health_conditions_notes", { length: 255 }),
    
    pastMedicalHistory: text(),
    pastSurgicalHistory: text(),
    drugAllergy: text(),

    mediclaimId: integer("mediclaim_id_fk"),
    mediclaimFile: varchar("mediclaim_file", { length: 900 }),
    mediclaimProvider: varchar("mediclaim_provider", { length: 255 }),
    mediclaimProviderNumber: varchar("mediclaim_provider_number", { length: 255 }),
    

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createHealthSchema = createInsertSchema(healthModel);

export type Health = z.infer<typeof createHealthSchema>;

export type HealthT = typeof createHealthSchema._type;