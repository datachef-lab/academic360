import { occupationModel } from "@/features/resources/models/occupation.model.ts";
import { qualificationModel } from "@/features/resources/models/qualification.model.ts";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const personModel = pgTable("person", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 255 }),
    aadhaarCardNumber: varchar({ length: 16 }),
    image: varchar({ length: 255 }),
    qualificationId: integer().references(() => qualificationModel.id),
    occupationId: integer().references(() => occupationModel.id),
    officeAddress: varchar({ length: 1000 }),
    officePhone: varchar({ length: 15 }),
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
    })
}));

export const createPersonSchema = createInsertSchema(personModel);

export type Person = z.infer<typeof createPersonSchema>;